'use client'

import { useRoomEditorStore } from '@/app/lib/room-editor/roomEditorStore'
import type { EditorMode } from '@/app/lib/room-editor/types'

interface SelectionModeToolbarProps {
  className?: string
}

const HINT_BY_MODE: Partial<Record<EditorMode, string>> = {
  add: 'Drag on the image to mark where the new object should go; it is scaled to fit that box.',
  replace: 'Drag around the object you want replaced.',
  erase: 'Drag around what you want removed.',
}

/**
 * Single selection method: draw box. No mode switcher — keeps the layout clear next to the side panel.
 */
export default function SelectionModeToolbar({ className = '' }: SelectionModeToolbarProps) {
  const mode = useRoomEditorStore((s) => s.mode)

  const hint = HINT_BY_MODE[mode]
  if (!hint) return null

  return (
    <div
      className={className}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        padding: '0.65rem 0.85rem',
        borderRadius: 10,
        border: '1px solid #e2e8f0',
        background: 'linear-gradient(180deg, #fff 0%, #f8fafc 100%)',
      }}
    >
      <p className="hint-text" style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.45, color: '#475569' }}>
        <span style={{ fontWeight: 600, color: '#0f766e' }}>Draw box</span>
        {' — '}
        {hint}
      </p>
    </div>
  )
}
