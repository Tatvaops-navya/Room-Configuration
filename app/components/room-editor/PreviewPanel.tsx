'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRoomEditorStore } from '@/app/lib/room-editor/roomEditorStore'
import { cropFromNormalizedBbox } from '@/app/lib/room-editor/cutoutUtils'
import { runRoomEditorPreview } from '@/app/lib/room-editor/runRoomEditorPreview'
import type { Selection } from '@/app/lib/room-editor/types'
/** Shows the selected region so user can confirm before generating. */
function SelectionConfirmPreview({
  workingImage,
  selection,
  onReselect,
}: {
  workingImage: string
  selection: Selection
  onReselect: () => void
}) {
  const [croppedUrl, setCroppedUrl] = useState<string | null>(null)

  useEffect(() => {
    if (selection.cutoutDataUrl) {
      setCroppedUrl(null)
      return
    }
    if (!workingImage || !selection.boundingBox) return
    let cancelled = false
    cropFromNormalizedBbox(workingImage, selection.boundingBox)
      .then((url) => {
        if (!cancelled) setCroppedUrl(url)
      })
      .catch(() => {
        if (!cancelled) setCroppedUrl(null)
      })
    return () => {
      cancelled = true
    }
  }, [workingImage, selection.boundingBox, selection.cutoutDataUrl])

  const previewUrl = selection.cutoutDataUrl ?? croppedUrl
  const isLoading = !selection.cutoutDataUrl && !croppedUrl

  return (
    <div
      style={{
        marginBottom: '1rem',
        padding: '0.75rem',
        background: '#f8fafc',
        borderRadius: 10,
        border: '1px solid var(--color-border, #e2e8f0)',
      }}
    >
      <p className="hint-text" style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
        Confirm your selection
      </p>
      <p className="hint-text" style={{ margin: 0, fontSize: '0.8rem', marginBottom: '0.5rem' }}>
        Is this the correct area? Click Reselect to choose again, or continue to generate preview.
      </p>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            flexShrink: 0,
            width: 180,
            height: 140,
            borderRadius: 8,
            overflow: 'hidden',
            background: 'repeating-conic-gradient(#e2e8f0 0% 25%, #f8fafc 0% 50%) 50% / 12px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isLoading ? (
            <span className="hint-text" style={{ fontSize: '0.8rem' }}>Loading…</span>
          ) : (
            <img
              src={previewUrl!}
              alt="Selected region"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
              }}
            />
          )}
        </div>
        <button
          type="button"
          className="button button-secondary"
          style={{ fontSize: '0.85rem' }}
          onClick={onReselect}
        >
          Reselect
        </button>
      </div>
    </div>
  )
}

function SimpleBeforeAfterSlider({
  beforeUrl,
  afterUrl,
  beforeLabel = 'Before',
  afterLabel = 'After',
}: {
  beforeUrl: string
  afterUrl: string
  beforeLabel?: string
  afterLabel?: string
}) {
  const [position, setPosition] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMove = useCallback((clientX: number) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = clientX - rect.left
    setPosition(Math.min(100, Math.max(0, (x / rect.width) * 100)))
  }, [])

  useEffect(() => {
    setPosition(50)
  }, [beforeUrl, afterUrl])

  const [isDragging, setIsDragging] = useState(false)
  useEffect(() => {
    if (!isDragging) return
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX)
    const onMouseUp = () => setIsDragging(false)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [isDragging, handleMove])

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%', overflow: 'hidden', borderRadius: 8 }}
      onMouseDown={(e) => {
        e.preventDefault()
        setIsDragging(true)
        handleMove(e.clientX)
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span className="hint-text" style={{ fontSize: '0.82rem' }}>{beforeLabel}</span>
        <span className="hint-text" style={{ fontSize: '0.82rem' }}>{afterLabel}</span>
      </div>
      <div
        style={{
          position: 'relative',
          aspectRatio: '16/10',
          maxHeight: 280,
          background: '#0f172a',
          borderRadius: 8,
        }}
      >
        <img
          src={beforeUrl}
          alt="Before"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            clipPath: `inset(0 ${100 - position}% 0 0)`,
          }}
        >
          <img
            src={afterUrl}
            alt="After"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            left: `${position}%`,
            top: 0,
            bottom: 0,
            width: 3,
            background: '#0d9488',
            transform: 'translateX(-50%)',
            cursor: 'ew-resize',
          }}
        />
      </div>
    </div>
  )
}

