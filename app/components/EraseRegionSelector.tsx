'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

/** Normalized rectangle (0–1) relative to image dimensions. */
export type EraseRegion = { x: number; y: number; width: number; height: number }

interface EraseRegionSelectorProps {
  /** Image URL (data URL or http) to display and draw selection on. */
  imageSrc: string
  /** Current selection in normalized coords (0–1). Null when nothing selected. */
  value: EraseRegion | null
  /** Called when user finishes drawing a new region or clears. */
  onChange: (region: EraseRegion | null) => void
  /** When true, only show existing selection overlay; no drawing. */
  disabled?: boolean
  /** Optional class for the wrapper. */
  className?: string
}

/**
 * Lets the user select a region on the image by click-and-drag (rectangle).
 * Uses Pointer Events + setPointerCapture so mouse, touch, and pen all work.
 * Selected area is shown with a purple overlay.
 * Output is in normalized coordinates (0–1) for resolution-independent use.
 */
export default function EraseRegionSelector({
  imageSrc,
  value,
  onChange,
  disabled = false,
  className = '',
}: EraseRegionSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [start, setStart] = useState<{ x: number; y: number } | null>(null)
  const [current, setCurrent] = useState<{ x: number; y: number } | null>(null)
  const activePointerId = useRef<number | null>(null)
  /** Refs mirror drawing state so pointerup always sees latest (avoids stale closures). */
  const startRef = useRef<{ x: number; y: number } | null>(null)
  const currentRef = useRef<{ x: number; y: number } | null>(null)

  /**
   * Get the *actual rendered* image rectangle on screen.
   *
   * Important: selection coordinates must be computed from the same rect the user sees.
   * Recomputing a "contain" rect from the container can drift (e.g. when the <img> is
   * width:100% + height:auto, responsive layouts, fractional pixels, etc.).
   */
  const getImageDisplayRect = useCallback((): { left: number; top: number; width: number; height: number } | null => {
    const img = imgRef.current
    if (!img || !img.naturalWidth || !img.naturalHeight) return null
    const ir = img.getBoundingClientRect()
    if (ir.width <= 0 || ir.height <= 0) return null
    return { left: ir.left, top: ir.top, width: ir.width, height: ir.height }
  }, [])

  /** Convert client coords to normalized 0–1 in image. */
  const clientToNormalized = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      const r = getImageDisplayRect()
      if (!r) return null
      let x = (clientX - r.left) / r.width
      let y = (clientY - r.top) / r.height
      x = Math.max(0, Math.min(1, x))
      y = Math.max(0, Math.min(1, y))
      return { x, y }
    },
    [getImageDisplayRect]
  )

  const resetDrawing = useCallback(() => {
    setIsDrawing(false)
    setStart(null)
    setCurrent(null)
    startRef.current = null
    currentRef.current = null
    activePointerId.current = null
  }, [])

  const commitRectangle = useCallback(() => {
    const s = startRef.current
    const c = currentRef.current
    if (!s || !c) {
      resetDrawing()
      return
    }
    const x = Math.min(s.x, c.x)
    const y = Math.min(s.y, c.y)
    const width = Math.abs(c.x - s.x)
    const height = Math.abs(c.y - s.y)
    if (width < 0.02 || height < 0.02) {
      resetDrawing()
      return
    }
    onChange({ x, y, width, height })
    resetDrawing()
  }, [onChange, resetDrawing])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return
      if (e.button !== 0) return
      const n = clientToNormalized(e.clientX, e.clientY)
      if (!n) return
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      activePointerId.current = e.pointerId
      startRef.current = n
      currentRef.current = n
      setStart(n)
      setCurrent(n)
      setIsDrawing(true)
    },
    [disabled, clientToNormalized]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (activePointerId.current !== e.pointerId || !startRef.current) return
      e.preventDefault()
      const n = clientToNormalized(e.clientX, e.clientY)
      if (n) {
        currentRef.current = n
        setCurrent(n)
      }
    },
    [clientToNormalized]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (activePointerId.current !== e.pointerId) return
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        /* already released */
      }
      commitRectangle()
    },
    [commitRectangle]
  )

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (activePointerId.current === e.pointerId) {
        try {
          e.currentTarget.releasePointerCapture(e.pointerId)
        } catch {
          /* noop */
        }
      }
      resetDrawing()
    },
    [resetDrawing]
  )

  /** If the source image URL changes after mount, drop stale region (coords would be wrong). */
  const prevImageSrc = useRef<string | null>(null)
  useEffect(() => {
    if (prevImageSrc.current !== null && prevImageSrc.current !== imageSrc) {
      onChange(null)
      resetDrawing()
    }
    prevImageSrc.current = imageSrc
  }, [imageSrc, onChange, resetDrawing])

  /** Compute overlay rect in percentage for the purple box (relative to container). */
  const getOverlayStyle = (): React.CSSProperties | null => {
    const cont = containerRef.current
    const img = imgRef.current
    if (!cont || !img || !img.naturalWidth || !img.naturalHeight || !value) return null
    const r = getImageDisplayRect()
    if (!r || r.width <= 0 || r.height <= 0) return null
    const cr = cont.getBoundingClientRect()
    const leftPct = ((r.left - cr.left + value.x * r.width) / cr.width) * 100
    const topPct = ((r.top - cr.top + value.y * r.height) / cr.height) * 100
    const widthPct = (value.width * r.width / cr.width) * 100
    const heightPct = (value.height * r.height / cr.height) * 100
    return {
      position: 'absolute' as const,
      left: `${leftPct}%`,
      top: `${topPct}%`,
      width: `${widthPct}%`,
      height: `${heightPct}%`,
      /* Light fill so you can still see furniture/details under the box */
      backgroundColor: 'rgba(139, 92, 246, 0.14)',
      border: '2px dashed rgba(124, 58, 237, 0.9)',
      borderRadius: '6px',
      pointerEvents: 'none',
      boxSizing: 'border-box',
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.35)',
    }
  }

  /** During draw: show preview rect in container %. */
  const getPreviewStyle = (): React.CSSProperties | null => {
    if (!start || !current) return null
    const cont = containerRef.current
    const img = imgRef.current
    if (!cont || !img?.naturalWidth || !img.naturalHeight) return null
    const r = getImageDisplayRect()
    if (!r || r.width <= 0 || r.height <= 0) return null
    const cr = cont.getBoundingClientRect()
    const x = Math.min(start.x, current.x)
    const y = Math.min(start.y, current.y)
    const w = Math.abs(current.x - start.x)
    const h = Math.abs(current.y - start.y)
    const leftPct = ((r.left - cr.left + x * r.width) / cr.width) * 100
    const topPct = ((r.top - cr.top + y * r.height) / cr.height) * 100
    const widthPct = (w * r.width / cr.width) * 100
    const heightPct = (h * r.height / cr.height) * 100
    return {
      position: 'absolute' as const,
      left: `${leftPct}%`,
      top: `${topPct}%`,
      width: `${widthPct}%`,
      height: `${heightPct}%`,
      backgroundColor: 'rgba(139, 92, 246, 0.16)',
      border: '2px dashed rgba(124, 58, 237, 0.75)',
      borderRadius: '6px',
      pointerEvents: 'none',
      boxSizing: 'border-box',
    }
  }

  return (
    <div className={className} style={{ position: 'relative', width: '100%' }}>
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        style={{
          position: 'relative',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid var(--color-border, #e2e8f0)',
          background: '#000',
          cursor: disabled ? 'default' : 'crosshair',
          touchAction: 'none',
        }}
      >
        <img
          ref={imgRef}
          src={imageSrc}
          alt="Drag on this image to draw the area to erase"
          style={{ display: 'block', width: '100%', height: 'auto', objectFit: 'contain', verticalAlign: 'middle' }}
          draggable={false}
        />
        {value && !isDrawing && getOverlayStyle() && (
          <div style={getOverlayStyle()!} aria-hidden />
        )}
        {isDrawing && getPreviewStyle() && (
          <div style={getPreviewStyle()!} aria-hidden />
        )}
      </div>
      {value && (
        <div style={{ marginTop: '0.5rem' }}>
          <button
            type="button"
            className="button button-secondary"
            style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem' }}
            onClick={() => onChange(null)}
          >
            Clear selection
          </button>
        </div>
      )}
    </div>
  )
}
