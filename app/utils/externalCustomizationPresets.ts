/**
 * External (exterior) customization categories and preset options.
 * Used when configType === 'external' and user is in Customize mode.
 */

export type ExternalCategory =
  | 'facade'
  | 'windows'
  | 'entrance'
  | 'balcony'
  | 'lighting'
  | 'landscape'
  | 'flooring'
  | 'architectural'

export interface ExternalPresetOption {
  id: string
  label: string
  description?: string
}

export type ExternalCustomizationState = Record<ExternalCategory, string | null>

export const EXTERNAL_CATEGORY_LABELS: Record<ExternalCategory, string> = {
  facade: 'Facade',
  windows: 'Windows',
  entrance: 'Entrance',
  balcony: 'Balcony',
  lighting: 'Lighting',
  landscape: 'Landscape',
  flooring: 'Flooring',
  architectural: 'Architectural Details',
}

/** Preset options per category. Extensible. */
export const EXTERNAL_CUSTOMIZATION_PRESETS: Record<
  ExternalCategory,
  ExternalPresetOption[]
> = {
  facade: [
    { id: 'facade_paint', label: 'Paint', description: 'Smooth painted facade finish.' },
    { id: 'facade_stone', label: 'Stone', description: 'Natural stone cladding.' },
    { id: 'facade_concrete', label: 'Concrete', description: 'Raw or finished concrete.' },
    { id: 'facade_wood_cladding', label: 'Wood cladding', description: 'Wooden facade panels.' },
  ],
  windows: [
    { id: 'windows_frame_white', label: 'White frame', description: 'White window frames.' },
    { id: 'windows_frame_black', label: 'Black frame', description: 'Black metal frames.' },
    { id: 'windows_frame_wood', label: 'Wood frame', description: 'Timber window frames.' },
    { id: 'windows_glass_clear', label: 'Clear glass', description: 'Clear glass tint.' },
    { id: 'windows_glass_tinted', label: 'Tinted glass', description: 'Subtle tinted glass.' },
  ],
  entrance: [
    { id: 'entrance_door_modern', label: 'Modern door', description: 'Sleek modern door style.' },
    { id: 'entrance_door_classic', label: 'Classic door', description: 'Traditional door style.' },
    { id: 'entrance_gate_simple', label: 'Simple gate', description: 'Minimal gate design.' },
    { id: 'entrance_canopy', label: 'Canopy', description: 'Entrance canopy or awning.' },
  ],
  balcony: [
    { id: 'balcony_railing_glass', label: 'Glass railing', description: 'Glass balcony railing.' },
    { id: 'balcony_railing_metal', label: 'Metal railing', description: 'Metal balustrade.' },
    { id: 'balcony_floor_tile', label: 'Tile floor', description: 'Tiled balcony floor.' },
    { id: 'balcony_floor_wood', label: 'Wood deck', description: 'Wooden balcony deck.' },
  ],
  lighting: [
    { id: 'lighting_wall_lights', label: 'Wall lights', description: 'Wall-mounted exterior lights.' },
    { id: 'lighting_warm', label: 'Warm tone', description: 'Warm white lighting mood.' },
    { id: 'lighting_cool', label: 'Cool tone', description: 'Cool white lighting mood.' },
  ],
  landscape: [
    { id: 'landscape_plants', label: 'Plants', description: 'Greenery and shrubs.' },
    { id: 'landscape_planters', label: 'Planters', description: 'Potted plants and planters.' },
    { id: 'landscape_grass', label: 'Grass', description: 'Lawn and grass areas.' },
    { id: 'landscape_pathway', label: 'Pathway', description: 'Path or walkway treatment.' },
  ],
  flooring: [
    { id: 'flooring_driveway_tile', label: 'Driveway tile', description: 'Tiled driveway.' },
    { id: 'flooring_stone', label: 'Stone', description: 'Stone paving.' },
    { id: 'flooring_concrete', label: 'Concrete', description: 'Concrete driveway or paving.' },
  ],
  architectural: [
    { id: 'arch_louvers', label: 'Louvers', description: 'Decorative louvers.' },
    { id: 'arch_fins', label: 'Fins', description: 'Vertical or horizontal fins.' },
    { id: 'arch_cladding_strips', label: 'Cladding strips', description: 'Strip cladding detail.' },
  ],
}

export const EXTERNAL_CATEGORIES: ExternalCategory[] = [
  'facade',
  'windows',
  'entrance',
  'balcony',
  'lighting',
  'landscape',
  'flooring',
  'architectural',
]

export function getInitialExternalCustomization(): ExternalCustomizationState {
  return EXTERNAL_CATEGORIES.reduce(
    (acc, cat) => ({ ...acc, [cat]: null }),
    {} as ExternalCustomizationState
  )
}
