import { useEffect, useState } from 'react'
import { CanvasArea } from './CanvasArea'
import { EditorSidebar } from './EditorSidebar'
import { EditorModeToolbar } from './EditorModeToolbar'

export function EditorLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const [isPanelOpen, setPanelOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false)
        setPanelOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setSidebarOpen(false)
      setPanelOpen(false)
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  return (
    <div className="editor-layout-shell">
      <div className="editor-mobile-topbar">
        <button type="button" className="editor-mobile-topbar__btn" onClick={() => setSidebarOpen(true)}>
          ☰ Menu
        </button>
        <button type="button" className="editor-mobile-topbar__btn" onClick={() => setPanelOpen(true)}>
          Settings
        </button>
      </div>

      <div className="editor-layout">
        {/* DESKTOP/TABLET: LEFT SIDEBAR */}
        <aside className={`editor-left-sidebar ${isSidebarOpen ? 'is-open' : ''}`} aria-label="Object categories and modes">
          <EditorModeToolbar />
        </aside>

        {/* CENTER: CANVAS AREA */}
        <section className="editor-layout__canvas" aria-label="Main editing canvas">
          <CanvasArea />
        </section>

        {/* RIGHT: SETTINGS / PROMPT / PREVIEW PANEL */}
        <aside className={`editor-right-panel ${isPanelOpen ? 'is-open' : ''}`} aria-label="Editor settings panel">
          <EditorSidebar />
        </aside>
      </div>

      <div
        className={`editor-layout__overlay ${isSidebarOpen || isPanelOpen ? 'is-visible' : ''}`}
        onClick={() => {
          setSidebarOpen(false)
          setPanelOpen(false)
        }}
        aria-hidden
      />

      <div className="editor-mobile-bottom-toolbar" role="toolbar" aria-label="Mobile quick actions">
        <button type="button" className="editor-mobile-bottom-toolbar__btn" onClick={() => setSidebarOpen(true)}>
          Menu
        </button>
        <button type="button" className="editor-mobile-bottom-toolbar__btn" onClick={() => setPanelOpen(true)}>
          Edit
        </button>
      </div>
    </div>
  )
}
