'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * BeforeAfterSlider – side-by-side comparison with a draggable vertical slider.
 * Left of slider = before (original layout), right of slider = after (generated).
 */
interface BeforeAfterSliderProps {
  beforeImageUrl: string
  afterImageUrl: string
  beforeLabel?: string
  afterLabel?: string
}

export default function BeforeAfterSlider({
  beforeImageUrl,
  afterImageUrl,
  beforeLabel = 'Before',
  afterLabel = 'After',
}: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(50) // 0 = all before, 100 = all after
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMove = useCallback(
    (clientX: number) => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const x = clientX - rect.left
      const pct = Math.min(100, Math.max(0, (x / rect.width) * 100))
      setPosition(pct)
    },
    []
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsDragging(true)
      handleMove(e.clientX)
    },
    [handleMove]
  )

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      setIsDragging(true)
      if (e.touches[0]) handleMove(e.touches[0].clientX)
    },
    [handleMove]
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches[0]) handleMove(e.touches[0].clientX)
    },
    [handleMove]
  )

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

  useEffect(() => {
    if (!isDragging) return
    const onTouchEnd = () => setIsDragging(false)
    window.addEventListener('touchend', onTouchEnd)
    return () => window.removeEventListener('touchend', onTouchEnd)
  }, [isDragging])

  return (
    <div className="before-after-slider">
      <div className="before-after-labels">
        <span className="before-after-label before-label">{beforeLabel}</span>
        <span className="before-after-label after-label">{afterLabel}</span>
      </div>
      <div
        ref={containerRef}
        className="before-after-container"
        onMouseLeave={() => isDragging && setIsDragging(false)}
      >
        {/* Before image (full, behind) */}
        <div className="before-after-layer before-layer">
          <img src={beforeImageUrl} alt="Before configuration" />
        </div>
        {/* After image (clipped from position to 100%) */}
        <div
          className="before-after-layer after-layer"
          style={{
            clipPath: `inset(0 0 0 ${position}%)`,
            WebkitClipPath: `inset(0 0 0 ${position}%)`,
          }}
        >
          <img src={afterImageUrl} alt="After configuration" />
        </div>
        {/* Draggable handle */}
        <div
          className="before-after-handle"
          style={{ left: `${position}%` }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(position)}
          aria-label="Compare before and after"
        >
          <div className="before-after-handle-line" />
          <div className="before-after-handle-grip">
            <span className="before-after-handle-arrows">‹ ›</span>
          </div>
        </div>
      </div>
      <p className="before-after-hint">Drag the slider to compare before and after</p>
    </div>
  )
}
