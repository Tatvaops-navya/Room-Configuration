'use client'

import { useRoomEditorStore } from './roomEditorStore'

/**
 * Undo / Redo buttons wired to the room editor store.
 */
export default function HistoryManager({ className = '' }: { className?: string }) {
  const undoStack = useRoomEditorStore((s) => s.undoStack)
  const redoStack = useRoomEditorStore((s) => s.redoStack)
  const undo = useRoomEditorStore((s) => s.undo)
  const redo = useRoomEditorStore((s) => s.redo)

  const canUndo = undoStack.length > 0
  const canRedo = redoStack.length > 0

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'center',
      }}
    >
      <button
        type="button"
        disabled={!canUndo}
        title="Undo"
        style={{
          padding: '0.35rem 0.75rem',
          fontSize: '0.85rem',
          borderRadius: 8,
          border: '1px solid var(--color-border, #e2e8f0)',
          background: canUndo ? '#fff' : '#f1f5f9',
          color: canUndo ? '#334155' : '#94a3b8',
          cursor: canUndo ? 'pointer' : 'not-allowed',
        }}
        onClick={undo}
      >
        Undo
      </button>
      <button
        type="button"
        disabled={!canRedo}
        title="Redo"
        style={{
          padding: '0.35rem 0.75rem',
          fontSize: '0.85rem',
          borderRadius: 8,
          border: '1px solid var(--color-border, #e2e8f0)',
          background: canRedo ? '#fff' : '#f1f5f9',
          color: canRedo ? '#334155' : '#94a3b8',
          cursor: canRedo ? 'pointer' : 'not-allowed',
        }}
        onClick={redo}
      >
        Redo
      </button>
    </div>
  )
}
