import type { DetectedComponent } from '../types'

export function ComponentInfoCard({ component }: { component: DetectedComponent | null }) {
  if (!component) return null

  const confidencePct =
    component.confidence <= 1 ? Math.round(component.confidence * 100) : Math.round(component.confidence)

  return (
    <div
      style={{
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div
        style={{
          fontSize: '12px',
          fontWeight: 700,
          color: '#6b7280',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Component Info
      </div>

      <div>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', marginBottom: '8px' }}>Type</div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{component.name}</div>
      </div>

      <div>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', marginBottom: '8px' }}>Dimensions</div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
          {Math.round(component.region.width)} × {Math.round(component.region.height)} px
        </div>
      </div>

      <div>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', marginBottom: '8px' }}>Position</div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
          X: {Math.round(component.region.x)}px, Y: {Math.round(component.region.y)}px
        </div>
      </div>

      <div>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', marginBottom: '8px' }}>Confidence</div>
        <div
          style={{
            width: '100%',
            height: '8px',
            background: '#e5e7eb',
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #0ea5e9, #06b6d4)',
              width: `${Math.min(100, Math.max(0, confidencePct))}%`,
            }}
          />
        </div>
        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{confidencePct}%</div>
      </div>

      <div>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', marginBottom: '8px' }}>Status</div>
        <div
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#10b981',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
          }}
        >
          ✓ Ready to edit
        </div>
      </div>
    </div>
  )
}
