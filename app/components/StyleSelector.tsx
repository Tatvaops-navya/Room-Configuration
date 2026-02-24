'use client'

/**
 * Reusable StyleSelector component
 * Grid of style cards with thumbnail and selectable state.
 * Used in both Interior and Exterior flows (Step 3B/3C - right after config mode selection).
 */

export type StyleId =
  | 'modern'
  | 'minimalist'
  | 'rustic'
  | 'luxury'
  | 'tropical'
  | 'cozy'
  | 'farmhouse'
  | 'mediterranean'
  | 'midcentury'
  | 'zen'
  | 'scandinavian'
  | 'bohemian'
  | 'contemporary'
  | 'traditional'
  | 'industrial'
  | 'coastal'
  | 'art_deco'
  | 'japanese'
  | 'transitional'
  | 'industrial_loft'

export interface StyleOption {
  id: StyleId
  name: string
  thumbnail: string
  description?: string
}

/** Default style list: extensible for future styles */
export const STYLE_OPTIONS: StyleOption[] = [
  {
    id: 'modern',
    name: 'Modern',
    thumbnail:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=300&q=70',
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    thumbnail:
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=300&q=70',
  },
  {
    id: 'rustic',
    name: 'Rustic',
    thumbnail:
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=300&q=70',
  },
  {
    id: 'luxury',
    name: 'Luxury',
    thumbnail:
      'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=300&q=70',
  },
  {
    id: 'tropical',
    name: 'Tropical',
    thumbnail:
      'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=300&q=70',
  },
  {
    id: 'cozy',
    name: 'Cozy',
    thumbnail:
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=300&q=70',
  },
  {
    id: 'farmhouse',
    name: 'Farmhouse',
    thumbnail:
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=300&q=70',
  },
  {
    id: 'mediterranean',
    name: 'Mediterranean',
    thumbnail:
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=300&q=70',
  },
  {
    id: 'midcentury',
    name: 'Midcentury',
    thumbnail:
      'https://images.unsplash.com/photo-1501183638710-841dd1904471?auto=format&fit=crop&w=300&q=70',
  },
  {
    id: 'zen',
    name: 'Zen',
    thumbnail:
      'https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?auto=format&fit=crop&w=300&q=70',
  },
  {
    id: 'scandinavian',
    name: 'Scandinavian',
    thumbnail:
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=300&q=70',
  },
  {
    id: 'bohemian',
    name: 'Bohemian',
    thumbnail:
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=300&q=70',
  },
  {
    id: 'contemporary',
    name: 'Contemporary',
    thumbnail:
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=300&q=70',
  },
  {
    id: 'traditional',
    name: 'Traditional',
    thumbnail:
      'https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=300&q=70',
  },
  {
    id: 'industrial',
    name: 'Industrial',
    thumbnail:
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=300&q=70',
  },
  {
    id: 'coastal',
    name: 'Coastal',
    thumbnail:
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=300&q=70',
  },
  {
    id: 'art_deco',
    name: 'Art Deco',
    thumbnail:
      'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=300&q=70',
  },
  {
    id: 'japanese',
    name: 'Japanese',
    thumbnail:
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=300&q=70',
  },
  {
    id: 'transitional',
    name: 'Transitional',
    thumbnail:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=300&q=70',
  },
  {
    id: 'industrial_loft',
    name: 'Industrial Loft',
    thumbnail:
      'https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=300&q=70',
  },
]

interface StyleSelectorProps {
  /** Currently selected style id (e.g. 'modern'). Empty string or null = none selected. */
  selectedStyle: string | null
  /** Called when user selects a style. Pass style id string. */
  onSelect: (styleId: string) => void
  /** Optional variant for step label (internal / external) */
  variant?: 'internal' | 'external'
  /** Optional step label override */
  stepLabel?: string
  /** Optional disabled state */
  disabled?: boolean
}

export default function StyleSelector({
  selectedStyle,
  onSelect,
  variant = 'internal',
  stepLabel,
  disabled = false,
}: StyleSelectorProps) {
  const step = stepLabel ?? (variant === 'external' ? '🏡 STEP 3C' : '🏠 STEP 3B')

  return (
    <div className="card">
      <div className="step-label">{step}</div>
      <div className="step-title-row">
        <h2>Style Selection</h2>
      </div>
      <p className="hint-text" style={{ marginBottom: '1rem' }}>
        Choose a design style. The AI will apply this style to your {variant === 'external' ? 'exterior' : 'room'} with photorealistic rendering.
        {selectedStyle && (
          <span style={{ display: 'block', marginTop: '0.5rem', color: '#10b981', fontWeight: 500 }}>
            ✓ Style selected: {selectedStyle.charAt(0).toUpperCase() + selectedStyle.slice(1)}. You can proceed directly to generate, or optionally add reference images below.
          </span>
        )}
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '0.9rem',
          alignItems: 'start',
        }}
      >
        {STYLE_OPTIONS.map((style) => {
          const isSelected = selectedStyle === style.id
          return (
            <button
              key={style.id}
              type="button"
              className="button button-secondary"
              disabled={disabled}
              onClick={() => onSelect(style.id)}
              style={{
                padding: '0.75rem 0.5rem',
                textAlign: 'center',
                borderRadius: '12px',
                border: isSelected ? '2px solid var(--color-primary, #3b82f6)' : '1px solid #e2e8f0',
                background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'white',
              }}
            >
              <div
                style={{
                  width: '92px',
                  height: '92px',
                  borderRadius: '999px',
                  overflow: 'hidden',
                  margin: '0 auto 0.55rem',
                  border: isSelected ? '3px solid rgba(59, 130, 246, 0.45)' : '1px solid #e2e8f0',
                  boxShadow: isSelected ? '0 8px 22px rgba(59, 130, 246, 0.18)' : 'none',
                }}
              >
                <img
                  src={style.thumbnail}
                  alt={style.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                {style.name}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
