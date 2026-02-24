/**
 * Prompt Builder Utility
 * Constructs AI prompts for room configuration generation
 * 
 * This utility builds dynamic prompts based on user configuration
 * and includes optional Vastu guidance when enabled.
 */

interface ArrangementConfig {
  existingComponentsNote: string
  removedComponentsNote?: string
  newComponentsNote: string
  arrangementPreferencesText: string
}

interface PromptBuilderOptions {
  configMode: 'purpose' | 'arrangement'
  purposeInput?: string
  fullRoomAdditionalText?: string
  arrangementConfig?: ArrangementConfig
  vastuEnabled: boolean
  shuffle?: boolean
  /** 'internal' = room; 'external' = facade/compound. Affects preservation and wording. */
  configType?: 'internal' | 'external'
  /** Optional visual-only customization styles applied after first generation (interior) */
  customizationStyles?: Record<string, string | null>
  /** Exterior customization: category -> preset id (e.g. facade -> 'facade_stone'). Used when configType === 'external'. */
  externalCustomization?: Record<string, string | null>
  /** User-selected design style (e.g. Modern, Minimalist). Injected into prompt for both interior and exterior. */
  selectedStyle?: string | null
  /** User-selected color palette id (e.g. high_contrast_neutrals, forest_inspired). Optional; AI applies palette with style. */
  selectedColorPalette?: string | null
}

/**
 * Reference image usage rule: reference = style/elements/furniture/colors/components ONLY.
 * Layout and dimensions MUST come from uploaded images and MUST NOT change.
 */
const REFERENCE_ONLY_STYLE_RULE = `
REFERENCE IMAGE USAGE - STRICT RULE:
- Reference image(s) are for extracting ONLY: style, elements, furniture, colors, components.
- From reference you may use: visual style, furniture types, color palette, decor elements, materials, component designs.
- From reference you must NOT use: layout, room/building shape, size, length, width, height, proportions, structural arrangement.
- Layout, size, length, width, height MUST come ONLY from the user's UPLOADED images. They must NOT change in the generated output.
- The generated output must have the EXACT same layout and dimensions as the user's uploaded image(s). Only style, furniture, colors, and components may be inspired by the reference.`

/**
 * Base system prompt for INTERNAL (room) configuration
 */
const BASE_SYSTEM_PROMPT_INTERNAL = `You are an expert interior designer and room configuration AI.

MAIN IDEA: The generated image MUST be the user's ORIGINAL ROOM (from the first set of images) - same size, same layout, same walls/floor/ceiling/doors/windows. Do NOT generate the same as any reference image. The reference is for furniture/decor STYLE only; the room structure comes ONLY from the user's room images.

Reconfigure the INTERIOR (furniture, decor, movable items) keeping the SIZE, LENGTH, HEIGHT, WIDTH and LAYOUT the SAME as the user's uploaded images. The output must look like the SAME room with only the interior changed - NOT a copy of the reference room.
${REFERENCE_ONLY_STYLE_RULE}

CRITICAL - PRESERVE THE ORIGINAL ROOM (DO NOT CHANGE LAYOUT, SIZE, OR CAMERA VIEW):
- The FIRST set of images provided are the USER'S ROOM - the actual physical space. Your output MUST be this SAME room: same dimensions (length, width, height), same layout, same wall positions, same window positions and sizes, same door positions, same ceiling height and structure, same floor area and shape, and the same camera viewpoint and framing.
- Preserve ALL structural and fixed elements: wall materials and colors (e.g. wood paneling, wallpaper, paint), floor type (e.g. white tiles, wood planks), ceiling type (e.g. beams, track lights, recessed lights), doors, windows, and room proportions. Do NOT replace these with different walls, floor, or ceiling from any reference image.
- Do NOT generate a different room. The output must MATCH the user's uploaded images in room structure - same size, same layout - with only furniture and decor reconfigured inside that room.
- Any "reference" or "style" images are ONLY for furniture and decor - they do NOT define the room structure. The room structure comes ONLY from the user's uploaded room images.
- Treat the user's room as a FIXED container: walls, windows, doors, ceiling, floor, room size, and camera angle are UNCHANGEABLE. Only the contents (furniture, components, decor) inside that container may be reconfigured.

FULL ROOM - SAME FRAMING (CRITICAL):
- Your output MUST show the FULL room from the same viewpoint as the layout image - the entire frame, same field of view, same edges. Do NOT crop, zoom in, or focus on one corner, one wall, or one piece of furniture (e.g. do not show only a counter or one desk). The complete room as captured in the layout image must be visible in your output so the full image is preserved.

VISUAL QUALITY REQUIREMENTS:
- The generated image must be a single, clean, uninterrupted, photorealistic view of the room (like a real photograph).
- Do NOT add vertical or horizontal divider lines, split-screen views, before/after comparisons, or any overlay frames or grids.
- Do NOT simulate glass partitions, mirror seams, or reflections that create strong straight lines cutting through the middle of the image, unless they are clearly present in the user's original room images.
- Do NOT add text, logos, UI controls, watermarks, diagrams, arrows, or measurement markings inside the image.
- The final image should look like a natural camera shot of the reconfigured room, with no artificial lines or overlays on top of the scene.`

