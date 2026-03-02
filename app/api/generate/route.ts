import { NextRequest, NextResponse } from 'next/server'
import { Agent } from 'undici'
import { buildPrompt, buildPromptSummary } from '@/app/utils/promptBuilder'

/** Timeouts for Gemini API (ms). Image generation can take 60–120+ seconds. */
const GEMINI_TEXT_TIMEOUT_MS = 120_000
const GEMINI_IMAGE_TIMEOUT_MS = 180_000
const GEMINI_RETRY_ATTEMPTS = 2
const GEMINI_RETRY_DELAY_MS = 3000

function isRetryableNetworkError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message
    const cause = (err as Error & { cause?: { code?: string } }).cause
    const code = cause?.code
    return (
      msg.includes('fetch failed') ||
      msg.includes('Headers Timeout') ||
      msg.includes('UND_ERR_HEADERS_TIMEOUT') ||
      code === 'ECONNRESET' ||
      code === 'ETIMEDOUT' ||
      code === 'ECONNREFUSED'
    )
  }
  return false
}

async function fetchGemini(
  url: string,
  options: RequestInit & { body: string },
  timeoutMs: number
): Promise<Response> {
  const dispatcher = new Agent({
    headersTimeout: timeoutMs,
    bodyTimeout: timeoutMs,
  })
  let lastError: unknown
  for (let attempt = 0; attempt <= GEMINI_RETRY_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        dispatcher,
      })
      return res
    } catch (err) {
      lastError = err
      if (attempt < GEMINI_RETRY_ATTEMPTS && isRetryableNetworkError(err)) {
        console.warn(`Gemini request attempt ${attempt + 1} failed (${err instanceof Error ? err.message : err}). Retrying in ${GEMINI_RETRY_DELAY_MS}ms...`)
        await new Promise((r) => setTimeout(r, GEMINI_RETRY_DELAY_MS))
        continue
      }
      throw err
    }
  }
  throw lastError
}

// --- Guardrails to avoid safety filters, model limits, and input size issues ---
const DESIGN_CONTEXT_PREFIX =
  'Context: Professional interior/exterior design and room configuration visualization. All content is for design purposes only.\n\n'

/** Max characters for text sent to Gemini (avoids token/input limits and reduces filter risk). */
const MAX_PROMPT_CHARS = 24000
/** Max room images sent to the image model (reduces input size and improves reliability). */
const MAX_ROOM_IMAGES_FOR_IMAGE_MODEL = 3
/** Max component reference images sent to the image model. */
const MAX_COMPONENT_IMAGES_FOR_IMAGE_MODEL = 3
/** Max length for user-supplied text (e.g. fullRoomAdditionalText) to avoid oversized prompts. */
const MAX_USER_TEXT_CHARS = 2000

function capUserText(s: string | undefined): string {
  if (!s?.trim()) return ''
  return s.trim().length > MAX_USER_TEXT_CHARS ? s.trim().slice(0, MAX_USER_TEXT_CHARS) + ' [trimmed]' : s.trim()
}

function truncatePrompt(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text
  const keepStart = Math.floor(maxChars * 0.6)
  const keepEnd = maxChars - keepStart - 50 // reserve for "... [prompt truncated] ..."
  return text.slice(0, keepStart) + '\n\n... [prompt truncated for length] ...\n\n' + text.slice(text.length - keepEnd)
}

/**
 * API Route: /api/generate
 * 
 * Handles room configuration image generation requests
 * 
 * Expected request body:
 * {
 *   images: string[],                    // Array of base64 room image strings
 *   componentReferenceImages?: string[], // Optional component reference images
 *   componentReferenceLabels?: string[], // Optional short labels describing each reference
 *   configMode: 'purpose' | 'arrangement',
 *   purposeInput?: string,
 *   fullRoomReferenceImages?: string[],  // Reference image(s) for Full Room Configuration
 *   fullRoomAdditionalText?: string,    // Optional extra text for Full Room Configuration
 *   arrangementConfig?: {
 *     numberOfDesks: number,
 *     deskType: 'linear' | 'cluster',
 *     collaborationArea: boolean,
 *     storageLevel: 'low' | 'medium' | 'high'
 *   },
 *   vastuEnabled: boolean,
 *   shuffle?: boolean
 * }
 */

/**
 * Generate image using Google Gemini API for prompt enhancement
 * and Stability AI (or Replicate) for actual image-to-image generation
 * 
 * @param images - Reference images (base64 strings)
 * @param prompt - Generated prompt for AI
 * @returns Generated image as data URL string, or { imageUrl, warning } when falling back (e.g. Gemini returned empty content / finishReason OTHER)
 */
interface CustomizationLabelEntry {
  label: string
  description: string
  isDecor: boolean
}

