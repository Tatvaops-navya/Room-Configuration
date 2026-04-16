export function QuickActionsBar({
  onCopy,
  onDownload,
  onHide,
  onDelete,
  disabled,
}: {
  onCopy: () => void
  onDownload: () => void
  onHide: () => void
  onDelete: () => void
  disabled?: boolean
}) {
  const buttonStyle = (isDelete = false): React.CSSProperties => ({
    flex: 1,
    height: '40px',
    padding: '0',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    background: 'transparent',
    color: isDelete ? '#dc2626' : '#6b7280',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 500,
    fontSize: '14px',
    gap: '4px',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.2s',
  })

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button type="button" style={buttonStyle()} onClick={onCopy} disabled={disabled} title="Copy" aria-label="Copy">
        📋
      </button>
      <button
        type="button"
        style={buttonStyle()}
        onClick={onDownload}
        disabled={disabled}
        title="Download"
        aria-label="Download"
      >
        ⬇️
      </button>
      <button type="button" style={buttonStyle()} onClick={onHide} disabled={disabled} title="Hide" aria-label="Hide">
        👁️
      </button>
      <button
        type="button"
        style={buttonStyle(true)}
        onClick={onDelete}
        disabled={disabled}
        title="Delete"
        aria-label="Delete"
      >
        🗑️
      </button>
    </div>
  )
}
