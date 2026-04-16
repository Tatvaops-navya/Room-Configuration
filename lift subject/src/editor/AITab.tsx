import { useApp } from '../context/AppContext'
import { AIPanel } from '../components/editing/AIPanel'

export function AITab() {
  const { state } = useApp()
  const hasSelection = state.selection.activeComponentIds.length > 0

  if (!hasSelection) {
    return (
      <div className="editor-tab-content">
        <p className="editor-small" style={{ color: 'var(--text-tertiary)' }}>
          Select a component to use AI edit.
        </p>
      </div>
    )
  }

  return (
    <div className="editor-tab-content">
      <AIPanel />
    </div>
  )
}
