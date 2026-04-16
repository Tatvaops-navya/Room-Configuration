import { useApp } from '../context/AppContext'

export function EditorHeader({ onOpenComparison }: { onOpenComparison?: () => void }) {
  const { state } = useApp()
  const hasImage = Boolean(state.image.source)
  const nComp = state.components.length
  const nSel = state.selection.activeComponentIds.length

  return (
    <header
      className="editor-header"
      role="banner"
    >
      <div className="editor-header__title">
        ✨ Component Editor
      </div>

      {hasImage && nComp > 0 && (
        <div className="editor-header__status">
          {nComp} component{nComp !== 1 ? 's' : ''} · {nSel} selected
        </div>
      )}

      <div className="editor-header__actions">
        <button
          type="button"
          onClick={onOpenComparison}
          className="editor-header__export-btn"
        >
          Export
        </button>
      </div>
    </header>
  )
}
