export default function NotFound() {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 560, width: '100%', background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(120,113,108,0.25)', borderRadius: 16, padding: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.01em', color: '#1c1917' }}>Page not found</div>
        <div style={{ marginTop: 8, color: '#57534e', fontSize: 14, lineHeight: 1.5 }}>
          The page you’re looking for doesn’t exist.
        </div>
      </div>
    </div>
  )
}