/**
 * Base system prompt for EXTERNAL (facade/compound) configuration
 */
const BASE_SYSTEM_PROMPT_EXTERNAL = `You are an expert in exterior building and property configuration.

MAIN IDEA: The generated image MUST be the user's ORIGINAL PROPERTY (from the first set of images) - same building, same facade, same doors/windows/balconies/staircase, same proportions. Do NOT generate the same as any reference image. The reference is for STYLE inspiration only (e.g. lighting mood, landscaping style).
${REFERENCE_ONLY_STYLE_RULE}

CRITICAL - PRESERVE THE ORIGINAL, DO NOT COPY THE REFERENCE:
- The FIRST set of images are the USER'S ORIGINAL PROPERTY. Your output MUST be THIS EXACT building: same shape, same facade layout, same roof, same door/window/balcony positions, same staircase, same size/length/width/height. Do NOT copy or redraw the reference building.
- Any reference image(s) are for STYLE inspiration ONLY (e.g. warm lighting, plant style, color tone, elements, colors, components). Only optional subtle cues may be taken from the reference. The result must still be clearly the user's original property, NOT a copy of the reference.
- Do NOT change the building's shape, structure, layout, size, length, width, or height. Do NOT add any new structural massing or elements such as extra floors, new wings/blocks, new staircases, new balconies/terraces, or new boundary walls that are not present in the original images.
- Treat the building as FIXED; only optional external styling (lighting, landscaping, colors, elements) may be inspired by the reference.

FULL PROPERTY – SAME FRAMING (CRITICAL):
- Your output MUST show the FULL property from the SAME viewpoint and SAME framing as the layout image: the complete scene from edge to edge. Include the entire building (roof to ground), sky, boundary wall, gates, driveway, and any foreground visible in the input. Do NOT crop, zoom in, or show only one part (e.g. do not show only the balcony or only the gate). The generated image must have the same composition and field of view as the input so the full image is preserved.

VISUAL QUALITY: Single, clean, photorealistic view. No split screens, overlays, or text in the image.`

/** Returns base system prompt based on config type */
function getBaseSystemPrompt(configType: 'internal' | 'external' = 'internal'): string {
  return configType === 'external' ? BASE_SYSTEM_PROMPT_EXTERNAL : BASE_SYSTEM_PROMPT_INTERNAL
}

/**
 * Vastu guidance text to be included when Vastu preferences are enabled
 * Note: This is instructional text only, not actual direction calculations
 */
const VASTU_GUIDANCE = `
Apply Vastu Shastra principles to the room configuration:
- Ensure proper placement of furniture respecting directional guidelines
- Maintain open spaces and avoid clutter in key areas
- Position work areas to face favorable directions
- Include elements that promote positive energy flow
- Ensure natural light access and ventilation
- Balance the five elements (earth, water, fire, air, space) in the design
Remember: These are general Vastu guidelines for creating harmonious spaces.`

/**
 * Build the user prompt based on configuration mode
 */
