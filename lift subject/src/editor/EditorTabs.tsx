import { useApp } from '../context/AppContext'
import { PresetTab } from './PresetTab'
import { AITab } from './AITab'
import { ReplaceTab } from './ReplaceTab'

const TABS: { id: 'preset' | 'ai' | 'replace'; label: string }[] = [
  { id: 'preset', label: 'Preset' },
  { id: 'ai', label: 'AI' },
  { id: 'replace', label: 'Replace' },
]

export function EditorTabs() {
  const { state, dispatch } = useApp()
  const activeTab = (state.selection.activePanel === 'export' ? 'preset' : state.selection.activePanel) ?? 'preset'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', gap: 0 }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => dispatch({ type: 'SET_ACTIVE_PANEL', payload: tab.id })}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: activeTab === tab.id ? '#0ea5e9' : '#6b7280',
              borderBottom: activeTab === tab.id ? '3px solid #0ea5e9' : '3px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        style={{
          padding: '16px 0',
          color: '#6b7280',
          fontSize: '14px',
          minHeight: '120px',
        }}
      >
        {activeTab === 'preset' && <PresetTab />}
        {activeTab === 'ai' && <AITab />}
        {activeTab === 'replace' && <ReplaceTab />}
      </div>
    </div>
  )
}
