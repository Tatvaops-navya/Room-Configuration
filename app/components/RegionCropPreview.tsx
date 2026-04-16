'use client'

import { useEffect, useRef } from 'react'
import type { EraseRegion } from './EraseRegionSelector'

/**
 * Magnified crop of the selected normalized rectangle so users can see what will be erased.
 */
export default function RegionCropPreview({
  imageSrc,
  region,
  maxWidth = 360,
  maxHeight = 280,
  label,
}: {
  imageSrc: string
  region: EraseRegion
  maxWidth?: number
  maxHeight?: number
  /** Accessible / visible label */
  label?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !imageSrc || !region?.width || !region?.height) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      const iw = img.naturalWidth
      const ih = img.naturalHeight
      if (iw <= 0 || ih <= 0) return

      const sx = Math.max(0, Math.floor(region.x * iw))
      const sy = Math.max(0, Math.floor(region.y * ih))
      const sw = Math.max(1, Math.min(iw - sx, Math.ceil(region.width * iw)))
      const sh = Math.max(1, Math.min(ih - sy, Math.ceil(region.height * ih)))

      const aspect = sw / sh
      let cw = Math.min(maxWidth, sw)
      let ch = Math.round(cw / aspect)
      if (ch > maxHeight) {
        ch = maxHeight
        cw = Math.round(ch * aspect)
      }
      canvas.width = cw
      canvas.height = ch
      ctx.clearRect(0, 0, cw, ch)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      try {
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch)
      } catch {
        /* tainted canvas etc. */
      }
    }
    img.onerror = () => {
      const c = canvasRef.current
      if (!c) return
      const ctx2 = c.getContext('2d')
      if (!ctx2) return
      c.width = 200
      c.height = 40
      ctx2.fillStyle = '#f1f5f9'
      ctx2.fillRect(0, 0, 200, 40)
      ctx2.fillStyle = '#64748b'
      ctx2.font = '12px sans-serif'
      ctx2.fillText('Preview unavailable', 8, 24)
    }
    img.src = imageSrc
  }, [imageSrc, region, maxWidth, maxHeight])

  return (
    <figure style={{ margin: 0 }}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={label || 'Magnified preview of selected erase region'}
        style={{
          display: 'block',
          maxWidth: '100%',
          height: 'auto',
          borderRadius: 10,
          border: '2px solid rgba(124, 58, 237, 0.55)',
          boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
          background: '#0f172a',
        }}
      />
      {label ? (
        <figcaption className="hint-text" style={{ marginTop: '0.4rem', fontSize: '0.82rem' }}>
          {label}
        </figcaption>
      ) : null}
    </figure>
  )
}
