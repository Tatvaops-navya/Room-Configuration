'use client'

import { useEffect } from 'react'
import { useRoomEditorStore } from '@/app/lib/room-editor/roomEditorStore'
import ModeController from '@/app/lib/room-editor/ModeController'
import HistoryManager from '@/app/lib/room-editor/HistoryManager'
import CanvasInteraction from './CanvasInteraction'
import SelectionModeToolbar from './SelectionModeToolbar'
import SidePanel from './SidePanel'
import PreviewPanel from './PreviewPanel'
import EditComponentRail from './EditComponentRail'
import EditCustomizationPanel from './EditCustomizationPanel'

interface RoomEditorWorkbenchProps {
  /** The room image to edit (e.g. generated result). When changed, syncs to store. */
  imageUrl: string | null
  /** Called when user applies a change; parent can sync to main app state. */
  onApply?: (newImageUrl: string) => void
  className?: string
}

/**
 * Complete room editor: canvas + mode controller + side panel + preview + history.
 * Flow: Select mode → Select area → Configure → Preview → Apply or Cancel
 */
export default function RoomEditorWorkbench({ imageUrl, onApply, className = '' }: RoomEditorWorkbenchProps) {
  const setWorkingImage = useRoomEditorStore((s) => s.setWorkingImage)
  const setOriginalImage = useRoomEditorStore((s) => s.setOriginalImage)
  const workingImage = useRoomEditorStore((s) => s.workingImage)
  const mode = useRoomEditorStore((s) => s.mode)
  const previewLoading = useRoomEditorStore((s) => s.previewLoading)
  const editSelectedItemId = useRoomEditorStore((s) => s.editSelectedItemId)
  const setEditSelectedItemId = useRoomEditorStore((s) => s.setEditSelectedItemId)
  const setEditDetectedSlugs = useRoomEditorStore((s) => s.setEditDetectedSlugs)
  const setEditDetectionLoading = useRoomEditorStore((s) => s.setEditDetectionLoading)
  const setEditDetectionError = useRoomEditorStore((s) => s.setEditDetectionError)

  useEffect(() => {
    if (imageUrl) {
      setOriginalImage(imageUrl)
      setWorkingImage(imageUrl)
    }
  }, [imageUrl, setOriginalImage, setWorkingImage])

  useEffect(() => {
    if (mode === 'edit' && !editSelectedItemId) {
      setEditSelectedItemId('wall')
    }
  }, [mode, editSelectedItemId, setEditSelectedItemId])

  useEffect(() => {
    if (mode !== 'edit' || !workingImage) return
    let cancelled = false
    setEditDetectionLoading(true)
    setEditDetectionError(null)
    fetch('/api/detect-components', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: workingImage }),
    })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) {
          throw new Error(typeof data?.error === 'string' ? data.error : 'Detection failed')
        }
        return data
      })
      .then((data: { components?: string[] }) => {
        if (!cancelled) setEditDetectedSlugs(Array.isArray(data.components) ? data.components : [])
      })
      .catch((e: Error) => {
        if (!cancelled) setEditDetectionError(e.message ?? 'Detection failed')
      })
      .finally(() => {
        if (!cancelled) setEditDetectionLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [mode, workingImage, setEditDetectedSlugs, setEditDetectionLoading, setEditDetectionError])

  /** Committed image only — do not show preview here so users review in PreviewPanel first, then Apply. */
  const canvasImage = workingImage || imageUrl
  const hasAnyImage = Boolean(canvasImage)
  if (!hasAnyImage) {
    return (
      <div className={className} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
        <p>Load or generate a room image to start customizing.</p>
      </div>
    )
  }

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <ModeController />
        <HistoryManager />
      </div>

      {mode === 'edit' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, auto) minmax(0, 1fr) minmax(280px, 340px)',
            gap: '1rem',
            alignItems: 'start',
          }}
        >
          <EditComponentRail />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>
            <div className="generating-fixed-layout">
              <div style={{ width: '100%', position: 'relative' }}>
                {canvasImage ? (
                  <CanvasInteraction
                    imageSrc={canvasImage}
                    className="room-editor-canvas"
                    fullWidth
                  />
                ) : null}
                {previewLoading && (
                  <>
                    <div className="generating-bar-vertical-track" aria-hidden>
                      <div className="generating-bar-vertical" />
                    </div>
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'flex-end',
                        padding: '0.6rem 0.9rem',
                        pointerEvents: 'none',
                      }}
                    >
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.35rem 0.75rem',
                          borderRadius: 999,
                          background: 'rgba(15,23,42,0.82)',
                          color: '#e5e7eb',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          boxShadow: '0 8px 20px rgba(15,23,42,0.65)',
                        }}
                      >
                        <span className="spinner" aria-hidden style={{ width: 14, height: 14 }} />
                        <span>Applying change…</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <SelectionModeToolbar />
            </div>
            <PreviewPanel
              onApply={() => {
                const img = useRoomEditorStore.getState().workingImage
                if (img) onApply?.(img)
              }}
            />
          </div>
          <EditCustomizationPanel />
        </div>
      ) : (
        <>
          <div
            className="generating-fixed-layout"
            style={{
              marginBottom: '1rem',
            }}
          >
            <div style={{ width: '100%', position: 'relative' }}>
              {canvasImage ? (
                <CanvasInteraction
                  imageSrc={canvasImage}
                  className="room-editor-canvas"
                  fullWidth
                />
              ) : null}
              {previewLoading && (
                <>
                  <div className="generating-bar-vertical-track" aria-hidden>
                    <div className="generating-bar-vertical" />
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'flex-end',
                      padding: '0.6rem 0.9rem',
                      pointerEvents: 'none',
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.35rem 0.75rem',
                        borderRadius: 999,
                        background: 'rgba(15,23,42,0.82)',
                        color: '#e5e7eb',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        boxShadow: '0 8px 20px rgba(15,23,42,0.65)',
                      }}
                    >
                      <span className="spinner" aria-hidden style={{ width: 14, height: 14 }} />
                      <span>Applying change…</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div style={{ marginTop: '0.75rem' }}>
            <SelectionModeToolbar />
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1.25rem',
              alignItems: 'flex-start',
              marginTop: '0.75rem',
            }}
          >
            <div style={{ flex: '0 1 340px', width: '100%', maxWidth: 400 }}>
              <SidePanel />
            </div>
            <div style={{ flex: '1 1 280px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <PreviewPanel
                onApply={() => {
                  const img = useRoomEditorStore.getState().workingImage
                  if (img) onApply?.(img)
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
