import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { PresetGrid } from './editing/PresetGrid'
import { AIPanel } from './editing/AIPanel'
import { ReplacePanel } from './editing/ReplacePanel'
import { X, Palette, Sparkles, Replace } from 'lucide-react'

export function EditingPanel() {
  const { state, dispatch } = useApp()
  const panel = state.selection.activePanel
  const [localTab, setLocalTab] = useState<'preset' | 'ai' | 'replace'>(panel || 'preset')

  const activeTab = panel ?? localTab
  const hasSelection = state.selection.activeComponentIds.length > 0
  const isOpen = Boolean(panel) && hasSelection

  const close = () => dispatch({ type: 'SET_ACTIVE_PANEL', payload: null })

  if (!hasSelection) return null

  const tabs = [
    { id: 'preset' as const, label: 'Preset', icon: Palette },
    { id: 'ai' as const, label: 'AI', icon: Sparkles },
    { id: 'replace' as const, label: 'Replace', icon: Replace },
  ]

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={close}
          aria-hidden
        />
      )}
      <div
        className={`
          fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-editor-modal max-h-[85vh] flex flex-col border-t border-[var(--neutral-200)]
          lg:relative lg:max-h-none lg:rounded-none lg:shadow-none lg:border-t-0 lg:border-t border-t-[var(--neutral-200)]
          transition-transform duration-300 ease-out editing-panel
          ${isOpen ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'}
        `}
        role="dialog"
        aria-label="Editing options"
      >
        <div className="shrink-0 flex items-center justify-between p-3 lg:p-4 border-b border-[var(--neutral-200)] bg-[var(--neutral-50)]/50">
          <div className="flex gap-0.5 p-1 rounded-xl bg-[var(--neutral-100)] tab-bar">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setLocalTab(tab.id)
                    dispatch({ type: 'SET_ACTIVE_PANEL', payload: tab.id })
                  }}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 -mb-px
                  ${activeTab === tab.id
                      ? 'bg-white text-[var(--neutral-800)] shadow-sm border-b-2 border-[var(--primary)]'
                      : 'text-[var(--neutral-600)] hover:text-[var(--neutral-900)] hover:bg-white/60 border-b-2 border-transparent'}
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
          <button
            type="button"
            onClick={close}
            className="p-2.5 rounded-lg text-[var(--neutral-500)] hover:bg-[var(--neutral-200)] hover:text-[var(--neutral-900)] transition-colors lg:hidden min-w-[44px] min-h-[44px]"
            aria-label="Close panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 lg:p-5 bg-white tab-content min-h-0">
          <div className="tab-content-inner transition-opacity duration-150">
            {activeTab === 'preset' && <PresetGrid />}
            {activeTab === 'ai' && <AIPanel />}
            {activeTab === 'replace' && <ReplacePanel />}
          </div>
        </div>
      </div>
    </>
  )
}