async function generateImageWithAI(
  images: string[],
  prompt: string,
  componentReferenceImages?: string[],
  componentReferenceLabels?: string[],
  fullRoomReferenceImages?: string[],
  fullRoomAdditionalText?: string,
  configType: 'internal' | 'external' = 'internal',
  shuffle: boolean = false,
  isCustomizationMode: boolean = false,
  customizationLabels?: Record<string, CustomizationLabelEntry>
): Promise<string | { imageUrl: string; warning: string }> {
  const isExternal = configType === 'external'
  const userSpaceLabel = isExternal ? "USER'S ORIGINAL PROPERTY/HOUSE" : "USER'S ROOM"
  const geminiApiKey = process.env.IMAGE_GENERATION_API_KEY

  if (!geminiApiKey) {
    console.log('No Gemini API key found. Using placeholder image generation.')
    return generatePlaceholderImage(images, prompt)
  }

  try {
    /**
     * Convert unsupported MIME types to JPEG
     * Gemini API supports: image/jpeg, image/png, image/webp, image/gif
     * Does NOT support: image/avif, image/heic, etc.
     */
    const normalizeMimeType = (mimeType: string): string => {
      const supported = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      if (supported.includes(mimeType)) {
        return mimeType
      }
      // Convert unsupported formats to JPEG
      console.log(`Converting unsupported MIME type ${mimeType} to image/jpeg`)
      return 'image/jpeg'
    }

    // Step 1: Use Gemini to analyze images and enhance the prompt
    const roomImageParts = images.slice(0, 4).map(img => {
      let mimeType = 'image/jpeg'
      let base64Data = img
      
      if (img.includes(',')) {
        const [header, data] = img.split(',')
        base64Data = data
        
        const mimeMatch = header.match(/data:([^;]+)/)
        if (mimeMatch) {
          mimeType = normalizeMimeType(mimeMatch[1])
        }
      }
      
      return {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      }
    })

    // Full Room reference images (for purpose mode) - style/layout reference for reconfiguration
    const fullRoomRefParts = (fullRoomReferenceImages || []).slice(0, 4).map(img => {
      let mimeType = 'image/jpeg'
      let base64Data = img
      if (img.includes(',')) {
        const [header, data] = img.split(',')
        base64Data = data
        const mimeMatch = header.match(/data:([^;]+)/)
        if (mimeMatch) mimeType = normalizeMimeType(mimeMatch[1])
      }
      return { inlineData: { data: base64Data, mimeType } }
    })

    // Component reference images (style / design only)
    const componentParts = (componentReferenceImages || []).slice(0, 6).map((img, index) => {
      let mimeType = 'image/jpeg'
      let base64Data = img

      if (img.includes(',')) {
        const [header, data] = img.split(',')
        base64Data = data

        const mimeMatch = header.match(/data:([^;]+)/)
        if (mimeMatch) {
          mimeType = normalizeMimeType(mimeMatch[1])
        }
      }

      return {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
        label: componentReferenceLabels?.[index] || '',
      }
    })

    // Build reference component description if provided (style, elements, furniture, colors, components ONLY; not layout/size)
    const referenceComponentsText = componentParts.length > 0
      ? `\n\nREFERENCE COMPONENT IMAGES PROVIDED (${componentParts.length} images):
Use reference ONLY for: style, elements, furniture types, colors, components. Do NOT use reference for room layout, size, length, width, or height—those must come from the user's uploaded images and must NOT change.
${componentParts
  .map((comp, idx) => {
    const label = comp.label || `Component ${idx + 1}`
    return `- ${label}: Use this reference for style, design, material, color of this component type. When placing similar components in the room, match the visual style and characteristics. Room layout and dimensions come ONLY from the user's room images.`
  })
  .join('\n')}

