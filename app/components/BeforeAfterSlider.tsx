'use client'

import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react'
import EraseRegionSelector, { type EraseRegion } from './EraseRegionSelector'

/**
 * BeforeAfterSlider – side-by-side comparison with a draggable vertical slider.
 * Left of slider = before (original layout), right of slider = after (generated).
 *
 * Optional `eraseOnResult`: one shared surface for region erase on the **after** image
 * (no duplicate copy of the result elsewhere). Tabs switch between comparison and erase tool.
 */
export type EraseOnResultProps = {
  value: EraseRegion | null
  onChange: (region: EraseRegion | null) => void
  /** When true (e.g. user chose Erase mode), open the erase tab automatically */
  preferEraseTab: boolean
}

interface BeforeAfterSliderProps {
  beforeImageUrl: string
  afterImageUrl: string
  beforeLabel?: string
  afterLabel?: string
  /** Region erase on the generated (after) image only — same pixels the API uses */
  eraseOnResult?: EraseOnResultProps | null
  /** Shown bottom-right over the draggable compare view only (hidden in erase tab). */
  compareOverlay?: ReactNode
  /** Full-width bar directly above the compare image (e.g. Regenerate, Share, Download). */
  compareTopBar?: ReactNode
}

type ResultView = 'compare' | 'erase'