function buildUserPrompt(options: PromptBuilderOptions): string {
  const { configMode, purposeInput, fullRoomAdditionalText, arrangementConfig, shuffle, configType = 'internal' } = options
  const isExternal = configType === 'external'

  let prompt = ''

  if (configMode === 'purpose') {
    // Full Room/External Configuration: optional purpose text; reference images for style only
    const userText = purposeInput?.trim() || ''
    prompt = isExternal
      ? (userText
          ? `MAIN IDEA: The output MUST be the user's ORIGINAL PROPERTY (first images). Same building, same facade, same doors/windows/balconies/staircase. Do NOT generate the same as the reference image.

Reconfigure external STYLING based on: "${userText}". The STYLE of the generated facade (colors, cladding materials, railing style, lighting pattern, planter/landscape style) should STRONGLY MATCH the reference image, while keeping the user's original building geometry (mass, floors, openings) unchanged.

ABSOLUTE RULE (EXTERNAL): Do NOT add or remove any structural elements compared to the uploaded property images. No extra floors, no new wings/blocks, no new staircases, no new balconies/terraces, no new boundary walls. Only change finishes, colors, lighting, railing design, and landscaping to follow the reference style.`
          : `MAIN IDEA: The output MUST be the user's ORIGINAL PROPERTY (first images). Same building, same facade, same layout. Do NOT copy the reference building.

Use the reference facade image(s) to CLOSELY MATCH the STYLE: color palette, wall finishes/cladding, railing and window frame style, external lighting pattern, planter/landscape style. The final image must look like the user's building wearing the reference style.

ABSOLUTE RULE (EXTERNAL): Do NOT add or remove any structural elements compared to the uploaded property images. No extra floors, no new wings/blocks, no new staircases, no new balconies/terraces, no new boundary walls. Only change finishes, colors, lighting, railing design, and landscaping to follow the reference style.`)
      : userText
      ? `MAIN IDEA: Keep the SIZE, LENGTH, HEIGHT, WIDTH and LAYOUT the SAME as the user's room. Only reconfigure the INTERIOR (furniture, decor). The generated image must MATCH the user's room in structure.

Reconfigure the INTERIOR of the user's room based on: "${userText}".
    
REFERENCE = style, elements, furniture, colors, components ONLY. Layout, size, length, width, height must NOT change; they come ONLY from the user's uploaded room images.

FULL CONFIGURATION - REMOVE OLD ITEMS AND REPLACE WITH REFERENCE STYLE:
- When the user provides reference image(s), REMOVE the existing furniture and decor from the user's room (old desk, old chairs, old TV/units, etc.). Do NOT keep the old items.
- REPLACE them with furniture and decor that closely match the reference image(s):
  - From reference extract ONLY: style, elements, furniture types, colors, components (e.g. playful pastel, earthy boho, sleek minimal; sofa vs armchairs; wood vs rattan; textiles, rugs, art).
  - Do NOT take layout, size, length, width, height, or room proportions from the reference. Those must stay EXACTLY as in the user's uploaded room images.
- Preserve the room structure: same dimensions, same walls, same windows, same ceiling, same floor. The interior (furniture, components, decor) should be replaced with reference-inspired style only.
- Do NOT generate the same image as the reference. The output must BE the user's room (first images) with reference-style interior, NOT a copy of the reference room.`
      : `MAIN IDEA: Keep the SIZE, LENGTH, HEIGHT, WIDTH and LAYOUT the SAME as the user's room. Only reconfigure the INTERIOR (furniture, decor). The generated image must MATCH the user's room in structure. Do NOT generate the same as the reference image.

Reconfigure the INTERIOR of the user's room using the reference image(s) for STYLE only.
    
REFERENCE = style, elements, furniture, colors, components ONLY. Layout, size, length, width, height must NOT change; they come ONLY from the user's uploaded room images.

FULL CONFIGURATION - REMOVE OLD ITEMS AND REPLACE WITH REFERENCE STYLE:
- REMOVE the existing furniture and decor from the user's room. REPLACE them with furniture and decor that match the reference STYLE (style, elements, furniture types, colors, components, patterns).
- The room structure (layout, size, length, width, height, walls, floor, ceiling, dimensions) comes ONLY from the user's room images and must NOT change.
- Do NOT output the same image as the reference. The output must BE the user's room with reference-inspired interior, NOT a copy of the reference room.`
    prompt += `${shuffle ? '\n\nCreate a slightly different furniture arrangement while keeping the same configuration and IDENTICAL room structure and dimensions.' : ''}`
  } else if (configMode === 'arrangement' && arrangementConfig) {
    // Component-based configuration
    const {
      existingComponentsNote,
      removedComponentsNote,
      newComponentsNote,
      arrangementPreferencesText,
    } = arrangementConfig

    prompt = `MAIN IDEA: Keep the SIZE, LENGTH, HEIGHT, WIDTH and LAYOUT the SAME as the user's room. Only reconfigure the INTERIOR (furniture, decor). The generated image must MATCH the user's room in structure.

Reconfigure the INTERIOR ONLY of the user's room using a **component-based configuration**:

PRESERVE THE USER'S ROOM - DO NOT CHANGE LAYOUT OR SIZE:
- The room in your output must be the SAME physical space as shown in the user's uploaded room images - same dimensions (length, width, height), same walls, same windows, same ceiling, same floor.
- Only change: furniture, components, decor. Do NOT change: room size, wall positions, window positions/sizes, door positions, ceiling height/structure, floor area/shape.
- The room structure is a FIXED container - only the contents (furniture/components) inside it can be rearranged.

1. Components to REMOVE (exclude from the final room - do not include these):
${removedComponentsNote ? removedComponentsNote.split(',').map((c) => `- ${c.trim()}`).filter(Boolean).join('\n') || '- (none)' : '- (none)'}

2. Components to KEEP (include and rearrange in the room):
${existingComponentsNote || '- (User did not specify, infer from images)'}

3. New components to introduce:
${newComponentsNote || '- (Reference component images will be provided separately - use those images as style guides for adding new components)'}

NOTE: Reference component images are for extracting style, elements, furniture, colors, and components ONLY. Use them for design, material, color, and component type—NOT for room layout or dimensions. Layout, size, length, width, height of the room must remain EXACTLY as in the user's uploaded images.

4. Arrangement preferences (user input):
${arrangementPreferencesText?.trim() ? arrangementPreferencesText.trim() : '- (User did not specify - arrange components in a practical, balanced way)'}

ABSOLUTE REQUIREMENTS:
- Keep the EXACT same room dimensions (length, width, height), layout, wall positions, window positions, door positions, and ceiling height as shown in the USER'S UPLOADED room images. Do NOT take layout or dimensions from any reference image.
- Reference images are for style, elements, furniture, colors, components ONLY. Layout and size must NOT change.
- Maintain the EXACT architectural structure - do not add, remove, or modify walls, partitions, or structural elements
- Reconfigure ONLY the interior elements (furniture, components, decor): rearrange existing items, place new components in realistic positions, and optimize spacing and circulation
- The generated room must have IDENTICAL physical structure and dimensions to the user's uploaded room - it must look like the exact same room with only furniture/components changed
- Do NOT add extra layouts, walls, partitions, or any structural modifications
${shuffle ? 'For this variation, keep the same components and IDENTICAL room structure/dimensions, but explore a slightly different, still practical arrangement of interior elements only.' : ''}`
  }

  return prompt
}

