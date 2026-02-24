import { NextRequest, NextResponse } from 'next/server'
import { buildPrompt, buildPromptSummary } from '@/app/utils/promptBuilder'

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
 * @returns Base64 string of generated image
 */
async function generateImageWithAI(
  images: string[],
  prompt: string,
  componentReferenceImages?: string[],
  componentReferenceLabels?: string[],
  fullRoomReferenceImages?: string[],
  fullRoomAdditionalText?: string,
  configType: 'internal' | 'external' = 'internal',
  shuffle: boolean = false
): Promise<string> {
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
${fullRoomAdditionalText?.trim() ? `\nAdditional user instructions:\n${fullRoomAdditionalText.trim()}` : ''}${doNotCopyRefBlock}`
      : fullRoomAdditionalText?.trim()
        ? `\n\nAdditional user instructions for reconfiguration:\n${fullRoomAdditionalText.trim()}`
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

    // Call Google Gemini API for enhanced prompt
    // Allow overriding the model via environment variable (GEMINI_TEXT_MODEL)
    // Default to gemini-2.5-flash on the v1 API
    const geminiModel =
      process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash'

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                // User's original space (room or property) - output MUST be this, not the reference
                {
                  text: isExternal
                    ? `MAIN IDEA: The output must MATCH the user's ORIGINAL PROPERTY (following images). The following image(s) are the USER'S ORIGINAL HOUSE/PROPERTY - preserve this exact building: same facade, same roof, same doors/windows/balconies/staircase positions, same proportions. Do NOT copy any reference building shown later. Only optional external styling (e.g. lighting, landscaping) may be inspired by reference.`
                    : 'MAIN IDEA: The output must MATCH the user\'s room - same SIZE, LENGTH, HEIGHT, WIDTH and LAYOUT. Only reconfigure the INTERIOR (furniture, decor). The following image(s) are the USER\'S ROOM - preserve this exact room structure (walls, floor, ceiling, doors, windows, proportions). Only furniture and decor may change. Do NOT copy the reference room.',
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
                { text: geminiPrompt },
              ],
            },
          ],
          // Keep text model deterministic and conservative so it follows
          // layout/structure rules very strictly, especially on first runs.
          generationConfig: {
            // Keep deterministic for base description; small variation if shuffle requested
            temperature: shuffle ? 0.2 : 0,
            topP: 0.8,
          },
        }),
      }
    )

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text()
      console.error('Gemini API error:', errorData)
      throw new Error(`Gemini API error: ${geminiResponse.status}`)
    }

    const geminiData = await geminiResponse.json()
    const enhancedDescription = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''
    console.log('Gemini enhanced description:', enhancedDescription.substring(0, 300) + '...')

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

    const finalPrompt = `${prompt}${referenceComponentsFinalText}
${structureBlock}`

    // Step 3: Use Gemini image model to generate a new room image
    // We use the v1beta image-capable model (e.g. gemini-3-pro-image-preview)
    const geminiImageModel =
      process.env.GEMINI_IMAGE_MODEL || 'gemini-3-pro-image-preview'

    const imageResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiImageModel}:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                // CRITICAL: User's ORIGINAL images first - output MUST be this space, NOT the reference
                {
                  text: isExternal
                    ? "MAIN IDEA: Draw the user's ORIGINAL PROPERTY (images below) - same building, same facade, same doors/windows/balconies/staircase, same proportions. Do NOT draw the reference building. Reference images (if any) are for STYLE inspiration only (e.g. lighting mood, plant style). Your output must BE the user's property from the first image(s), not a copy of the reference."
                    : "MAIN IDEA: Keep the SIZE, LENGTH, HEIGHT, WIDTH and LAYOUT the SAME as the user's room images below. Only reconfigure the INTERIOR (furniture, decor). Your output MUST MATCH the user's room: same walls, floor, ceiling, doors, windows, same dimensions. Reference images are for style, elements, furniture, colors, components ONLY—not for layout or size. Do NOT draw the reference room. Copy the room structure from the first image(s); only change furniture and decor inside that room.",
                },
                ...(roomImageParts.slice(0, 4).map(p => ({ inlineData: p.inlineData }))),
                // NOTE: We intentionally do NOT pass fullRoomRefParts as images here anymore.
                // Style from reference images is already captured in the text prompt (finalPrompt).
                // This strongly biases the image model to copy geometry/layout ONLY from the user's original images.
                // Component reference images - style for interior elements only
                ...componentParts.flatMap((comp) =>
                  comp.label
                    ? [
                        { text: `Reference component style for interior element: ${comp.label}` },
                        { inlineData: comp.inlineData },
                      ]
                    : [{ inlineData: comp.inlineData }]
                ),
                // Final prompt with configuration requirements
                { text: finalPrompt },
                // Extra hard constraints to force layout/dimension match with uploaded images
                {
                  text: isExternal
                    ? "ABSOLUTE RULES (EXTERNAL):\\n- Reproduce the SAME PROPERTY LAYOUT, SIZE, SHAPE, AND PROPORTIONS as in the user's first uploaded external image.\\n- Do NOT move, resize, or reshape walls, facade edges, roofs, doors, windows, balconies, staircase, or compound boundaries.\\n- Only change STYLING ELEMENTS (lighting mood, colors, plants/landscaping, surface finishes) and other movable/external components. The building and site geometry must remain IDENTICAL to the uploaded image."
                    : "ABSOLUTE RULES (INTERNAL):\\n- Reproduce the SAME ROOM LAYOUT, SIZE, SHAPE, AND PROPORTIONS as in the user's first uploaded room image.\\n- Do NOT move, resize, or reshape walls, floor edges, ceiling, doors, windows, or structural elements.\\n- Only change FURNITURE, DECOR, AND MOVABLE COMPONENTS inside this fixed room. The room geometry (layout, length, width, height) must remain IDENTICAL to the uploaded image.",
                },
              ],
            },
          ],
          // Low temperature so the image model copies the uploaded
          // room/property layout very closely instead of exploring.
          generationConfig: {
            // For shuffle runs, allow slightly more variation while still favouring the same layout
            temperature: shuffle ? 0.35 : 0,
          },
        }),
      }
    )

    if (!imageResponse.ok) {
      const errorData = await imageResponse.text()
      console.error('Gemini image API error:', errorData)
      throw new Error(`Gemini image API error: ${imageResponse.status}`)
    }

    const imageData = await imageResponse.json()

    // Find the first inlineData part (image) in the response
    const imagePart =
      imageData.candidates?.[0]?.content?.parts?.find(
        (part: any) => part.inlineData && part.inlineData.data
      )

    if (!imagePart || !imagePart.inlineData?.data) {
      console.warn('Gemini image response did not contain image data. Falling back to base image.')
      return generateModifiedImage(images[0], finalPrompt, enhancedDescription)
    }

    const mimeType = imagePart.inlineData.mimeType || 'image/png'
    const base64 = imagePart.inlineData.data as string

    // Return a data URL that the frontend can display directly
    return `data:${mimeType};base64,${base64}`
    
  } catch (error) {
    console.error('Error in image generation:', error)
    return generatePlaceholderImage(images, prompt)
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
    const generatedImageUrl = await generateImageWithAI(
      imagesForGeneration,
      prompt,
      isCustomizationMode ? undefined : componentReferenceImages,
      isCustomizationMode ? undefined : componentReferenceLabels,
      isCustomizationMode ? undefined : fullRoomReferenceImages,
      isCustomizationMode ? undefined : fullRoomAdditionalText,
      configType === 'external' ? 'external' : 'internal',
      shuffle || false
    )

    // Return the generated image
    return NextResponse.json({
      success: true,
      imageUrl: generatedImageUrl,
      promptSummary, // Include for debugging
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
