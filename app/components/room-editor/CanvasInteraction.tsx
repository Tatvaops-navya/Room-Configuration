'use client'

import { useRef, useState, useCallback } from 'react'
import { useRoomEditorStore } from '@/app/lib/room-editor/roomEditorStore'
import type { BoundingBox, EditorMode } from '@/app/lib/room-editor/types'
import { createMaskFromBoundingBox } from '@/app/lib/room-editor/maskUtils'
import { extractFromRegion } from '@/app/lib/room-editor/extractionApi'

const CURSOR_BY_MODE: Record<EditorMode, string> = {
  idle: 'default',
  edit: 'default',
  add: 'crosshair',
  replace: 'crosshair',
  erase: 'crosshair',
}

const CURSOR_LABEL: Record<EditorMode, string> = {
  idle: '',
  edit: '',
  add: 'Drag to place object',
  replace: 'Drag around object',
  erase: 'Drag to remove area',
}

interface CanvasInteractionProps {
  imageSrc: string
  onSelectionComplete?: (box: BoundingBox, maskDataUrl: string) => void
  className?: string
  /** Full-width layout like Generating state: image uses 100% width, height auto */
  fullWidth?: boolean
}

/**
 * Area selection by drawing a rectangle on the image (normalized bbox → mask).
 */
