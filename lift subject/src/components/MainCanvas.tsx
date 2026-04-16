import { useCallback, useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { extractComponentAtPoint } from '../lib/canvasUtils'
import { isGroundingDinoConfigured } from '../lib/groundingDinoApi'
import { addToast } from './ToastContainer'

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export function MainCanvas() {
  const { state, dispatch } = useApp()
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [scale, setScale] = useState(1)
  const image = state.image
  const components = state.components
  const activeIds = state.selection.activeComponentIds
  const isExtracting = state.editing.isExtracting
  useEffect(() => {
    if (!containerRef.current || !image.width || !image.height) return
    const el = containerRef.current
    const r = el.getBoundingClientRect()
    const sx = r.width / image.width
    const sy = r.height / image.height
    const s = Math.min(sx, sy, 1.5)
    setScale(s)
  }, [image.width, image.height])

  // Composite main room image: original + each component's current cutout at its region
  useEffect(() => {
    if (!image.originalDataUrl || !image.width || !image.height || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let cancelled = false
    ;(async () => {
      try {
        const baseImg = await loadImage(image.originalDataUrl)
        if (cancelled) return
        canvas.width = image.width
        canvas.height = image.height
        ctx.drawImage(baseImg, 0, 0)
        const withCutout = components.filter((c) => c.cutoutDataUrl)
        for (const comp of withCutout) {
          if (!comp.cutoutDataUrl) continue
          const cutoutImg = await loadImage(comp.cutoutDataUrl)
          if (cancelled) return
          const { x, y, width, height } = comp.region
          ctx.drawImage(cutoutImg, 0, 0, cutoutImg.naturalWidth, cutoutImg.naturalHeight, x, y, width, height)
        }
      } catch {
        if (!cancelled && canvasRef.current) {
          const baseImg = await loadImage(image.originalDataUrl)
          canvas.width = image.width
          canvas.height = image.height
          canvas.getContext('2d')?.drawImage(baseImg, 0, 0)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [image.originalDataUrl, image.width, image.height, components])

  const onImageClick = useCallback(
    async (e: React.MouseEvent<HTMLDivElement>) => {
      if (!image.originalDataUrl || isExtracting) return
      const target = e.currentTarget
      const rect = target.getBoundingClientRect()
      const displayX = e.clientX - rect.left
      const displayY = e.clientY - rect.top
      const imageX = displayX / scale
      const imageY = displayY / scale

      dispatch({
        type: 'SET_EDITING',
        payload: { isExtracting: true, currentOperation: 'Extracting component...', progress: 0 },
      })
      try {
        const result = await extractComponentAtPoint(
          image.originalDataUrl,
          imageX,
          imageY,
          image.width,
          image.height,
          state.editing.detectionPrompt || undefined
        )
        dispatch({
          type: 'ADD_EXTRACTED_COMPONENT',
          payload: {
            cutoutDataUrl: result.dataUrl,
            region: result.region,
            maskDataUrl: result.maskDataUrl,
          },
        })
        addToast('Component extracted — view in panel', 'success')
      } catch (err) {
        dispatch({ type: 'SET_EDITING', payload: { isExtracting: false, progress: 0 } })
        addToast('Extraction failed. Try clicking on a distinct object.', 'error')
      }
    },
    [image.originalDataUrl, image.width, image.height, scale, isExtracting, dispatch, state.editing.detectionPrompt]
  )

  const detectionPrompt = state.editing.detectionPrompt ?? ''
  const showDinoPrompt = isGroundingDinoConfigured()

  if (!image.source) return null

  return (
    <div className="flex flex-col h-full min-h-0">
      {showDinoPrompt && (
        <div className="px-4 py-2 flex items-center gap-2 bg-[var(--neutral-100)] border-b border-[var(--neutral-200)]">
          <label htmlFor="detection-prompt" className="text-xs font-medium text-[var(--neutral-700)] whitespace-nowrap">
            Detect as:
          </label>
          <select
            id="detection-prompt"
            value={detectionPrompt}
            onChange={(e) =>
              dispatch({
                type: 'SET_EDITING',
                payload: { detectionPrompt: e.target.value },
              })
            }
            className="text-sm rounded-[var(--radius-sm)] border border-[var(--neutral-300)] bg-white px-2 py-1.5 text-[var(--neutral-800)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          >
            <option value="">All furniture (sofa, chair, table…)</option>
            <option value="sofa">Sofa</option>
            <option value="chair">Chair</option>
            <option value="table">Table</option>
            <option value="lamp">Lamp</option>
            <option value="door">Door</option>
            <option value="window">Window</option>
          </select>
        </div>
      )}
      {isExtracting && (
        <div className="px-5 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white text-sm font-medium flex items-center justify-between rounded-none shadow-sm">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            {state.editing.currentOperation || 'Extracting...'}
          </span>
          <span className="font-mono text-white/90">Please wait</span>
        </div>
      )}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto flex items-center justify-center p-4 md:p-6 bg-[var(--neutral-100)]"
      >
        <div
          ref={imageRef}
          className="relative inline-block rounded-[var(--radius-md)] overflow-hidden shadow-[var(--shadow-card)] cursor-crosshair"
          style={{
            width: image.width * scale,
            height: image.height * scale,
          }}
          onClick={onImageClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLDivElement).click()}
          aria-label="Click on any object (sofa, chair, lamp, etc.) to extract it"
        >
          {/* Composited room image: original + each component's current cutout (preset/AI applied) */}
          <div className="absolute inset-0 rounded-[var(--radius-md)] overflow-hidden pointer-events-none">
            <canvas
              ref={canvasRef}
              width={image.width}
              height={image.height}
              className="w-full h-full object-contain block"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              aria-label="Room image with applied component styles"
            />
          </div>

          {/* Subtle selection indicator: soft glow + thin border (no solid blue box) */}
          {activeIds.length > 0 &&
            components
              .filter((c) => activeIds.includes(c.id))
              .map((comp) => {
                const left = comp.region.x * scale
                const top = comp.region.y * scale
                const width = comp.region.width * scale
                const height = comp.region.height * scale
                return (
                  <div
                    key={comp.id}
                    className="absolute pointer-events-none rounded-lg border-2 border-[var(--primary)]/50 selection-glow"
                    style={{
                      left,
                      top,
                      width,
                      height,
                      zIndex: 10,
                      boxShadow: '0 0 0 1px rgba(255,255,255,0.6), 0 0 24px rgba(37,99,235,0.2)',
                    }}
                    aria-hidden
                  />
                )
              })}
        </div>
      </div>
    </div>
  )
}
