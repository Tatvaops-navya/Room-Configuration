import { useApp } from '../context/AppContext'
import { ReplacePanel } from '../components/editing/ReplacePanel'

export function ReplaceTab() {
  const { state } = useApp()
  const hasSelection = state.selection.activeComponentIds.length > 0

  if (!hasSelection) {
    return (
      <div className="editor-tab-content">
        <p className="editor-small" style={{ color: 'var(--text-tertiary)' }}>
          Select a component to replace it.
        </p>
      </div>
    )
  }

  return (
    <div className="editor-tab-content">
      <ReplacePanel />
    </div>
  )
}