export default function BeforeAfterSlider({
  beforeImageUrl,
  afterImageUrl,
  beforeLabel = 'Before',
  afterLabel = 'After',
  eraseOnResult = null,
  compareOverlay,
  compareTopBar,
}: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerAspectRatio, setContainerAspectRatio] = useState<string | null>(null)
  const [eraseAspectRatio, setEraseAspectRatio] = useState<string | null>(null)
  const [resultView, setResultView] = useState<ResultView>('compare')

  const hasErase = Boolean(eraseOnResult)
  const preferEraseTab = eraseOnResult?.preferEraseTab ?? false
  /** Tracks last preferEraseTab so we only auto-open erase on false→true (user chose Erase), not on every render/remount while erase stays selected */
  const prevPreferEraseTabRef = useRef(preferEraseTab)

  // Reset slider position when images change
  useEffect(() => {
    setPosition(50)
  }, [beforeImageUrl, afterImageUrl])

  // New before/after pair (e.g. picked another history version): always start on Before / after
  useEffect(() => {
    setResultView('compare')
  }, [beforeImageUrl, afterImageUrl])

  // Aspect for comparison view: use max(before, after) width/height ratio so BOTH images fit
  // with object-fit:contain in the same box — avoids the “after looks zoomed” effect when v2
  // has a different aspect ratio than v1 and the frame was sized only from “before”.
  useEffect(() => {
    setContainerAspectRatio(null)
    if (!beforeImageUrl || resultView === 'erase') return
    let cancelled = false
    const dims = (src: string) =>
      new Promise<{ w: number; h: number } | null>((resolve) => {
        const im = new Image()
        im.onload = () => {
          const w = im.naturalWidth
          const h = im.naturalHeight
          resolve(w > 0 && h > 0 ? { w, h } : null)
        }
        im.onerror = () => resolve(null)
        im.src = src
      })
    if (!afterImageUrl) {
      void dims(beforeImageUrl).then((a) => {
        if (!cancelled && a) setContainerAspectRatio(`${a.w} / ${a.h}`)
      })
      return () => {
        cancelled = true
      }
    }
    void Promise.all([dims(beforeImageUrl), dims(afterImageUrl)]).then(([a, b]) => {
      if (cancelled) return
      if (a && b) {
        const rBefore = a.w / a.h
        const rAfter = b.w / b.h
        const r = Math.max(rBefore, rAfter)
        setContainerAspectRatio(`${r} / 1`)
        return
      }
      if (a) setContainerAspectRatio(`${a.w} / ${a.h}`)
      else if (b) setContainerAspectRatio(`${b.w} / ${b.h}`)
    })
    return () => {
      cancelled = true
    }
  }, [beforeImageUrl, afterImageUrl, resultView])

  // Aspect for erase view (match after image — same as inpaint source)
  useEffect(() => {
    setEraseAspectRatio(null)
    if (!afterImageUrl || resultView !== 'erase') return
    const img = new Image()
    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        setEraseAspectRatio(`${img.naturalWidth} / ${img.naturalHeight}`)
      }
    }
    img.onerror = () => setEraseAspectRatio(null)
    img.src = afterImageUrl
  }, [afterImageUrl, resultView])

  // Open erase tab only when user switches to Erase in the customization bar (rising edge), not while erase stays selected across history/version changes
  useEffect(() => {
    if (!hasErase) return
    const prev = prevPreferEraseTabRef.current
    if (preferEraseTab && !prev) {
      setResultView('erase')
    } else if (!preferEraseTab && prev) {
      setResultView('compare')
    }
    prevPreferEraseTabRef.current = preferEraseTab
  }, [hasErase, preferEraseTab])

  const handleMove = useCallback((clientX: number) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = clientX - rect.left
    const pct = Math.min(100, Math.max(0, (x / rect.width) * 100))
    setPosition(pct)
  }, [])

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
      {hasErase && (
        <div
          className="before-after-view-tabs"
          role="tablist"
          aria-label="Result view"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginBottom: '0.75rem',
          }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={resultView === 'compare'}
            className={`button button-secondary selection-highlight ${resultView === 'compare' ? 'before-after-tab-active is-selected' : ''}`}
            style={{
              padding: '0.35rem 0.85rem',
              fontSize: '0.85rem',
              fontWeight: resultView === 'compare' ? 700 : 500,
              borderColor: resultView === 'compare' ? 'var(--color-primary, #0d9488)' : undefined,
              background: resultView === 'compare' ? 'rgba(13, 148, 136, 0.12)' : undefined,
            }}
            onClick={() => setResultView('compare')}
          >
            Before / after
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={resultView === 'erase'}
            className={`button button-secondary selection-highlight ${resultView === 'erase' ? 'before-after-tab-active is-selected' : ''}`}
            style={{
              padding: '0.35rem 0.85rem',
              fontSize: '0.85rem',
              fontWeight: resultView === 'erase' ? 700 : 500,
              borderColor: resultView === 'erase' ? 'var(--color-primary, #0d9488)' : undefined,
              background: resultView === 'erase' ? 'rgba(13, 148, 136, 0.12)' : undefined,
            }}
            onClick={() => setResultView('erase')}
          >
            Erase on this result
          </button>
        </div>
      )}

      <div className="before-after-labels">
        <span className="before-after-label before-label">
          {resultView === 'erase' ? 'Your result (erase here)' : beforeLabel}
        </span>
        <span className="before-after-label after-label">
          {resultView === 'erase' ? 'Same image — draw a purple box' : afterLabel}
        </span>
      </div>

      {resultView === 'erase' && eraseOnResult ? (
        <div
          className="before-after-container before-after-erase-wrap"
          style={eraseAspectRatio ? { aspectRatio: eraseAspectRatio } : undefined}
        >
          <EraseRegionSelector
            imageSrc={afterImageUrl}
            value={eraseOnResult.value}
            onChange={eraseOnResult.onChange}
          />
        </div>
      ) : (
        <>
          {compareTopBar ? (
            <div
              style={{
                borderRadius: 12,
                overflow: 'hidden',
                border: '1px solid var(--color-border, #e2e8f0)',
                width: '100%',
              }}
            >
              {compareTopBar}
              <div style={{ position: 'relative', width: '100%' }}>
                <div
                  ref={containerRef}
                  className="before-after-container"
                  style={{
                    ...(containerAspectRatio ? { aspectRatio: containerAspectRatio } : {}),
                    borderRadius: 0,
                    border: 'none',
                  }}
                  onMouseLeave={() => isDragging && setIsDragging(false)}
                >
                  <div className="before-after-layer before-layer">
                    <img key={beforeImageUrl} src={beforeImageUrl} alt="Before configuration" />
                  </div>
                  <div
                    key={afterImageUrl ? `after-${afterImageUrl.length}-${afterImageUrl.slice(-24)}` : 'after-none'}
                    className="before-after-layer after-layer"
                    style={{
                      clipPath: `inset(0 0 0 ${position}%)`,
                      WebkitClipPath: `inset(0 0 0 ${position}%)`,
                    }}
                  >
                    <img src={afterImageUrl} alt="After configuration" />
                  </div>
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
                {compareOverlay ? (
                  <div
                    className="before-after-compare-overlay"
                    style={{
                      position: 'absolute',
                      bottom: 10,
                      right: 10,
                      zIndex: 25,
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 8,
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      padding: '8px 10px',
                      borderRadius: 12,
                      background: 'rgba(15, 23, 42, 0.78)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.14)',
                      maxWidth: 'calc(100% - 20px)',
                      pointerEvents: 'auto',
                    }}
                  >
                    {compareOverlay}
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div style={{ position: 'relative', width: '100%' }}>
              <div
                ref={containerRef}
                className="before-after-container"
                style={containerAspectRatio ? { aspectRatio: containerAspectRatio } : undefined}
                onMouseLeave={() => isDragging && setIsDragging(false)}
              >
                <div className="before-after-layer before-layer">
                  <img key={beforeImageUrl} src={beforeImageUrl} alt="Before configuration" />
                </div>
                <div
                  key={afterImageUrl ? `after-${afterImageUrl.length}-${afterImageUrl.slice(-24)}` : 'after-none'}
                  className="before-after-layer after-layer"
                  style={{
                    clipPath: `inset(0 0 0 ${position}%)`,
                    WebkitClipPath: `inset(0 0 0 ${position}%)`,
                  }}
                >
                  <img src={afterImageUrl} alt="After configuration" />
                </div>
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
              {compareOverlay ? (
                <div
                  className="before-after-compare-overlay"
                  style={{
                    position: 'absolute',
                    bottom: 10,
                    right: 10,
                    zIndex: 25,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    padding: '8px 10px',
                    borderRadius: 12,
                    background: 'rgba(15, 23, 42, 0.78)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.14)',
                    maxWidth: 'calc(100% - 20px)',
                    pointerEvents: 'auto',
                  }}
                >
                  {compareOverlay}
                </div>
              ) : null}
            </div>
          )}
        </>
      )}

    </div>
  )
}