export default function CanvasInteraction({
  imageSrc,
  onSelectionComplete,
  className = '',
  fullWidth = false,
}: CanvasInteractionProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [start, setStart] = useState<{ x: number; y: number } | null>(null)
  const [current, setCurrent] = useState<{ x: number; y: number } | null>(null)

  const mode = useRoomEditorStore((s) => s.mode)
  const selection = useRoomEditorStore((s) => s.selection)
  const setSelection = useRoomEditorStore((s) => s.setSelection)
  const previewImage = useRoomEditorStore((s) => s.previewImage)

  const getImageDisplayRect = useCallback((): { left: number; top: number; width: number; height: number } | null => {
    const cont = containerRef.current
    const img = imgRef.current
    if (!cont || !img || !img.naturalWidth || !img.naturalHeight) return null
    const cr = cont.getBoundingClientRect()
    const iw = img.naturalWidth
    const ih = img.naturalHeight
    const ar = iw / ih
    let w = cr.width
    let h = cr.height
    if (cr.width / cr.height > ar) {
      w = cr.height * ar
    } else {
      h = cr.width / ar
    }
    const x = cr.left + (cr.width - w) / 2
    const y = cr.top + (cr.height - h) / 2
    return { left: x, top: y, width: w, height: h }
  }, [])

  const clientToNormalized = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      const r = getImageDisplayRect()
      if (!r) return null
      let x = (clientX - r.left) / r.width
      let y = (clientY - r.top) / r.height
      return {
        x: Math.max(0, Math.min(1, x)),
        y: Math.max(0, Math.min(1, y)),
      }
    },
    [getImageDisplayRect]
  )

  const commitRectangle = useCallback(async () => {
    const s = start
    const c = current
    if (!s || !c || !imageSrc) {
      setIsDrawing(false)
      setStart(null)
      setCurrent(null)
      return
    }
    const x = Math.min(s.x, c.x)
    const y = Math.min(s.y, c.y)
    const width = Math.max(0.02, Math.abs(c.x - s.x))
    const height = Math.max(0.02, Math.abs(c.y - s.y))
    const boundingBox: BoundingBox = { x, y, width, height }

    const modeAtCommit = useRoomEditorStore.getState().mode
    const img = imgRef.current
    const imageWidth = img?.naturalWidth ?? 0
    const imageHeight = img?.naturalHeight ?? 0

    if (modeAtCommit === 'replace' && imageWidth > 0 && imageHeight > 0) {
      try {
        const regionPx = {
          x: Math.max(0, Math.round(x * imageWidth)),
          y: Math.max(0, Math.round(y * imageHeight)),
          width: Math.max(1, Math.round(width * imageWidth)),
          height: Math.max(1, Math.round(height * imageHeight)),
        }
        const extracted = await extractFromRegion(imageSrc, regionPx, imageWidth, imageHeight)
        setSelection({
          type: 'object',
          boundingBox: extracted.boundingBox,
          maskDataUrl: extracted.maskDataUrl,
          cutoutDataUrl: extracted.cutoutDataUrl,
          regionPx: extracted.regionPx,
        })
        onSelectionComplete?.(extracted.boundingBox, extracted.maskDataUrl)
      } catch {
        const maskDataUrl = await createMaskFromBoundingBox(imageSrc, boundingBox)
        if (maskDataUrl) {
          setSelection({
            type: 'area',
            boundingBox,
            maskDataUrl,
          })
          onSelectionComplete?.(boundingBox, maskDataUrl)
        }
      }
    } else {
      // Keep Add mask behavior aligned with Edit/Replace placement quality:
      // use a direct box mask (no add-only auto feather).
      const maskDataUrl = await createMaskFromBoundingBox(imageSrc, boundingBox)
      if (maskDataUrl) {
        setSelection({
          type: 'area',
          boundingBox,
          maskDataUrl,
        })
        onSelectionComplete?.(boundingBox, maskDataUrl)
      }
    }

    setIsDrawing(false)
    setStart(null)
    setCurrent(null)
  }, [start, current, imageSrc, setSelection, onSelectionComplete])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (mode === 'idle' || mode === 'edit') return
      const pt = clientToNormalized(e.clientX, e.clientY)
      if (!pt) return
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      setIsDrawing(true)
      setStart(pt)
      setCurrent(pt)
    },
    [mode, clientToNormalized]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawing || !start) return
      const pt = clientToNormalized(e.clientX, e.clientY)
      if (pt) setCurrent(pt)
    },
    [isDrawing, start, clientToNormalized]
  )

  const handlePointerUp = useCallback(() => {
    if (isDrawing) commitRectangle()
  }, [isDrawing, commitRectangle])

  const handleClickOutside = useCallback(
    (e: React.MouseEvent) => {
      const rect = getImageDisplayRect()
      if (!rect) return
      const { clientX, clientY } = e
      if (
        clientX < rect.left ||
        clientX > rect.left + rect.width ||
        clientY < rect.top ||
        clientY > rect.top + rect.height
      ) {
        setSelection(null)
      }
    },
    [getImageDisplayRect, setSelection]
  )

  const displayRect = selection?.boundingBox
  const isActive = mode !== 'idle'
  const addPlacementHighlight = mode === 'add' && Boolean(previewImage) && Boolean(displayRect)

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        cursor: CURSOR_BY_MODE[mode],
        userSelect: 'none',
        touchAction: 'none',
        width: '100%',
        ...(fullWidth ? { minHeight: 0 } : { height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }),
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => {
        if (isDrawing) commitRectangle()
      }}
      onClick={handleClickOutside}
    >
      {isActive && CURSOR_LABEL[mode] && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.7)',
            color: '#fff',
            padding: '4px 12px',
            borderRadius: 8,
            fontSize: '0.8rem',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          {CURSOR_LABEL[mode]}
        </div>
      )}
      <div
        style={{
          position: 'relative',
          width: '100%',
          ...(fullWidth ? {} : { height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }),
        }}
      >
        {/* Wrapper matches rendered image size so selection % aligns with letterboxed `object-fit: contain` layouts */}
        <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', maxHeight: fullWidth ? 'none' : '100%' }}>
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Room"
            style={{
              display: 'block',
              width: fullWidth ? '100%' : 'auto',
              height: fullWidth ? 'auto' : 'auto',
              maxWidth: '100%',
              maxHeight: fullWidth ? 'none' : '100%',
              objectFit: 'contain',
              borderRadius: 8,
              pointerEvents: isActive ? 'none' : 'auto',
            }}
          />
          {selection && displayRect && (
            <div
              style={{
                position: 'absolute',
                left: `${displayRect.x * 100}%`,
                top: `${displayRect.y * 100}%`,
                width: `${displayRect.width * 100}%`,
                height: `${displayRect.height * 100}%`,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.25)',
                borderRadius: 4,
                pointerEvents: 'none',
                boxSizing: 'border-box',
              }}
            />
          )}
          {displayRect && (
            <div
              className={addPlacementHighlight ? 'room-editor-add-placement-preview' : undefined}
              style={{
                position: 'absolute',
                left: `${displayRect.x * 100}%`,
                top: `${displayRect.y * 100}%`,
                width: `${displayRect.width * 100}%`,
                height: `${displayRect.height * 100}%`,
                border: mode === 'erase'
                  ? '3px solid rgba(239, 68, 68, 0.9)'
                  : addPlacementHighlight
                    ? '3px solid rgba(217, 119, 6, 0.95)'
                    : '3px solid rgba(59, 130, 246, 0.9)',
                boxShadow:
                  mode === 'erase'
                    ? '0 0 12px rgba(239, 68, 68, 0.6)'
                    : addPlacementHighlight
                      ? undefined
                      : '0 0 12px rgba(59, 130, 246, 0.6)',
                borderRadius: 4,
                pointerEvents: 'none',
                boxSizing: 'border-box',
              }}
            />
          )}
          {isDrawing && start && current && (
            <div
              style={{
                position: 'absolute',
                left: `${Math.min(start.x, current.x) * 100}%`,
                top: `${Math.min(start.y, current.y) * 100}%`,
                width: `${Math.max(0.02, Math.abs(current.x - start.x)) * 100}%`,
                height: `${Math.max(0.02, Math.abs(current.y - start.y)) * 100}%`,
                border: '2px dashed rgba(59, 130, 246, 0.8)',
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: 4,
                pointerEvents: 'none',
                boxSizing: 'border-box',
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
