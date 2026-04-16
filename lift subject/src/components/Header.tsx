import { useState } from 'react'
import { Undo2, Redo2, Eye, Settings, Download, ChevronDown, Scissors, HelpCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'

export function Header({ onOpenComparison }: { onOpenComparison?: () => void }) {
  const { state, dispatch } = useApp()
  const [exportOpen, setExportOpen] = useState(false)
  const canUndo = state.history.undo.length > 0
  const canRedo = state.history.redo.length > 0
  const hasImage = Boolean(state.image.source)
  const nComp = state.components.length
  const nSel = state.selection.activeComponentIds.length

  return (
    <header
      className="h-[60px] shrink-0 flex items-center justify-between px-4 md:px-6 lg:px-8 bg-white border-b border-[var(--neutral-200)] shadow-sm"
      role="banner"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 lg:w-9 lg:h-9 shrink-0 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center shadow-sm">
          <Scissors className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
        </div>
        <h1 className="font-semibold text-base lg:text-lg text-[var(--neutral-900)] tracking-tight truncate">
          Component Editor
        </h1>
      </div>
      {hasImage && nComp > 0 && (
        <p className="hidden md:block text-[13px] text-[var(--neutral-500)] text-center flex-1 mx-4">
          {nComp} component{nComp !== 1 ? 's' : ''} · {nSel} selected
        </p>
      )}
      <div className="flex items-center gap-0.5 lg:gap-1 shrink-0">
        {hasImage && (
          <>
            <button
              type="button"
              onClick={() => dispatch({ type: 'UNDO' })}
              disabled={!canUndo}
              className="p-2.5 rounded-[var(--radius-sm)] text-[var(--neutral-600)] hover:bg-[var(--neutral-100)] hover:text-[var(--primary)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
              aria-label="Undo"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: 'REDO' })}
              disabled={!canRedo}
              className="p-2.5 rounded-[var(--radius-sm)] text-[var(--neutral-600)] hover:bg-[var(--neutral-100)] hover:text-[var(--primary)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
              aria-label="Redo"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onOpenComparison}
              className="p-2.5 rounded-[var(--radius-sm)] text-[var(--neutral-600)] hover:bg-[var(--neutral-100)] hover:text-[var(--primary)] transition-all duration-200 hover:scale-105 active:scale-95"
              aria-label="Preview before and after"
              title="Preview (Before/After)"
            >
              <Eye className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-[var(--neutral-200)] mx-1" />
            <div className="relative">
              <button
                type="button"
                onClick={() => setExportOpen((v) => !v)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-sm)] bg-gradient-to-b from-[var(--primary)] to-[var(--primary-hover)] text-white text-sm font-semibold shadow-sm hover:shadow-md hover:brightness-105 active:scale-[0.98] transition-all duration-200"
                aria-expanded={exportOpen}
                aria-haspopup="true"
              >
                <Download className="w-4 h-4" />
                Export
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${exportOpen ? 'rotate-180' : ''}`} />
              </button>
              {exportOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} aria-hidden />
                  <div className="absolute right-0 top-full mt-2 py-2 w-52 bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-modal)] border border-[var(--neutral-200)] z-20 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        if (state.image.source) {
                          const a = document.createElement('a')
                          a.href = state.image.source
                          a.download = 'edited-image.png'
                          a.click()
                        }
                        setExportOpen(false)
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-[var(--neutral-700)] hover:bg-[var(--neutral-50)] transition-colors"
                    >
                      Download full image
                    </button>
                    <button
                      type="button"
                      onClick={() => setExportOpen(false)}
                      className="w-full text-left px-4 py-2.5 text-sm text-[var(--neutral-500)] hover:bg-[var(--neutral-50)] transition-colors"
                    >
                      Export selected cutouts…
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
        <button
          type="button"
          className="p-2.5 rounded-lg text-[var(--neutral-600)] hover:bg-[var(--neutral-100)] hover:text-[var(--primary)] transition-all duration-200 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0"
          aria-label="Settings"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
        <button
          type="button"
          className="p-2.5 rounded-lg text-[var(--neutral-600)] hover:bg-[var(--neutral-100)] hover:text-[var(--primary)] transition-all duration-200 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0"
          aria-label="Help"
          title="Help"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}