interface PreviewPanelProps {
  onApply?: () => void
  onCancel?: () => void
  className?: string
}

/**
 * Preview panel: before/after slider when preview exists, Apply/Cancel, and API call trigger.
 */
export default function PreviewPanel({ onApply, onCancel, className = '' }: PreviewPanelProps) {
  const mode = useRoomEditorStore((s) => s.mode)
  const selection = useRoomEditorStore((s) => s.selection)
  const setSelection = useRoomEditorStore((s) => s.setSelection)
  const workingImage = useRoomEditorStore((s) => s.workingImage)
  const previewImage = useRoomEditorStore((s) => s.previewImage)
  const apply = useRoomEditorStore((s) => s.apply)
  const cancel = useRoomEditorStore((s) => s.cancel)
  const previewLoading = useRoomEditorStore((s) => s.previewLoading)
  const previewError = useRoomEditorStore((s) => s.previewError)

  const hasPreview = Boolean(previewImage)
  const hasSelection = Boolean(selection?.maskDataUrl)
  const displayImage = previewImage || workingImage

  const sidePanelRunsPreview = mode === 'add' || mode === 'replace' || mode === 'erase'

  const handleApply = useCallback(() => {
    apply()
    onApply?.()
  }, [apply, onApply])

  const handleCancel = useCallback(() => {
    cancel()
    onCancel?.()
  }, [cancel, onCancel])

  if (mode === 'idle' || !displayImage) return null

  return (
    <div
      className={className}
      style={{
        padding: '1rem',
        borderRadius: 12,
        border: '1px solid var(--color-border, #e2e8f0)',
        background: '#fff',
      }}
    >
      {!hasSelection ? (
        <p className="hint-text" style={{ margin: 0, fontSize: '0.9rem' }}>
          {mode === 'edit'
            ? 'Pick an object on the left, choose Style / Colour / Material (or AI), then confirm customization. Edit applies through the normal edit flow without manual area selection.'
            : mode === 'add'
              ? 'Please select an area to place the object.'
              : `Select an area on the image to ${mode === 'replace' ? 'replace' : 'erase'}.`}
        </p>
      ) : (
        <>
          {hasPreview ? (
            <div>
              <p className="hint-text" style={{ margin: '0 0 0.5rem', fontSize: '0.85rem' }}>
                Compare before and below. The large image above stays unchanged until you click <strong>Apply</strong>.
              </p>
              <SimpleBeforeAfterSlider
                beforeUrl={workingImage!}
                afterUrl={previewImage!}
                beforeLabel="Before (current)"
                afterLabel="After (preview)"
              />
            </div>
          ) : (
            <div style={{ marginBottom: '1rem' }}>
              <SelectionConfirmPreview
                workingImage={workingImage!}
                selection={selection!}
                onReselect={() => setSelection(null)}
              />
              {sidePanelRunsPreview ? (
                <p className="hint-text" style={{ marginBottom: '0.5rem' }}>
                  Selection ready. Use <strong>Add</strong> / <strong>Preview replace</strong> /{' '}
                  <strong>Preview removal</strong> in the <strong>options panel</strong> to generate a preview, then
                  click <strong>Apply</strong> below when it looks right.
                </p>
              ) : (
                <>
                  <p className="hint-text" style={{ marginBottom: '0.5rem' }}>
                    Selection ready. Generate preview to see the result.
                  </p>
                  <button
                    type="button"
                    className="button"
                    disabled={previewLoading}
                    style={{
                      background: '#0d9488',
                      borderColor: '#0f766e',
                      color: '#fff',
                    }}
                    onClick={() => void runRoomEditorPreview()}
                  >
                    {previewLoading ? 'Generating…' : 'Generate preview'}
                  </button>
                </>
              )}
            </div>
          )}
          {previewError && (
            <p style={{ color: '#dc2626', fontSize: '0.85rem', margin: '0.5rem 0 0' }}>{previewError}</p>
          )}
          {hasPreview && (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button
                type="button"
                className="button"
                disabled={previewLoading}
                style={{ background: '#0d9488', borderColor: '#0f766e', color: '#fff' }}
                onClick={handleApply}
              >
                Apply
              </button>
              <button type="button" className="button button-secondary" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