IMPORTANT: Reference = style, elements, furniture, colors, components ONLY. Layout and dimensions of the room must remain exactly as in the user's uploaded images.`
      : ''

    // CRITICAL: Reference = style/elements/furniture/colors/components ONLY. Layout/size/length/width/height must NOT change.
    const doNotCopyRefBlock = fullRoomRefParts.length > 0
      ? `

CRITICAL - REFERENCE IMAGE USAGE:
- Reference image(s) are for extracting ONLY: style, elements, furniture, colors, components. Do NOT use reference for layout, size, length, width, height, or proportions.
- Layout, size, length, width, height MUST come ONLY from the user's UPLOADED images. They must NOT change in the generated output.
- Your output MUST be the user's ORIGINAL ${isExternal ? 'property (first images above)' : 'room (first images above)'} - same ${isExternal ? 'building' : 'room'}, same structure, same layout, same dimensions.
- From reference use ONLY: style, elements, furniture types, colors, components. The result must be the user's original ${isExternal ? 'property' : 'room'} with reference-inspired style, NOT a copy of the reference.`
      : ''

    // Full Room/External reference: use reference ONLY for style, elements, furniture, colors, components. Layout/size must not change.
    const fullRoomRefText = fullRoomRefParts.length > 0
      ? `\n\nFULL CONFIGURATION - REFERENCE IMAGES (${fullRoomRefParts.length} image(s)):
Reference = style, elements, furniture, colors, components ONLY. Layout, size, length, width, height must NOT change; they come ONLY from the user's uploaded images.
You MUST:
1. PRESERVE the user's ORIGINAL ${isExternal ? 'property (first images)' : 'room (first images)'} - same ${isExternal ? 'building shape, facade, doors, windows, balconies, staircase, size' : 'room structure, walls, floor, ceiling, doors, windows, dimensions'}.
2. Use the reference ONLY to extract: style, elements, furniture, colors, components (e.g. ${isExternal ? 'lighting style, landscaping, color tone' : 'furniture style, color palette, decor'}). Do NOT take layout or dimensions from the reference.
3. Do NOT copy or redraw the reference ${isExternal ? 'building' : 'room'}. The output must BE the user's original ${isExternal ? 'property' : 'room'} from the first set of images, with the same layout and size.
4. ${isExternal ? 'Only styling (elements, colors, components) may be inspired by the reference. Building layout, size, length, width, height come ONLY from the user\'s images.' : 'Only furniture and decor may be inspired by the reference. Room layout, size, length, width, height come ONLY from the user\'s images.'}
${capUserText(fullRoomAdditionalText) ? `\nAdditional user instructions:\n${capUserText(fullRoomAdditionalText)}` : ''}${doNotCopyRefBlock}`
      : capUserText(fullRoomAdditionalText)
        ? `\n\nAdditional user instructions for reconfiguration:\n${capUserText(fullRoomAdditionalText)}`
        : ''

    const structureLabel = isExternal ? 'PROPERTY STRUCTURE' : 'ROOM STRUCTURE'
    const reconfigLabel = isExternal ? 'EXTERNAL RECONFIGURATION' : 'RECONFIGURATION'
    const structureBracketDesc = isExternal
      ? "Describe ONLY the user's property from the first set of images so the image model can reproduce it EXACTLY. Building shape, facade layout, roof type, door/window positions, balconies, staircase position, compound, boundary wall, gates. Describe the COMPLETE scene so the output shows the FULL image - same framing from edge to edge (full building, sky, ground, foreground). Do NOT describe a cropped or zoomed-in view. Be specific - the output must MATCH this property in full, NOT the reference."
      : "Describe ONLY the user's room from the first set of images so the image model can reproduce it EXACTLY. Room dimensions, wall materials and colors, floor type, ceiling, door/window positions. Describe the full room so the output shows the complete scene. Be specific - the output must MATCH this room in size, layout and structure."
    const reconfigBracketDesc = isExternal
      ? "Describe in detail how to restyle the user's existing facade so that its COLORS, CLADDING MATERIALS, RAILINGS, WINDOW/DOOR FRAMES, EXTERNAL LIGHTING, AND PLANTING closely match the reference image, while keeping the same building massing, floors, and opening positions. Do NOT add or remove structural elements (no extra floors, wings, staircases, balconies, or boundary walls)."
      : "Describe how to REMOVE existing furniture/decor and REPLACE with reference-inspired style, elements, furniture, colors, components. Do NOT suggest changing layout, size, length, width, height, walls, floor, ceiling, or doors."
    const structureLine = '[' + structureBracketDesc + ']'
    const reconfigLine = '[' + reconfigBracketDesc + ']'
    const geminiPrompt = `${prompt}${referenceComponentsText}${fullRoomRefText}

MAIN IDEA: The generated image must MATCH the user's ORIGINAL ${isExternal ? 'property' : 'room'} (first images above) - same SIZE, LAYOUT, and STRUCTURE. ${isExternal ? 'Only external styling (e.g. landscaping, lighting mood) may be inspired by the reference. Do NOT copy the reference building.' : 'Only the INTERIOR (furniture, decor) is reconfigured. Do NOT copy the reference room.'}

CRITICAL - WHICH IMAGES DEFINE THE OUTPUT:
- The FIRST set of images above are the ${userSpaceLabel} - the actual physical space. Your output MUST be this SAME ${isExternal ? 'building/property' : 'room'} (same layout, same size, same length, width, height, same structure).
- Reference images are for extracting ONLY: style, elements, furniture, colors, components. Do NOT use reference for layout, size, length, width, or height. Layout and dimensions must NOT change; they come ONLY from the user's uploaded images.
- Preserve the EXACT ${isExternal ? 'property: building shape, facade, roof, doors, windows, balconies, staircase, compound area, dimensions' : 'room: dimensions, wall positions, window positions, door positions, ceiling, floor'}. ${isExternal ? 'Only optional style cues from reference.' : 'Only change furniture, components, and decor inside that room.'}

Your response MUST be in exactly this format:

${structureLabel}:
` + structureLine + `


${reconfigLabel}:
${reconfigLine}`

    const geminiPromptTruncated = truncatePrompt(geminiPrompt, MAX_PROMPT_CHARS)

    // Call Google Gemini API for enhanced prompt
    // Allow overriding the model via environment variable (GEMINI_TEXT_MODEL)
    // Default to gemini-2.5-flash on the v1 API
    const geminiModel =
      process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash'

    const geminiTextBody = JSON.stringify({
      contents: [
        {
          parts: [
            // Design-context prefix helps safety filters treat request as non-sensitive
            {
              text: DESIGN_CONTEXT_PREFIX + (isExternal
                ? `MAIN IDEA: The output must MATCH the user's ORIGINAL PROPERTY (following images). The following image(s) are the USER'S ORIGINAL HOUSE/PROPERTY - preserve this exact building: same facade, same roof, same doors/windows/balconies/staircase positions, same proportions. Do NOT copy any reference building shown later. Only optional external styling (e.g. lighting, landscaping) may be inspired by reference.`
                : 'MAIN IDEA: The output must MATCH the user\'s room - same SIZE, LENGTH, HEIGHT, WIDTH and LAYOUT. Only reconfigure the INTERIOR (furniture, decor). The following image(s) are the USER\'S ROOM - preserve this exact room structure (walls, floor, ceiling, doors, windows, proportions). Only furniture and decor may change. Do NOT copy the reference room.'),
            },
            ...roomImageParts,
            // Full config reference - STYLE ONLY, do NOT copy reference
            ...(fullRoomRefParts.length > 0
              ? [
                  {
                    text: isExternal
                      ? "REFERENCE image(s) below - for STYLE INSPIRATION ONLY. Do NOT copy this building. Do NOT describe or redraw the reference property. Describe ONLY the user's property (first images) and optional subtle style cues (e.g. lighting, plant style) inspired by the reference. The output must BE the user's original property."
                      : "REFERENCE image(s) below - for style, elements, furniture, colors, components ONLY. Do NOT use reference for layout, size, length, width, or height. Describe what to remove from the user's room and what style/elements/colors/components to add from references. The output must BE the user's room (first images) with the same layout and dimensions, with reference-style interior.",
                  },
                  ...fullRoomRefParts.map(p => ({ inlineData: p.inlineData })),
                ]
              : []),
            // Component reference images (style / design only) with labels
            ...componentParts.flatMap((comp) =>
              comp.label
                ? [
                    { text: `Reference component style: ${comp.label}` },
                    { inlineData: comp.inlineData },
                  ]
                : [{ inlineData: comp.inlineData }]
            ),
            { text: geminiPromptTruncated },
          ],
        },
      ],
      generationConfig: {
        temperature: shuffle ? 0.2 : 0,
        topP: 0.8,
      },
    })

    const geminiResponse = await fetchGemini(
      `https://generativelanguage.googleapis.com/v1/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: geminiTextBody,
      },
      GEMINI_TEXT_TIMEOUT_MS
    )

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text()
      console.error('Gemini API error:', errorData)
      throw new Error(`Gemini API error: ${geminiResponse.status}`)
    }

    const geminiData = await geminiResponse.json()
    const firstCandidate = geminiData.candidates?.[0]
    const finishReason = firstCandidate?.finishReason
    const parts = firstCandidate?.content?.parts
    if (!parts?.length || finishReason === 'OTHER') {
      console.warn('Gemini text response had no content or finishReason OTHER:', { finishReason, hasParts: !!parts?.length })
    }
    const enhancedDescription = parts?.[0]?.text || ''
    console.log('Gemini enhanced description:', enhancedDescription.substring(0, 300) + (enhancedDescription ? '...' : '(empty)'))

    // Parse STRUCTURE and RECONFIGURATION from the text model (ROOM STRUCTURE or PROPERTY STRUCTURE)
    let roomStructureText = ''
    let reconfigurationText = enhancedDescription
    const structureMatch = enhancedDescription.match(/\b(?:ROOM\s+STRUCTURE|PROPERTY\s+STRUCTURE)\s*:?\s*\n?([\s\S]*?)(?=\s*(?:RECONFIGURATION|EXTERNAL\s+RECONFIGURATION)\s*:|\s*$)/i)
    const reconfigMatch = enhancedDescription.match(/\b(?:RECONFIGURATION|EXTERNAL\s+RECONFIGURATION)\s*:?\s*\n?([\s\S]*)/i)
    if (structureMatch && structureMatch[1]?.trim()) {
      roomStructureText = structureMatch[1].trim()
    }
    if (reconfigMatch && reconfigMatch[1]?.trim()) {
      reconfigurationText = reconfigMatch[1].trim()
    }

    // Step 2: Combine original prompt with Gemini's analysis for image generation
    const referenceComponentsFinalText = componentParts.length > 0
      ? `\n\nREFERENCE COMPONENT IMAGES: Use for style, elements, furniture, colors, components ONLY. The room layout, size, length, width, height must come from the user's room images and must NOT change.`
      : ''

    // When reference exists: preserve user's original, use reference for style only - do NOT copy reference
    const fullConfigInstruction = fullRoomRefParts.length > 0
      ? (isExternal
          ? `
EXTERNAL CONFIGURATION: Your output MUST be the user's ORIGINAL property (first images above) - same building, same facade, same doors/windows/balconies/staircase. The reference image(s) define the TARGET STYLE for colors, wall finishes, railing/window designs, external lighting, and landscape treatment. Strongly match this STYLE while keeping the user's original building geometry (massing, floors, opening positions) unchanged. Do NOT draw the reference building itself.`
          : `
FULL CONFIGURATION: Your output MUST be the user's ORIGINAL room (first images above) - same room structure. REMOVE existing furniture/decor and REPLACE with reference-inspired style. Do NOT draw the reference room - only the user's room with reference-style interior.`)
      : ''

    const structureBlock = roomStructureText
      ? `
MAIN IDEA: Same ${isExternal ? 'property' : 'room'} as user's images - same structure, same layout. ${isExternal ? 'Do NOT draw the reference building. Only optional style cues from reference.' : 'Only INTERIOR (furniture, decor) reconfigured.'}

YOU MUST DRAW EXACTLY THIS ${isExternal ? 'PROPERTY' : 'ROOM'} (from the user's images above - do not change):
${roomStructureText}

The image you generate MUST MATCH the user's ${isExternal ? 'property' : 'room'}: same ${isExternal ? 'building, facade, doors, windows, balconies, staircase' : 'dimensions, walls, floor, ceiling, doors, windows'}. ${
          isExternal
            ? 'Do NOT copy the reference image. Do NOT add or remove any structural massing: no extra floors, no new wings/blocks, no new staircases, no new balconies/terraces, no new boundary walls or major volumes that are not present in the uploaded property images.'
            : 'Only furniture and decor inside this room may be changed.'
        }
${fullConfigInstruction}

${isExternal ? 'OPTIONAL STYLE TO APPLY (colors, lighting, materials, landscaping only - no new structure):' : 'FURNITURE AND DECOR TO APPLY (remove old items, replace with the following):'}
${reconfigurationText}

OUTPUT: Same ${isExternal ? 'property' : 'room'} as user's images. Do NOT generate the same as the reference image.`
      : `
MAIN IDEA: Same ${isExternal ? 'property' : 'room'} as user's images - same structure. Do NOT generate the same as the reference image.

CRITICAL - PRESERVE THE USER'S ${isExternal ? 'PROPERTY' : 'ROOM'} (FIRST IMAGE(S) ABOVE):
Your output must be the SAME ${isExternal ? 'building/property' : 'room'} as shown in the user's uploaded images. Do NOT copy the reference ${isExternal ? 'building' : 'room'}. Reference images are for STYLE only.
${fullConfigInstruction}

Detailed configuration requirements:
${enhancedDescription}

OUTPUT: Same ${isExternal ? 'property' : 'room'} as user's images. Do NOT output the reference image.`

    // Build a compact prompt for the image model.
    // In customization mode: build a DIRECT, TARGETED prompt from user's selections —
    // do NOT use the text model's reconfig output which may describe unrelated changes.
    // In normal mode: use text model's parsed structure + reconfig snippets.
    const STRUCT_CAP = 800
    const RECONFIG_CAP = 800
    const structSnippet = roomStructureText.length > STRUCT_CAP
      ? roomStructureText.slice(0, STRUCT_CAP) + '…'
      : roomStructureText

    let imageModelPrompt: string

    if (isCustomizationMode && customizationLabels && Object.keys(customizationLabels).length > 0) {
      // Build explicit per-element instructions from the user's selections
      const restyleLines: string[] = []
      const addDecorLines: string[] = []

      Object.entries(customizationLabels).forEach(([elementType, entry]) => {
        if (entry.isDecor) {
          addDecorLines.push(`• ${entry.label} – ${entry.description}`)
        } else {
          restyleLines.push(`• ${elementType}: change to "${entry.label}" – ${entry.description}`)
        }
      })

      const changeBlock = [
        restyleLines.length > 0
          ? `RESTYLE ONLY THESE ELEMENTS (change their color/texture/material as specified; do NOT touch anything else):\n${restyleLines.join('\n')}`
          : '',
        addDecorLines.length > 0
          ? `ADD ONLY THESE DECORATIVE ELEMENTS in empty corners or surfaces (do NOT remove or alter ANY existing element):\n${addDecorLines.join('\n')}`
          : '',
      ].filter(Boolean).join('\n\n')

      const elementList = Object.keys(customizationLabels).join(', ')

      imageModelPrompt = isExternal
        ? `${DESIGN_CONTEXT_PREFIX}Professional exterior design visualization.

You are given ONE image (the current result). Make ONLY the following specific changes. Everything else must remain pixel-perfect identical.

${changeBlock}

ABSOLUTE RULES:
- ONLY change: ${elementList}.
- Do NOT change: any other part of the building, facade, windows, doors, balconies, roof, landscaping, sky, or ground — unless it is explicitly listed above.
- Keep the exact same camera angle, framing, proportions, and all unlisted elements completely unchanged.
- The output must look like the same photograph with ONLY those listed elements changed.`
        : `${DESIGN_CONTEXT_PREFIX}Professional interior design visualization.

You are given ONE image (the current result). Make ONLY the following specific changes. Everything else must remain pixel-perfect identical.

${changeBlock}

ABSOLUTE RULES:
- ONLY change: ${elementList}.
- Do NOT change: sofa, chairs, tables, floor, ceiling, lighting, decor, artwork, plants, or ANY other element that is NOT listed above.
- Keep the exact same camera angle, framing, layout, and all unlisted elements completely unchanged.
- The output must look like the same photograph with ONLY those listed elements changed. No other differences allowed.`
    } else {
      // Normal (non-customization) mode: use text model output
      const reconfigSnippet = reconfigurationText.length > RECONFIG_CAP
        ? reconfigurationText.slice(0, RECONFIG_CAP) + '…'
        : reconfigurationText

      imageModelPrompt = isExternal
        ? `${DESIGN_CONTEXT_PREFIX}Professional exterior design visualization.

PROPERTY (from uploaded images – reproduce exactly):
${structSnippet || 'Same building as the uploaded image.'}

STYLE CHANGES TO APPLY (colors, materials, landscaping only – no structural change):
${reconfigSnippet || 'Restyle exterior surfaces.'}

RULES: Same building, same facade, same roof, same doors/windows/balconies/staircase, same proportions. Only change colors, cladding, lighting, and landscaping.`
        : `${DESIGN_CONTEXT_PREFIX}Professional interior design visualization.

ROOM (from uploaded images – reproduce exactly):
${structSnippet || 'Same room as the uploaded image.'}

INTERIOR CHANGES TO APPLY (furniture and decor only):
${reconfigSnippet || 'Reconfigure interior furniture and decor.'}

RULES: Identical room structure (walls, floor, ceiling, doors, windows, dimensions). Only furniture and decor may change.`
    }

    // Step 3: Use Gemini image model to generate a new room image
    const geminiImageModel =
      process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image-preview'

    const imageRequestBody = JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { text: imageModelPrompt },
            ...(roomImageParts.slice(0, MAX_ROOM_IMAGES_FOR_IMAGE_MODEL).map(p => ({ inlineData: p.inlineData }))),
            ...componentParts.slice(0, MAX_COMPONENT_IMAGES_FOR_IMAGE_MODEL).flatMap((comp) =>
              comp.label
                ? [
                    { text: `Style reference – ${comp.label}` },
                    { inlineData: comp.inlineData },
                  ]
                : [{ inlineData: comp.inlineData }]
            ),
          ],
        },
      ],
      generationConfig: {
        temperature: shuffle ? 0.35 : 0,
      },
    })

    const imageResponse = await fetchGemini(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiImageModel}:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: imageRequestBody,
      },
      GEMINI_IMAGE_TIMEOUT_MS
    )

    if (!imageResponse.ok) {
      const errorData = await imageResponse.text()
      console.error('Gemini image API error:', errorData)
      throw new Error(`Gemini image API error: ${imageResponse.status}`)
    }

    const imageData = await imageResponse.json()

    const imageCandidate = imageData.candidates?.[0]
    const imageFinishReason = imageCandidate?.finishReason
    const imageParts = imageCandidate?.content?.parts

    // Find the first inlineData part (image) in the response
    const imagePart = Array.isArray(imageParts)
      ? imageParts.find((part: any) => part.inlineData && part.inlineData.data)
      : undefined

    if (!imagePart || !imagePart.inlineData?.data) {
      console.warn(
        `Image model returned no image (finishReason: ${imageFinishReason ?? 'unknown'}). Retrying with minimal prompt.`
      )

      /** Small helper: call the image model with a given prompt and image parts, return base64 data URL or null */
      const tryImageModel = async (parts: object[]): Promise<string | null> => {
        await new Promise((r) => setTimeout(r, 1200))
        const body = JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig: { temperature: 0.2 },
        })
        const res = await fetchGemini(
          `https://generativelanguage.googleapis.com/v1beta/models/${geminiImageModel}:generateContent?key=${geminiApiKey}`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body },
          GEMINI_IMAGE_TIMEOUT_MS
        )
        if (!res.ok) {
          console.warn(`Image model retry HTTP error: ${res.status}`)
          return null
        }
        const data = await res.json()
        const finishReason = data.candidates?.[0]?.finishReason
        const found = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.data)
        if (!found) {
          console.warn(`Image model retry returned no image (finishReason: ${finishReason ?? 'unknown'})`)
          return null
        }
        const mime = found.inlineData.mimeType || 'image/png'
        return `data:${mime};base64,${found.inlineData.data}`
      }

      // Retry 1: minimal prompt with one image (removes complex instructions that may trigger filters)
      const minimalPrompt = isExternal
        ? `${DESIGN_CONTEXT_PREFIX}Restyle the exterior of the building in the uploaded image. Keep the building structure identical. Only change colors, materials, and landscaping.`
        : `${DESIGN_CONTEXT_PREFIX}Redecorate the interior of the room in the uploaded image. Keep the room structure (walls, floor, ceiling, doors, windows) identical. Only change furniture and decor.`

      const retry1 = await tryImageModel([
        { text: minimalPrompt },
        { inlineData: roomImageParts[0].inlineData },
      ])
      if (retry1) {
        console.log('Retry 1 (minimal prompt) succeeded.')
        return retry1
      }

      // Retry 2: absolute minimum — no design instructions at all, just ask for a redesigned room
      const barePrompt = isExternal
        ? 'Apply a fresh exterior style to this building. Keep the structure the same.'
        : 'Redesign the interior of this room with modern furniture. Keep walls, floor, and ceiling the same.'

      const retry2 = await tryImageModel([
        { text: barePrompt },
        { inlineData: roomImageParts[0].inlineData },
      ])
      if (retry2) {
        console.log('Retry 2 (bare prompt) succeeded.')
        return retry2
      }

      console.warn('All retries failed. Falling back to base image.')
      return {
        imageUrl: generateModifiedImage(images[0], imageModelPrompt, enhancedDescription),
        warning: 'Generated image could not be produced; your original image is shown. Try again or simplify the request.',
      }
    }

    const mimeType = imagePart.inlineData.mimeType || 'image/png'
    const base64 = imagePart.inlineData.data as string

    // Return a data URL that the frontend can display directly
    return `data:${mimeType};base64,${base64}`
    
  } catch (error) {
    console.error('Error in image generation:', error)
    return generatePlaceholderImage(images, prompt) as string
  }
}

