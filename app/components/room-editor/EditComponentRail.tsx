'use client'

import { useMemo } from 'react'
import { useRoomEditorStore } from '@/app/lib/room-editor/roomEditorStore'
import { mergeEditComponentList } from '@/app/lib/room-editor/editCatalogUtils'

export default function EditComponentRail({ className = '' }: { className?: string }) {
  const editDetectedSlugs = useRoomEditorStore((s) => s.editDetectedSlugs)
  const editDetectionLoading = useRoomEditorStore((s) => s.editDetectionLoading)
  const editDetectionError = useRoomEditorStore((s) => s.editDetectionError)
  const editSelectedItemId = useRoomEditorStore((s) => s.editSelectedItemId)
  const setEditSelectedItemId = useRoomEditorStore((s) => s.setEditSelectedItemId)

  const items = useMemo(() => mergeEditComponentList(editDetectedSlugs), [editDetectedSlugs])

  return (
    <aside
      className={className}
      style={{
        minWidth: 168,
        maxWidth: 200,
        padding: '0.75rem 0.5rem',
        borderRadius: 12,
        border: '1px solid var(--color-border, #e2e8f0)',
        background: '#f8fafc',
        alignSelf: 'stretch',
      }}
    >
      <p
        style={{
          margin: '0 0 0.5rem',
          padding: '0 0.35rem',
          fontSize: '0.72rem',
          fontWeight: 700,
          letterSpacing: '0.04em',
          color: '#64748b',
          textTransform: 'uppercase',
        }}
      >
        Objects
      </p>
      {editDetectionLoading && (
        <p className="hint-text" style={{ margin: '0.25rem 0.35rem', fontSize: '0.78rem' }}>
          Analysing room…
        </p>
      )}
      {editDetectionError && (
        <p style={{ margin: '0.25rem 0.35rem', fontSize: '0.72rem', color: '#b45309' }}>{editDetectionError}</p>
      )}
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map((row) => {
          const active = editSelectedItemId === row.id
          return (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => setEditSelectedItemId(row.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.45rem 0.5rem',
                  fontSize: '0.85rem',
                  borderRadius: 8,
                  border: `1px solid ${active ? '#0d9488' : 'transparent'}`,
                  background: active ? 'rgba(13,148,136,0.14)' : 'transparent',
                  color: active ? '#0f766e' : '#334155',
                  cursor: 'pointer',
                }}
              >
                {row.label}
              </button>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
