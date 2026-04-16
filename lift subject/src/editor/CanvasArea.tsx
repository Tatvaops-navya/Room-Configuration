import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import {
  extractComponentFromRegion,
  extractComponentAtPointClick,
  cropToDataUrl,
  compositeComponentsOntoImage,
  detectHoverComponents,
} from '../lib/canvasUtils'
import { addToast } from '../components/ToastContainer'
import { isSamConfigured } from '../lib/samApi'
import { isGroundingDinoConfigured } from '../lib/groundingDinoApi'
import type { Region } from '../types'

const MIN_SELECTION_SIZE = 80
const HOVER_THROTTLE_MS = 100

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export function CanvasArea() {
  const { state, dispatch, interactionMode } = useApp()
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null)
  const [hoverComponentId, setHoverComponentId] = useState<string | null>(null)
  const hoverThrottleRef = useRef<number | null>(null)
  const lastCoordsRef = useRef<{ x: number; y: number } | null>(null)
  const lastHoverRunRef = useRef(0)
  const clickDownRef = useRef<{ x: number; y: number } | null>(null)
  const hoverDetectionRunForRef = useRef<string | null>(null)
  const image = state.image
  const components = state.components
  const hoverDetected = state.hoverDetected
  const activeIds = state.selection.activeComponentIds
  const isExtracting = state.editing.isExtracting
  const hasSelection = activeIds.length > 0
  const isBusy = isExtracting

  const dragRegion = useMemo<Region | null>(() => {
    if (!dragStart || !dragCurrent) return null
    const x = Math.min(dragStart.x, dragCurrent.x)
    const y = Math.min(dragStart.y, dragCurrent.y)
    const width = Math.abs(dragStart.x - dragCurrent.x)
    const height = Math.abs(dragStart.y - dragCurrent.y)
    return { x, y, width, height }
  }, [dragStart, dragCurrent])

  useEffect(() => {
    setDragStart(null)
    setDragCurrent(null)
  }, [activeIds.length, activeIds[0]])

  useEffect(() => {
    setHoverComponentId(null)
  }, [interactionMode])

  useEffect(() => {
    if (interactionMode !== 'hover') hoverDetectionRunForRef.current = null
  }, [interactionMode])

  useEffect(() => {
    if (!image.originalDataUrl) hoverDetectionRunForRef.current = null
  }, [image.originalDataUrl])

  // Run hover detection once per image when entering hover mode (DINO + SAM). Not on every hover event.
  useEffect(() => {
    if (
      interactionMode !== 'hover' ||
      !image.originalDataUrl ||
      !image.width ||
      !image.height ||
      hoverDetectionRunForRef.current === image.originalDataUrl ||
      !isGroundingDinoConfigured() ||
      !isSamConfigured()
    ) {
      return
    }
    hoverDetectionRunForRef.current = image.originalDataUrl
    let cancelled = false
    dispatch({
      type: 'SET_EDITING',
      payload: { isExtracting: true, isProcessing: true, currentOperation: 'Detecting objects for hover...', progress: 0 },
    })
    detectHoverComponents(image.originalDataUrl, image.width, image.height)
      .then((list) => {
        if (!cancelled) {
          dispatch({ type: 'SET_HOVER_DETECTED', payload: list })
          if (list.length > 0 && import.meta.env?.DEV) {
            console.log('[hover] Detected', list.length, 'objects for hover')
          }
        }
      })
      .catch((e) => {
        if (!cancelled) {
          console.error('[hover] Detection failed', e)
          hoverDetectionRunForRef.current = null
          addToast('Hover detection failed. Check DINO and SAM config.', 'error')
        }
      })
      .finally(() => {
        if (!cancelled) {
          dispatch({
            type: 'SET_EDITING',
            payload: { isExtracting: false, isProcessing: false, currentOperation: '', progress: 100 },
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [interactionMode, image.originalDataUrl, image.width, image.height, dispatch])

  useEffect(() => {
    if (!containerRef.current || !image.width || !image.height) return
    const el = containerRef.current
    const r = el.getBoundingClientRect()
    const sx = r.width / image.width
    const sy = r.height / image.height
    setScale(Math.min(sx, sy, 1.5))
  }, [image.width, image.height])

  useEffect(() => {
    const original = image.originalDataUrl
    if (!original || !image.width || !image.height) return
    let cancelled = false
    if (components.length === 0) {
      dispatch({ type: 'SET_DISPLAY_IMAGE', payload: original })
      return
    }
    compositeComponentsOntoImage(
      original,
      image.width,
      image.height,
      components.map((c) => ({ cutoutDataUrl: c.cutoutDataUrl, maskDataUrl: c.maskDataUrl, region: c.region }))
    )
      .then((url) => {
        if (!cancelled) {
          dispatch({ type: 'SET_DISPLAY_IMAGE', payload: url })
          if (import.meta.env.DEV) {
            console.log('Scene state updated: composite applied, display image set')
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('CanvasArea: composite failed', err)
          dispatch({ type: 'SET_DISPLAY_IMAGE', payload: original })
        }
      })
    return () => {
      cancelled = true
    }
  }, [image.originalDataUrl, image.width, image.height, components, dispatch])

  const displayUrl = image.displayDataUrl ?? image.originalDataUrl
  useEffect(() => {
    if (!displayUrl || !image.width || !image.height || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let cancelled = false
    loadImage(displayUrl)
      .then((img) => {
        if (cancelled) return
        canvas.width = image.width
        canvas.height = image.height
        ctx.drawImage(img, 0, 0)
        if (import.meta.env.DEV) {
          console.log('Canvas redraw: main scene image updated')
        }
      })
      .catch((err) => {
        if (!cancelled) console.error('CanvasArea: failed to draw image', err)
      })
    return () => {
      cancelled = true
    }
  }, [displayUrl, image.width, image.height, image.displayDataUrl])

  const toImageCoords = useCallback(
    (clientX: number, clientY: number) => {
      if (!frameRef.current) return null
      const rect = frameRef.current.getBoundingClientRect()
      const displayX = clientX - rect.left
      const displayY = clientY - rect.top
      const imageX = Math.max(0, Math.min(displayX / scale, image.width))
      const imageY = Math.max(0, Math.min(displayY / scale, image.height))
      return { x: imageX, y: imageY }
    },
    [scale, image.width, image.height]
  )

  const findComponentAtPoint = useCallback(
    (ix: number, iy: number): typeof components[0] | null => {
      const under = components.filter(
        (c) =>
          ix >= c.region.x &&
          ix <= c.region.x + c.region.width &&
          iy >= c.region.y &&
          iy <= c.region.y + c.region.height
      )
      if (under.length === 0) return null
      under.sort((a, b) => (b.region.y + b.region.height) - (a.region.y + a.region.height))
      return under[0]
    },
    [components]
  )

  const findHoverDetectedAtPoint = useCallback(
    (ix: number, iy: number) => {
      const under = hoverDetected.filter(
        (h) =>
          ix >= h.boundingBox.x &&
          ix <= h.boundingBox.x + h.boundingBox.width &&
          iy >= h.boundingBox.y &&
          iy <= h.boundingBox.y + h.boundingBox.height
      )
      if (under.length === 0) return null
      under.sort((a, b) => (b.boundingBox.y + b.boundingBox.height) - (a.boundingBox.y + a.boundingBox.height))
      return under[0]
    },
    [hoverDetected]
  )

  const runClickExtract = useCallback(
    async (clickX: number, clickY: number) => {
      if (!image.originalDataUrl || !image.width || !image.height) return
      if (!isSamConfigured()) {
        return
      }
      dispatch({
        type: 'SET_EDITING',
        payload: { isExtracting: true, currentOperation: 'Extracting object...', progress: 0 },
      })
      try {
        const result = await extractComponentAtPointClick(
          image.originalDataUrl,
          clickX,
          clickY,
          image.width,
          image.height
        )
        dispatch({
          type: 'ADD_EXTRACTED_COMPONENT',
          payload: {
            cutoutDataUrl: result.dataUrl,
            region: result.region,
            maskDataUrl: result.maskDataUrl,
            name: undefined,
          },
        })
        addToast('Component selected', 'success')
      } catch (e) {
        console.error(e)
        addToast('Click extraction failed. Try again.', 'error')
      } finally {
        dispatch({ type: 'SET_EDITING', payload: { isExtracting: false, progress: 0 } })
      }
    },
    [dispatch, image.originalDataUrl, image.width, image.height]
  )

  const extractFromRegion = useCallback(
    async (
      region: Region,
      label?: string,
      seedPoint?: { x: number; y: number },
      extractionKind: 'segmented' | 'rectangular' = 'segmented'
    ) => {
      if (!image.originalDataUrl || !image.width || !image.height) return
      if (region.width < MIN_SELECTION_SIZE || region.height < MIN_SELECTION_SIZE) {
        addToast('Selection too small. Draw a bigger region (min 80×80 px).', 'info')
        return
      }
      dispatch({
        type: 'SET_EDITING',
        payload: { isExtracting: true, currentOperation: 'Extracting selected region...', progress: 0 },
      })
      try {
        const result =
          extractionKind === 'rectangular'
            ? {
                dataUrl: await cropToDataUrl(image.originalDataUrl, region),
                region,
                maskDataUrl: null,
              }
            : await extractComponentFromRegion(
                image.originalDataUrl,
                region,
                image.width,
                image.height,
                label,
                seedPoint
              )
        dispatch({
          type: 'ADD_EXTRACTED_COMPONENT',
          payload: {
            cutoutDataUrl: result.dataUrl,
            region: result.region,
            maskDataUrl: result.maskDataUrl ?? undefined,
            name: label ? `Detected: ${label}` : undefined,
          },
        })
        addToast('Component selected', 'success')
      } catch {
        dispatch({ type: 'SET_EDITING', payload: { isExtracting: false, progress: 0 } })
        addToast('Region extraction failed. Try again.', 'error')
      }
    },
    [dispatch, image.originalDataUrl, image.width, image.height]
  )

  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isBusy) return
      const coords = toImageCoords(e.clientX, e.clientY)
      if (!coords) return
      if (interactionMode === 'rectangle') {
        setDragStart(coords)
        setDragCurrent(coords)
      } else if (interactionMode === 'click') {
        clickDownRef.current = coords
      }
    },
    [isBusy, toImageCoords, interactionMode]
  )

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const coords = toImageCoords(e.clientX, e.clientY)
      if (!coords) return
      if (interactionMode === 'rectangle' && dragStart) {
        setDragCurrent(coords)
        return
      }
      if (interactionMode === 'hover') {
        lastCoordsRef.current = coords
        const now = Date.now()
        const runCheck = (cx: number, cy: number) => {
          const hoverComp = hoverDetected.length > 0 ? findHoverDetectedAtPoint(cx, cy) : null
          const existingComp = hoverDetected.length === 0 ? findComponentAtPoint(cx, cy) : null
          setHoverComponentId(hoverComp?.id ?? existingComp?.id ?? null)
        }
        if (now - lastHoverRunRef.current < HOVER_THROTTLE_MS) {
          if (hoverThrottleRef.current == null) {
            hoverThrottleRef.current = window.setTimeout(() => {
              hoverThrottleRef.current = null
              lastHoverRunRef.current = Date.now()
              const c = lastCoordsRef.current
              if (c) runCheck(c.x, c.y)
            }, HOVER_THROTTLE_MS)
          }
          return
        }
        lastHoverRunRef.current = now
        runCheck(coords.x, coords.y)
      }
    },
    [interactionMode, dragStart, toImageCoords, findComponentAtPoint, findHoverDetectedAtPoint, hoverDetected.length]
  )

  const onMouseUp = useCallback(
    async (e?: React.MouseEvent<HTMLDivElement>) => {
      if (interactionMode === 'rectangle') {
        if (!dragRegion) return
        const region = dragRegion
        const seedPoint = dragStart ?? undefined
        setDragStart(null)
        setDragCurrent(null)
        await extractFromRegion(region, 'Screenshot selection', seedPoint, 'rectangular')
        return
      }
      if (interactionMode === 'click' && clickDownRef.current) {
        const upCoords = e ? toImageCoords(e.clientX, e.clientY) : null
        const down = clickDownRef.current
        const dist = upCoords
          ? Math.hypot(upCoords.x - down.x, upCoords.y - down.y)
          : 0
        clickDownRef.current = null
        if (!upCoords || dist < 12) {
          await runClickExtract(down.x, down.y)
        }
        return
      }
      if (interactionMode === 'hover' && hoverComponentId) {
        const hoverComp = hoverDetected.find((h) => h.id === hoverComponentId)
        if (hoverComp && image.originalDataUrl && image.width && image.height) {
          dispatch({
            type: 'SET_EDITING',
            payload: { isExtracting: true, currentOperation: 'Extracting object...', progress: 0 },
          })
          extractComponentFromRegion(
            image.originalDataUrl,
            hoverComp.boundingBox,
            image.width,
            image.height,
            undefined,
            { x: hoverComp.boundingBox.x + hoverComp.boundingBox.width / 2, y: hoverComp.boundingBox.y + hoverComp.boundingBox.height / 2 }
          )
            .then((result) => {
              dispatch({
                type: 'ADD_EXTRACTED_COMPONENT',
                payload: {
                  cutoutDataUrl: result.dataUrl,
                  region: result.region,
                  maskDataUrl: result.maskDataUrl,
                  name: hoverComp.label,
                },
              })
              dispatch({ type: 'REMOVE_HOVER_DETECTED', payload: hoverComp.id })
              setHoverComponentId(null)
              addToast(`Added: ${hoverComp.label}`, 'success')
            })
            .catch((e) => {
              console.error(e)
              addToast('Extraction failed. Try again.', 'error')
            })
            .finally(() => {
              dispatch({ type: 'SET_EDITING', payload: { isExtracting: false, progress: 100 } })
            })
        } else if (components.some((c) => c.id === hoverComponentId)) {
          dispatch({ type: 'SELECT_COMPONENT', payload: hoverComponentId })
        }
      }
    },
    [interactionMode, dragRegion, dragStart, extractFromRegion, toImageCoords, runClickExtract, hoverComponentId, hoverDetected, image.originalDataUrl, image.width, image.height, components, dispatch]
  )

  const onMouseLeave = useCallback(() => {
    setHoverComponentId(null)
    if (hoverThrottleRef.current != null) {
      clearTimeout(hoverThrottleRef.current)
      hoverThrottleRef.current = null
    }
    if (interactionMode === 'rectangle') {
      onMouseUp()
    }
  }, [interactionMode, onMouseUp])

  if (!image.source) return null

  const imageWidth = image.width * scale
  const imageHeight = image.height * scale

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        position: 'relative' as const,
      }}
    >
      <div
        style={{
          width: 'min(920px, 100%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: '#4b5563' }}>
          {interactionMode === 'rectangle' && 'Draw a rectangle around the component to select it'}
          {interactionMode === 'click' && 'Click on an object to select it (requires SAM)'}
          {interactionMode === 'hover' && (hoverDetected.length > 0
            ? `Hover over an object to highlight it, then click to select (${hoverDetected.length} detected)`
            : 'Hover over an object to highlight it, then click to select')}
          {interactionMode === 'auto' && 'Use "Run detection" above to find objects, then switch to Hover or Click'}
          {interactionMode === 'material' && (components.length === 0 ? 'Add a component first (Rectangle, Click, Hover, or Auto Detect), then select it and choose a material' : 'Select a component in the sidebar, then choose a material below')}
        </div>
        {interactionMode === 'auto' && image.originalDataUrl && (!isGroundingDinoConfigured() || !isSamConfigured()) && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#b91c1c', fontSize: 12 }}>
            Configure Grounding DINO and SAM in .env to use Auto Detect, or use <strong>Rectangle</strong> mode to draw a selection.
          </div>
        )}
        {interactionMode === 'hover' && hoverDetected.length === 0 && !state.editing.isExtracting && isGroundingDinoConfigured() && isSamConfigured() && image.originalDataUrl && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(59, 130, 246, 0.1)', color: '#1d4ed8', fontSize: 12 }}>
            Detecting objects… If nothing appears, try switching mode and back or check the console.
          </div>
        )}
        {interactionMode === 'hover' && hoverDetected.length === 0 && !state.editing.isExtracting && (!isGroundingDinoConfigured() || !isSamConfigured()) && (
          <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#b91c1c', fontSize: 12 }}>
            Hover mode needs Grounding DINO and SAM. Set VITE_GROUNDING_DINO_* and VITE_SEGMENTATION_* in .env, or use <strong>Rectangle</strong> mode.
          </div>
        )}
        {interactionMode === 'click' && !isSamConfigured() && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#b91c1c',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            SAM API is not configured. Add VITE_SEGMENTATION_API_KEY and VITE_SEGMENTATION_API_URL to your .env file to use Click-to-select.
          </div>
        )}
      </div>

      <div
        ref={frameRef}
        title={interactionMode === 'hover' ? 'Click to select object' : undefined}
        style={{
          position: 'relative' as const,
          display: 'inline-block',
          width: imageWidth,
          height: imageHeight,
          maxWidth: '95%',
          maxHeight: '95%',
          borderRadius: 12,
          overflow: 'hidden',
          cursor: interactionMode === 'hover' ? 'pointer' : 'crosshair',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb',
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={(e) => onMouseUp(e)}
        onMouseLeave={onMouseLeave}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLDivElement).click()}
        aria-label="Component selection canvas"
      >
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <canvas
            ref={canvasRef}
            width={image.width}
            height={image.height}
            style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
            aria-hidden
          />
        </div>

        {interactionMode === 'rectangle' && dragRegion && (
          <div
            style={{
              position: 'absolute',
              left: dragRegion.x * scale,
              top: dragRegion.y * scale,
              width: dragRegion.width * scale,
              height: dragRegion.height * scale,
              border: '2px dashed #f59e0b',
              background: 'rgba(245, 158, 11, 0.12)',
              pointerEvents: 'none',
            }}
            aria-hidden
          />
        )}

        {/* Hover overlay: mask-based blue highlight when hovering a detected object (not rectangle) */}
        {interactionMode === 'hover' && hoverComponentId && (() => {
          const hoverComp = hoverDetected.find((h) => h.id === hoverComponentId)
          if (hoverComp) {
            return (
              <div
                key={hoverComp.id}
                aria-hidden
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  width: '100%',
                  height: '100%',
                  background: 'rgba(59, 130, 246, 0.3)',
                  border: '2px dashed rgba(59, 130, 246, 0.9)',
                  boxSizing: 'border-box',
                  WebkitMaskImage: `url(${hoverComp.maskDataUrl})`,
                  maskImage: `url(${hoverComp.maskDataUrl})`,
                  WebkitMaskSize: '100% 100%',
                  maskSize: '100% 100%',
                  WebkitMaskPosition: '0 0',
                  maskPosition: '0 0',
                  WebkitMaskRepeat: 'no-repeat',
                  maskRepeat: 'no-repeat',
                }}
              />
            )
          }
          const comp = components.find((c) => c.id === hoverComponentId)
          if (comp) {
            return (
              <div
                key={comp.id}
                style={{
                  position: 'absolute' as const,
                  left: comp.region.x * scale,
                  top: comp.region.y * scale,
                  width: comp.region.width * scale,
                  height: comp.region.height * scale,
                  border: '2px dashed rgba(59, 130, 246, 0.9)',
                  borderRadius: 8,
                  pointerEvents: 'none',
                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                }}
                aria-hidden
              />
            )
          }
          return null
        })()}

        {/* Label tooltip when hovering an object in hover mode */}
        {interactionMode === 'hover' && hoverComponentId && hoverDetected.find((h) => h.id === hoverComponentId) && (
          <div
            style={{
              position: 'absolute',
              bottom: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '6px 12px',
              borderRadius: 8,
              background: 'rgba(0,0,0,0.75)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              pointerEvents: 'none',
              zIndex: 2,
            }}
          >
            {hoverDetected.find((h) => h.id === hoverComponentId)?.label ?? ''} — Click to select
          </div>
        )}

        {/* Selection overlay for active component(s) */}
        {hasSelection &&
          components
            .filter((c) => activeIds.includes(c.id))
            .map((comp) => (
              <div
                key={comp.id}
                style={{
                  position: 'absolute' as const,
                  left: comp.region.x * scale,
                  top: comp.region.y * scale,
                  width: comp.region.width * scale,
                  height: comp.region.height * scale,
                  border: '2px dashed #2563EB',
                  borderRadius: 8,
                  pointerEvents: 'none',
                  backgroundColor: 'transparent',
                  boxShadow: '0 0 40px rgba(37, 99, 235, 0.6)',
                  animation: 'selection-glow 2s ease-in-out infinite',
                }}
                aria-hidden
              />
            ))}
      </div>

      {isBusy && (
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 20px',
            borderRadius: 12,
            background: 'linear-gradient(90deg, #0ea5e9, #8b5cf6)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#fff',
              animation: 'pulse 1s ease-in-out infinite',
            }}
          />
          {state.editing.currentOperation || 'Processing...'}
        </div>
      )}
    </div>
  )
}
