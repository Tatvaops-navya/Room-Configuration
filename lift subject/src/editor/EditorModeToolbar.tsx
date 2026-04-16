import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { detectRoomComponents } from '../lib/canvasUtils'
import { isGroundingDinoConfigured } from '../lib/groundingDinoApi'
import { isSamConfigured } from '../lib/samApi'
import { addToast } from '../components/ToastContainer'
import type { InteractionMode } from '../types'

const MODES: { id: InteractionMode; label: string; badge: string }[] = [
  { id: 'rectangle', label: 'Rectangle', badge: 'Rectangle' },
  { id: 'click', label: 'Click', badge: 'Click Select' },
  { id: 'hover', label: 'Hover', badge: 'Hover Select' },
  { id: 'auto', label: 'Auto Detect', badge: 'Auto Detect' },
  { id: 'material', label: 'Material', badge: 'Material Replace' },
]

export function EditorModeToolbar() {
  const { state, dispatch, setInteractionMode, interactionMode } = useApp()
  const [isDetecting, setIsDetecting] = useState(false)
  const hasImage = Boolean(state.image.source)
  const image = state.image

  const runAutoDetection = async () => {
    if (!image.originalDataUrl || !image.width || !image.height) return
    if (!isGroundingDinoConfigured() || !isSamConfigured()) {
      return
    }
    setIsDetecting(true)
    dispatch({
      type: 'SET_EDITING',
      payload: { isExtracting: true, isProcessing: true, currentOperation: 'Detecting components...', progress: 0 },
    })
    try {
      const results = await detectRoomComponents(
        image.originalDataUrl,
        image.width,
        image.height
      )
      if (results.length === 0) {
        addToast('No components detected. Try another image or mode.', 'info')
      } else {
        dispatch({ type: 'ADD_EXTRACTED_COMPONENTS', payload: results })
        addToast(`Detected ${results.length} component(s)`, 'success')
      }
    } catch (e) {
      console.error(e)
      addToast('Auto-detection failed. Check DINO and SAM config.', 'error')
    } finally {
      setIsDetecting(false)
      dispatch({
        type: 'SET_EDITING',
        payload: { isExtracting: false, isProcessing: false, currentOperation: '', progress: 100 },
      })
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '100%',
        maxWidth: 'min(920px, 100%)',
        marginBottom: 8,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Select Mode
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
        {MODES.map((m) => {
          const isActive = interactionMode === m.id
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setInteractionMode(m.id)}
              disabled={!hasImage && m.id !== 'rectangle'}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: isActive ? '2px solid #0ea5e9' : '1px solid #e5e7eb',
                background: isActive ? '#e0f2fe' : '#ffffff',
                color: isActive ? '#0369a1' : '#374151',
                fontSize: 13,
                fontWeight: 600,
                cursor: hasImage ? 'pointer' : 'default',
                opacity: !hasImage && m.id !== 'rectangle' ? 0.6 : 1,
              }}
            >
              {m.label}
            </button>
          )
        })}
        <span
          style={{
            marginLeft: 8,
            padding: '4px 10px',
            borderRadius: 6,
            background: '#f3f4f6',
            color: '#4b5563',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          Mode: {MODES.find((m) => m.id === interactionMode)?.badge ?? interactionMode}
        </span>

        {interactionMode === 'auto' && hasImage && (
          <button
            type="button"
            onClick={runAutoDetection}
            disabled={isDetecting || !isGroundingDinoConfigured() || !isSamConfigured()}
            style={{
              marginLeft: 12,
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #0ea5e9',
              background: isDetecting || !isGroundingDinoConfigured() || !isSamConfigured() ? '#94a3b8' : '#0ea5e9',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: isDetecting ? 'wait' : !isGroundingDinoConfigured() || !isSamConfigured() ? 'default' : 'pointer',
            }}
          >
            {isDetecting ? 'Detecting…' : 'Run detection'}
          </button>
        )}
      </div>

      {interactionMode === 'auto' && hasImage && (!isGroundingDinoConfigured() || !isSamConfigured()) && (
        <div
          style={{
            marginTop: 8,
            padding: '10px 14px',
            borderRadius: 8,
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#b91c1c',
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          Auto-detect requires Grounding DINO and SAM. Set VITE_GROUNDING_DINO_API_KEY, VITE_GROUNDING_DINO_API_URL, VITE_SEGMENTATION_API_KEY, and VITE_SEGMENTATION_API_URL in .env and restart.
        </div>
      )}
    </div>
  )
}
