import { useState } from 'react'
import { useApp } from './context/AppContext'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { UploadZone } from './components/UploadZone'
import { ComparisonView } from './components/ComparisonView'
import { ToastContainer } from './components/ToastContainer'
import { EditorHeader, EditorLayout } from './editor'
import './editor/editor.css'

export default function App() {
  const { state } = useApp()
  const [comparisonOpen, setComparisonOpen] = useState(false)
  useKeyboardShortcuts()
  const hasImage = Boolean(state.image.source)

  return (
    <div className="editor-root min-h-screen flex flex-col bg-white" style={{ minHeight: '100vh' }}>
      <EditorHeader onOpenComparison={() => setComparisonOpen(true)} />
      <main
        className="flex-1 flex flex-col min-h-0 overflow-hidden"
        style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      >
        {!hasImage ? (
          <UploadZone />
        ) : (
          <EditorLayout />
        )}
      </main>
      {comparisonOpen && state.image.originalDataUrl && (
        <ComparisonView onClose={() => setComparisonOpen(false)} />
      )}
      <ToastContainer />
    </div>
  )
}