/**
 * Generate a visually modified image using enhanced prompt
 * This creates a modified version that demonstrates the concept
 * In production, this should be replaced with actual AI service
 */
function generateModifiedImage(
  baseImage: string,
  prompt: string,
  description: string
): string {
  // For prototype: Log the enhanced description to show what changes would be made
  console.log('Enhanced configuration description:', description.substring(0, 500))
  console.log('Note: Gemini image model did not return image data. Returning the original image as fallback.')
  
  // Return the base image with a note that actual generation requires an API
  // In a real scenario with an API, this would return the generated image
  return baseImage
}

/**
 * Generate a placeholder image for demonstration
 * In a real implementation, this would be replaced with actual AI API calls
 * 
 * For the prototype, we return the first reference image as a placeholder
 * In production, this would be replaced with actual AI-generated image
 */
function generatePlaceholderImage(images: string[], prompt: string): string {
  // For prototype: return the first reference image as placeholder
  // This demonstrates the flow without requiring an actual AI API
  // In production, replace this with actual image-to-image generation
  
  // Use the first uploaded image as a placeholder
  // This shows the system is working, but the image hasn't been modified by AI
  const placeholderImage = images[0]
  
  // In a real implementation, you would:
  // 1. Send images and prompt to AI service (e.g., Stability AI, Replicate)
  // 2. Receive the generated/modified image
  // 3. Return it as base64 or URL
  
  console.log('Using placeholder image generation. Prompt:', prompt.substring(0, 100) + '...')
  
  return placeholderImage
}

