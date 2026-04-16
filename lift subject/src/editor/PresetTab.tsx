import { useApp } from '../context/AppContext'
import { PresetGrid } from '../components/editing/PresetGrid'

export function PresetTab() {
  const { state } = useApp()
  const hasSelection = state.selection.activeComponentIds.length > 0

  if (!hasSelection) {
    return (
      <div className="editor-tab-content">
        <p className="editor-small" style={{ color: 'var(--text-tertiary)' }}>
          Select a component to apply presets.
        </p>
      </div>
    )
  }

  return (
    <div className="editor-tab-content">
      <PresetGrid />
    </div>
  )
}
