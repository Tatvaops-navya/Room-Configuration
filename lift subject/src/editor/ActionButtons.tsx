export function ActionButtons({
  onPreset,
  onAI,
  onReplace,
  disabled,
}: {
  onPreset: () => void
  onAI: () => void
  onReplace: () => void
  disabled?: boolean
}) {
  const buttonStyle = (gradient: string): React.CSSProperties => ({
    width: '100%',
    height: '48px',
    padding: '0 16px',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#ffffff',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    background: gradient,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.2s',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <button
        type="button"
        style={buttonStyle('linear-gradient(to right, #0ea5e9, #06b6d4)')}
        onClick={onPreset}
        disabled={disabled}
        aria-label="Apply preset"
      >
        🎨 Preset
      </button>
      <button
        type="button"
        style={buttonStyle('linear-gradient(to right, #8b5cf6, #a855f7)')}
        onClick={onAI}
        disabled={disabled}
        aria-label="AI edit"
      >
        ⚡ AI
      </button>
      <button
        type="button"
        style={buttonStyle('linear-gradient(to right, #ec4899, #f43f5e)')}
        onClick={onReplace}
        disabled={disabled}
        aria-label="Replace component"
      >
        🔄 Replace
      </button>
    </div>
  )
}
