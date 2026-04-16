import { useState } from 'react'

const ACTIONS = [
  { key: 'download', label: 'Download Cutout', icon: '⬇️', danger: false },
  { key: 'duplicate', label: 'Duplicate Component', icon: '📋', danger: false },
  { key: 'delete', label: 'Delete Component', icon: '🗑️', danger: true },
  { key: 'reset', label: 'Reset Selection', icon: '↺', danger: false },
] as const

export function SidebarActionBar({
  onDownloadCutout,
  onDuplicate,
  onDelete,
  onResetSelection,
  disabled,
}: {
  onDownloadCutout: () => void
  onDuplicate: () => void
  onDelete: () => void
  onResetSelection: () => void
  disabled?: boolean
}) {
  const [hovered, setHovered] = useState<string | null>(null)

  const handlers = {
    download: onDownloadCutout,
    duplicate: onDuplicate,
    delete: onDelete,
    reset: onResetSelection,
  }

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {ACTIONS.map(({ key, label, icon, danger }) => (
        <button
          key={key}
          type="button"
          title={label}
          aria-label={label}
          disabled={disabled}
          onClick={handlers[key]}
          onMouseEnter={() => setHovered(key)}
          onMouseLeave={() => setHovered(null)}
          style={{
            flex: 1,
            minWidth: '80px',
            height: '40px',
            padding: '0 12px',
            border: `1px solid ${danger ? '#fecaca' : '#e5e7eb'}`,
            borderRadius: '8px',
            background: hovered === key && !disabled ? (danger ? '#fef2f2' : '#f9fafb') : 'transparent',
            color: danger ? '#dc2626' : '#6b7280',
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: 500,
            opacity: disabled ? 0.5 : 1,
            transition: 'background 0.15s, color 0.15s',
          }}
        >
          <span style={{ fontSize: '14px' }}>{icon}</span>
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '90px' }}>
            {key === 'download' && 'Download'}
            {key === 'duplicate' && 'Duplicate'}
            {key === 'delete' && 'Delete'}
            {key === 'reset' && 'Reset'}
          </span>
        </button>
      ))}
    </div>
  )
}
