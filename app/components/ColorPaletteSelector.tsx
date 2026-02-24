'use client'

/**
 * ColorPaletteSelector – optional color palette selection (after style).
 * User selects a palette; AI generates/reconfigures based on style + color palette.
 * Reference: "Select a color palette (Optional)" with Surprise Me, High-Contrast Neutrals, Forest-Inspired, Romance.
 */

export type ColorPaletteId =
  | 'surprise_me'
  | 'high_contrast_neutrals'
  | 'forest_inspired'
  | 'romance'
  | 'ocean_breeze'
  | 'sunset_warmth'
  | 'earth_tones'
  | 'monochrome'
  | 'jewel_tones'
  | 'pastel_dreams'
  | 'industrial'
  | 'coastal_serenity'
  | 'autumn_harvest'
  | 'lavender_mist'

export interface ColorPaletteOption {
  id: ColorPaletteId
  name: string
  /** CSS colors for the visual circles, e.g. ['#f5f5f5', '#d4c4a8', '#1a1a1a'] */
  colors: [string, string, string]
  /** Optional short description for the card */
  description?: string
}

export const COLOR_PALETTE_OPTIONS: ColorPaletteOption[] = [
  {
    id: 'surprise_me',
    name: 'Surprise Me',
    colors: ['#fef3c7', '#f59e0b', '#7c3aed'],
    description: 'Let AI choose a complementary palette',
  },
  {
    id: 'high_contrast_neutrals',
    name: 'High-Contrast Neutrals',
    colors: ['#e5e7eb', '#d4c4a8', '#1a1a1a'],
    description: 'Light grey, beige, black accents',
  },
  {
    id: 'forest_inspired',
    name: 'Forest-Inspired',
    colors: ['#d4a574', '#5c4033', '#6b7c3f'],
    description: 'Tan, dark brown, olive green',
  },
  {
    id: 'romance',
    name: 'Romance',
    colors: ['#fce7f3', '#bbf7d0', '#a8a29e'],
    description: 'Pale pink, sage green, muted brown',
  },
  {
    id: 'ocean_breeze',
    name: 'Ocean Breeze',
    colors: ['#e0f2fe', '#0ea5e9', '#0369a1'],
    description: 'Sky blue, aqua, deep ocean',
  },
  {
    id: 'sunset_warmth',
    name: 'Sunset Warmth',
    colors: ['#fed7aa', '#ea580c', '#7c2d12'],
    description: 'Peach, terracotta, deep rust',
  },
  {
    id: 'earth_tones',
    name: 'Earth Tones',
    colors: ['#d6d3d1', '#78716c', '#44403c'],
    description: 'Stone, taupe, warm grey',
  },
  {
    id: 'monochrome',
    name: 'Monochrome',
    colors: ['#fafafa', '#737373', '#171717'],
    description: 'Clean whites, greys, and black',
  },
  {
    id: 'jewel_tones',
    name: 'Jewel Tones',
    colors: ['#c4b5fd', '#7c3aed', '#4c1d95'],
    description: 'Amethyst, sapphire, emerald hints',
  },
  {
    id: 'pastel_dreams',
    name: 'Pastel Dreams',
    colors: ['#fce7f3', '#ddd6fe', '#a7f3d0'],
    description: 'Soft pink, lavender, mint',
  },
  {
    id: 'industrial',
    name: 'Industrial',
    colors: ['#f5f5f4', '#a8a29e', '#292524'],
    description: 'Concrete grey, metal, charcoal',
  },
  {
    id: 'coastal_serenity',
    name: 'Coastal Serenity',
    colors: ['#f0fdfa', '#5eead4', '#0f766e'],
    description: 'Seafoam, teal, deep green',
  },
  {
    id: 'autumn_harvest',
    name: 'Autumn Harvest',
    colors: ['#fef3c7', '#d97706', '#92400e'],
    description: 'Amber, burnt orange, brown',
  },
  {
    id: 'lavender_mist',
    name: 'Lavender Mist',
    colors: ['#f5f3ff', '#a78bfa', '#5b21b6'],
    description: 'Soft violet, lilac, deep purple',
  },
]

interface ColorPaletteSelectorProps {
  selectedPalette: string | null
  onSelect: (paletteId: string) => void
  variant?: 'internal' | 'external'
  disabled?: boolean
}

export default function ColorPaletteSelector({
  selectedPalette,
  onSelect,
  variant = 'internal',
  disabled = false,
}: ColorPaletteSelectorProps) {
  return (
    <div className="card">
      <div className="step-label">{variant === 'external' ? '🏡' : '🏠'} Color palette (optional)</div>
      <div className="step-title-row">
        <h2>Select a color palette (Optional)</h2>
      </div>
      <p className="hint-text" style={{ marginBottom: '1rem' }}>
        Choose a color palette to guide the AI. The {variant === 'external' ? 'exterior' : 'room'} will be generated or reconfigured based on your style and this palette.
      </p>
      <div className="color-palette-grid">
        {COLOR_PALETTE_OPTIONS.map((palette) => {
          const isSelected = selectedPalette === palette.id
          const isSurprise = palette.id === 'surprise_me'
          return (
            <button
              key={palette.id}
              type="button"
              className={`color-palette-card ${isSelected ? 'selected' : ''}`}
              disabled={disabled}
              onClick={() => onSelect(palette.id)}
            >
              <div className="color-palette-visual">
                {isSurprise ? (
                  <span className="color-palette-icon" aria-hidden>🎉</span>
                ) : (
                    <div className="color-palette-circles">
                    {palette.colors.map((color, i) => (
                      <span
                        key={i}
                        className="color-palette-circle"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="color-palette-name">{palette.name}</div>
              {palette.description && (
                <div className="color-palette-desc">{palette.description}</div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
