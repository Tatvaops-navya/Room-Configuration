'use client'

import { useRoomEditorStore } from './roomEditorStore'
import type { EditorMode } from './types'

const MODES: { id: EditorMode; label: string; color: string }[] = [
  { id: 'edit', label: 'Customize', color: '#0d9488' },
  { id: 'add', label: 'Add', color: '#eab308' },
  { id: 'replace', label: 'Replace', color: '#3b82f6' },
  { id: 'erase', label: 'Erase', color: '#ef4444' },
]

/**
 * Mode buttons: Customize, Add, Replace, Erase.
 * Switching modes resets selection and preview via store.
 */
export default function ModeController({ className = '' }: { className?: string }) {
  const mode = useRoomEditorStore((s) => s.mode)
  const setMode = useRoomEditorStore((s) => s.setMode)

  return (
    <div
      className={className}
      role="tablist"
      aria-label="Customization mode"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
        padding: '0.5rem 0',
      }}
    >
      {MODES.map((m) => {
        const isActive = mode === m.id
        return (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`selection-highlight ${isActive ? 'is-selected' : ''}`}
            style={{
              padding: '0.45rem 1rem',
              fontSize: '0.9rem',
              fontWeight: 600,
              borderRadius: 8,
              border: `2px solid ${isActive ? m.color : 'var(--color-border, #e2e8f0)'}`,
              background: isActive ? `${m.color}18` : '#fff',
              color: isActive ? m.color : '#64748b',
              cursor: 'pointer',
            }}
            onClick={() => setMode(m.id)}
          >
            {m.label}
          </button>
        )
      })}
    </div>
  )
}
