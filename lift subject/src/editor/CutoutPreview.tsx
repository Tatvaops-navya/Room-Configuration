import type { DetectedComponent } from '../types'

const PREVIEW_HEIGHT = 280

/**
 * Component preview: entire cutout, transparent background, centered, object-fit contain.
 * No cropping; container has fixed height and centered content.
 */
export function CutoutPreview({
  component,
  previewDataUrl,
}: {
  component: DetectedComponent | null
  previewDataUrl?: string | null
}) {
  const imageUrl = previewDataUrl || component?.cutoutDataUrl

  if (!imageUrl) {
    return (
      <div
        style={{
          height: PREVIEW_HEIGHT,
          border: '2px dashed #e5e7eb',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f1f5f9',
          color: '#64748b',
          fontSize: '14px',
          overflow: 'hidden',
        }}
      >
        No component selected
      </div>
    )
  }

  return (
    <div
      style={{
        height: PREVIEW_HEIGHT,
        border: '2px dashed #e5e7eb',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'repeating-conic-gradient(#e2e8f0 0% 25%, #f8fafc 0% 50%) 50% / 16px 16px',
        overflow: 'hidden',
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src={imageUrl}
          alt={component?.name ?? 'Component preview'}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.08))',
          }}
        />
      </div>
    </div>
  )
}
