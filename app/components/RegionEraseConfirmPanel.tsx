'use client'

import type { EraseRegion } from './EraseRegionSelector'
import RegionCropPreview from './RegionCropPreview'

/**
 * After drawing a rectangle, show a clear magnified preview and require explicit confirmation
 * before the region counts toward Generate.
 */
export default function RegionEraseConfirmPanel({
  imageSrc,
  region,
  confirmed,
  onConfirm,
  onRedraw,
}: {
  imageSrc: string
  region: EraseRegion
  confirmed: boolean
  onConfirm: () => void
  onRedraw: () => void
}) {
  if (confirmed) {
    return (
      <div
        style={{
          marginTop: '0.75rem',
          padding: '0.65rem 0.85rem',
          borderRadius: 10,
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          fontSize: '0.88rem',
          color: '#065f46',
        }}
      >
        <strong>Region confirmed.</strong> Click <strong>Generate Room Configuration</strong> (Step 5A) to apply. To change the area, tap{' '}
        <strong>Redraw selection</strong> below.
      </div>
    )
  }

  return (
    <div
      role="region"
      aria-label="Confirm erase region"
      style={{
        marginTop: '0.85rem',
        padding: '1rem 1.1rem',
        borderRadius: 12,
        border: '2px solid rgba(124, 58, 237, 0.4)',
        background: 'linear-gradient(180deg, rgba(245, 243, 255, 0.95) 0%, rgba(250, 250, 255, 0.98) 100%)',
      }}
    >
      <h4 style={{ margin: '0 0 0.5rem', fontSize: '1rem', color: '#5b21b6' }}>Preview — area to remove</h4>
      <p className="hint-text" style={{ marginBottom: '0.65rem', fontSize: '0.85rem' }}>
        The box on the image can be hard to see through. This is a <strong>magnified</strong> view of exactly what will be inpainted. Is this what you want to erase?
      </p>
      <RegionCropPreview
        imageSrc={imageSrc}
        region={region}
        label="Magnified selection (pixels sent to the AI)"
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.85rem' }}>
        <button type="button" className="button button-secondary" onClick={onRedraw}>
          No — redraw selection
        </button>
        <button
          type="button"
          className="button"
          style={{ background: '#7c3aed', borderColor: '#6d28d9', color: '#fff' }}
          onClick={onConfirm}
        >
          Yes — this is the area to remove
        </button>
      </div>
    </div>
  )
}