/**
 * Main function to build the complete prompt for AI image generation
 * 
 * @param options - Configuration options for prompt building
 * @returns Complete prompt string ready to be sent to AI
 */
export function buildPrompt(options: PromptBuilderOptions): string {
  const { vastuEnabled, configType = 'internal', customizationStyles, externalCustomization, selectedStyle, selectedColorPalette } = options

  // Build the user prompt based on configuration
  let userPrompt = buildUserPrompt(options)

  // Inject design style at the start when user has selected one (interior and exterior)
  const styleLabel = selectedStyle?.trim()
  if (styleLabel) {
    const styleCapitalized = styleLabel.charAt(0).toUpperCase() + styleLabel.slice(1)
    userPrompt =
      `Apply ${styleCapitalized} design style to the uploaded image with photorealistic rendering. The overall look, materials, colors, and mood should clearly reflect ${styleCapitalized} style.\n\n` +
      userPrompt
  }

  // Inject color palette when user has selected one (optional; works with style)
  const paletteId = selectedColorPalette?.trim()
  if (paletteId) {
    const paletteInstructions: Record<string, string> = {
      surprise_me: 'Use a complementary color palette that fits the selected design style. Let the AI choose harmonious colors that enhance the style.',
      high_contrast_neutrals: 'Apply a high-contrast neutral color palette: light grey, beige, off-white, and black or charcoal accents. Clean, sharp, modern finishes.',
      forest_inspired: 'Apply a forest-inspired color palette: tan, dark brown, olive green, and natural wood tones. Earthy, organic, and natural materials.',
      romance: 'Apply a soft romance color palette: pale pink, blush, light sage green, and muted brown or cream. Gentle, inviting, and soft finishes.',
      ocean_breeze: 'Apply an ocean breeze palette: sky blue, aqua, soft teal, and deep ocean blue. Fresh, airy, coastal feel.',
      sunset_warmth: 'Apply a sunset warmth palette: peach, terracotta, burnt orange, and deep rust. Warm, inviting, golden-hour mood.',
      earth_tones: 'Apply earth tones: stone, taupe, warm grey, sand, and clay. Natural, grounded, and organic.',
      monochrome: 'Apply a monochrome palette: clean whites, soft to charcoal greys, and black accents. Timeless, crisp, and elegant.',
      jewel_tones: 'Apply jewel tones: amethyst, sapphire, emerald hints, deep purple and blue. Rich, luxurious, and bold.',
      pastel_dreams: 'Apply soft pastels: pale pink, lavender, mint, peach, and sky blue. Light, dreamy, and gentle.',
      industrial: 'Apply an industrial palette: concrete grey, warm metal, charcoal, and raw neutrals. Urban, utilitarian, and edgy.',
      coastal_serenity: 'Apply coastal serenity: seafoam, soft teal, sand, and white. Relaxed, breezy, beach-house feel.',
      autumn_harvest: 'Apply autumn harvest: amber, burnt orange, mustard, and warm brown. Cozy, seasonal, and warm.',
      lavender_mist: 'Apply lavender mist: soft violet, lilac, lavender, and deep purple accents. Calm, serene, and refined.',
    }
    const paletteText = paletteInstructions[paletteId] || `Apply a cohesive color palette that complements the selected style.`
    userPrompt =
      `${paletteText}\n\n` + userPrompt
  }

  // Interior: append visual-only customization overrides (no geometry changes)
  if (configType !== 'external' && customizationStyles) {
    const lines = Object.entries(customizationStyles)
      .filter(([, value]) => value)
      .map(
        ([key, value]) =>
          `- ${key}: apply visual style "${value}" from the internal library; keep position, size, orientation, and geometry unchanged.`
      )

    if (lines.length > 0) {
      userPrompt += `

CUSTOMIZATION OVERRIDES (VISUAL ONLY – NO LAYOUT CHANGE):
${lines.join('\n')}
CRITICAL – LAYOUT PRESERVATION:
- Change ONLY the appearance (color, texture, material) of the elements listed above. All other elements must remain exactly as they are in the image.
- Do NOT move, resize, add, or remove any furniture, walls, floor, ceiling, fixtures, or decor.
- Do NOT change the layout, composition, camera angle, or proportions. The output must be the same scene with only the selected components restyled.`
    }
  }

  // Exterior: append category-based customization overrides (no structure change)
  if (configType === 'external' && externalCustomization) {
    const lines = Object.entries(externalCustomization)
      .filter(([, value]) => value)
      .map(
        ([category, presetId]) =>
          `- ${category}: apply preset "${presetId}"; keep structure, size, and position unchanged.`
      )

    if (lines.length > 0) {
      userPrompt += `

EXTERIOR CUSTOMIZATION OVERRIDES (VISUAL ONLY – NO STRUCTURE CHANGE):
${lines.join('\n')}
Update the exterior by applying these material/style presets to the specified elements while keeping the building structure, layout, and perspective unchanged. Maintain photorealistic lighting. Do NOT add, remove, or move structural elements (facade mass, windows, doors, balconies, roof). Only change colors, textures, materials, and lighting mood as specified.`
    }
  }

  // Add Vastu guidance if enabled
  if (vastuEnabled) {
    userPrompt += `\n\n${VASTU_GUIDANCE}`
  }

  // Combine system prompt and user prompt (internal vs external)
  const basePrompt = getBaseSystemPrompt(configType)
  const fullPrompt = `${basePrompt}\n\n${userPrompt}`

  return fullPrompt
}

/**
 * Build a simplified prompt summary for logging/debugging
 */
export function buildPromptSummary(options: PromptBuilderOptions): string {
  const { configType = 'internal', configMode, purposeInput, arrangementConfig, vastuEnabled, shuffle, selectedStyle, selectedColorPalette } = options

  let summary = `Type: ${configType} | Mode: ${configMode}`
  if (selectedStyle?.trim()) {
    summary += ` | Style: ${selectedStyle.trim()}`
  }
  if (selectedColorPalette?.trim()) {
    summary += ` | Palette: ${selectedColorPalette.trim()}`
  }
  if (configMode === 'purpose' && purposeInput) {
    summary += ` | Purpose: "${purposeInput}"`
  } else if (configMode === 'arrangement' && arrangementConfig?.arrangementPreferencesText?.trim()) {
    const prefs = arrangementConfig.arrangementPreferencesText.trim()
    summary += ` | Preferences: "${prefs.length > 50 ? prefs.slice(0, 50) + '...' : prefs}"`
  }

  summary += ` | Vastu: ${vastuEnabled ? 'Enabled' : 'Disabled'}`
  if (shuffle) {
    summary += ` | Shuffle: Yes`
  }

  return summary
}