/** Vercel: allow up to 60s for AI image generation (Pro plan). Hobby plan caps at 10s. */
export const maxDuration = 60

/**
 * POST handler for image generation
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const {
      configType = 'internal',
      images,
      currentResultImage,
      componentReferenceImages,
      componentReferenceLabels,
      configMode,
      purposeInput,
      fullRoomReferenceImages,
      fullRoomAdditionalText,
      arrangementConfig,
      vastuEnabled,
      shuffle,
      customizationStyles,
      customizationLabels,   // Record<elementType, { label, description, isDecor }>
      externalCustomization,
      selectedStyle,
      selectedColorPalette,
      layoutImageIndex,
    } = body

    // Customization mode: user is applying visual-only changes to the current result. Use that image as sole input so layout is preserved.
    const hasCustomizationStyles =
      customizationStyles &&
      typeof customizationStyles === 'object' &&
      Object.values(customizationStyles).some((v: unknown) => v != null && v !== '')
    const hasExternalCustomization =
      configType === 'external' &&
      externalCustomization &&
      typeof externalCustomization === 'object' &&
      Object.values(externalCustomization).some((v: unknown) => v != null && v !== '')
    const isCustomizationMode = (hasCustomizationStyles || hasExternalCustomization) && currentResultImage

    const minImages = configType === 'external' ? 3 : 4
    let imagesForGeneration: string[] =
      isCustomizationMode && typeof currentResultImage === 'string'
        ? [currentResultImage]
        : images

    // Locked layout mode: use ONLY the user-selected layout reference image. Reconfigure that single image (style, colors, components) without changing layout, structure, or camera angle.
    const useLockedLayoutOnly =
      !isCustomizationMode &&
      imagesForGeneration &&
      Array.isArray(imagesForGeneration) &&
      imagesForGeneration.length > 0 &&
      typeof layoutImageIndex === 'number' &&
      layoutImageIndex >= 0 &&
      layoutImageIndex < imagesForGeneration.length

    if (useLockedLayoutOnly) {
      imagesForGeneration = [imagesForGeneration[layoutImageIndex]]
    }

    if (!imagesForGeneration || !Array.isArray(imagesForGeneration) || imagesForGeneration.length === 0) {
      return NextResponse.json(
        { error: 'At least one image is required' },
        { status: 400 }
      )
    }
    if (!isCustomizationMode && !useLockedLayoutOnly && imagesForGeneration.length < minImages) {
      return NextResponse.json(
        { error: configType === 'external' ? 'At least 3 external images are required' : 'At least 4 images are required' },
        { status: 400 }
      )
    }

    if (!configMode || !['purpose', 'arrangement'].includes(configMode)) {
      return NextResponse.json(
        { error: 'Invalid configuration mode' },
        { status: 400 }
      )
    }

    // Validate configuration based on mode (Full Room: style is sufficient; reference images/text are optional)
    if (configMode === 'purpose') {
      const hasRefImages = fullRoomReferenceImages?.length > 0
      const hasText = typeof purposeInput === 'string' && purposeInput.trim().length > 0
      const hasStyle = typeof selectedStyle === 'string' && selectedStyle.trim().length > 0
      if (!hasRefImages && !hasText && !hasStyle) {
        return NextResponse.json(
          { error: 'Please select a design style, and optionally add a description or upload reference image(s).' },
          { status: 400 }
        )
      }
    }

    if (configMode === 'arrangement' && !arrangementConfig) {
      return NextResponse.json(
        { error: 'Arrangement configuration is required for arrangement-based configuration' },
        { status: 400 }
      )
    }

    // Build the base AI prompt using the prompt builder utility
    let prompt = buildPrompt({
      configType: configType === 'external' ? 'external' : 'internal',
      configMode,
      purposeInput,
      fullRoomAdditionalText,
      arrangementConfig,
      vastuEnabled,
      shuffle: shuffle || false,
      customizationStyles,
      customizationLabels:
        customizationLabels && typeof customizationLabels === 'object' ? customizationLabels : undefined,
      externalCustomization:
        configType === 'external' && externalCustomization && typeof externalCustomization === 'object'
          ? externalCustomization
          : undefined,
      selectedStyle: selectedStyle ?? undefined,
      selectedColorPalette: selectedColorPalette ?? undefined,
    })

    // Locked layout: user chose one image as layout reference. We send ONLY that image. Output must preserve layout, structure, angle; only change style, colors, components.
    const isExternal = configType === 'external'
    if (useLockedLayoutOnly) {
      prompt =
        `LOCKED LAYOUT – RECONFIGURE THIS IMAGE ONLY (FULL IMAGE REQUIRED):
You receive ONE image below. This is the user's locked layout reference. Your output MUST:
- Show the FULL image: the ENTIRE scene from edge to edge, same composition as the input. Do NOT crop, zoom in, or show only a portion. Everything visible in the input (full building/property, sky, ground, boundaries) must be visible in the output with the same framing.
- Keep the EXACT same layout, structure, camera angle, wall positions, and proportions. Do NOT change the room/structure geometry or the picture angle.
- Change ONLY: styles, colors, materials, textures, and components (e.g. ${isExternal ? 'facade materials, landscaping, lighting' : 'furniture, decor, finishes'}).
- The result must look like the SAME photograph from the SAME viewpoint with only visual/style updates. Same field of view, same edges, complete scene.

` + prompt
    } else {
      prompt =
        `FIXED LAYOUT: The FIRST image in the set below is the single source of layout and framing for this generation. Your output MUST show the FULL ${isExternal ? 'property' : 'room'} from this exact viewpoint and framing - the complete scene from edge to edge. Do NOT crop, zoom in, or focus on one corner or one element. Preserve the complete view; only reconfigure style, ${isExternal ? 'materials, colors, landscaping' : 'furniture, and colors'}.\n\n` +
        prompt
    }

    if (isCustomizationMode) {
      const isExternal = configType === 'external'
      prompt =
        (isExternal
          ? `EXTERIOR CUSTOMIZATION MODE – STRUCTURE MUST NOT CHANGE:
The SINGLE image provided below is the CURRENT RESULT. Your output MUST be this EXACT exterior with ONLY the visual changes listed in "EXTERIOR CUSTOMIZATION OVERRIDES" applied.
- Do NOT change building structure, layout, camera angle, proportions, or any element's position or size.
- Do NOT add, remove, or move facade, windows, doors, balconies, or structural elements.
- ONLY change the colors, textures, materials, or lighting of the specified exterior elements. All other pixels must remain as in the provided image.

`
          : `CUSTOMIZATION MODE – LAYOUT MUST NOT CHANGE:
The SINGLE image provided below is the CURRENT RESULT. Your output MUST be this EXACT image with ONLY the visual changes listed in "CUSTOMIZATION OVERRIDES" applied.
- Do NOT change layout, composition, camera angle, proportions, or any element's position, size, or shape.
- Do NOT add, remove, or move any furniture, walls, floor, ceiling, or decor.
- ONLY change the color, texture, or material of the specific elements mentioned in CUSTOMIZATION OVERRIDES. All other pixels must remain as in the provided image.
- The result must look like the same photograph with only those selected components restyled; everything else identical.

`) + prompt
    }

    // If we have labeled component references, append a clear summary
    if (componentReferenceLabels && componentReferenceLabels.length > 0) {
      const lines = componentReferenceLabels
        .map((label: string, index: number) => label && label.trim()
          ? `- Ref ${index + 1}: ${label.trim()}`
          : null)
        .filter(Boolean)

      if (lines.length > 0) {
        prompt +=
          `\n\n4. Component reference styles provided by the user:\n` +
          `${lines.join('\n')}\n\n` +
          `Use these reference styles when introducing or replacing components in the room (e.g., plants, seating, storage, lighting).`
      }
    }

    // Log prompt summary for debugging
    const promptSummary = buildPromptSummary({
      configType: configType === 'external' ? 'external' : 'internal',
      configMode,
      purposeInput,
      arrangementConfig,
      vastuEnabled,
      shuffle: shuffle || false,
    })
    console.log('Generating image with prompt:', promptSummary)

    // Generate the image using AI (or placeholder). In customization mode we pass only the current result so layout is preserved.
    const result = await generateImageWithAI(
      imagesForGeneration,
      prompt,
      isCustomizationMode ? undefined : componentReferenceImages,
      isCustomizationMode ? undefined : componentReferenceLabels,
      isCustomizationMode ? undefined : fullRoomReferenceImages,
      isCustomizationMode ? undefined : fullRoomAdditionalText,
      configType === 'external' ? 'external' : 'internal',
      shuffle || false,
      !!isCustomizationMode,
      customizationLabels && typeof customizationLabels === 'object' ? customizationLabels : undefined
    )

    const imageUrl = typeof result === 'string' ? result : result.imageUrl
    const warning = typeof result === 'string' ? undefined : result.warning

    return NextResponse.json({
      success: true,
      imageUrl,
      ...(warning && { warning }),
      promptSummary,
    })
  } catch (error) {
    console.error('Error generating image:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
