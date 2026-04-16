/** True when the bbox covers almost the entire image (not a deliberate placement region). */
export function isEffectivelyFullImageSelection(boundingBox: {
  x: number
  y: number
  width: number
  height: number
}): boolean {
  return (
    boundingBox.width >= 0.96 &&
    boundingBox.height >= 0.96 &&
    boundingBox.x <= 0.03 &&
    boundingBox.y <= 0.03
  )
}

export interface CreateMaskOptions {
  /** Fixed blur radius in px. If `0` or omitted with no `autoFeatherForAdd`, edges stay hard. */
  featherPx?: number
  /** When true and `featherPx` is omitted, narrow edge soften (~0.65% of shorter side, clamped 3–12px) so inpaint blends without a wide halo band. */
  autoFeatherForAdd?: boolean
}

/**
 * Create a mask data URL (PNG) from a normalized bounding box.
 * White = selected region, black = keep. Optional feather blurs edges (grayscale falloff).
 */
export async function createMaskFromBoundingBox(
  imageDataUrl: string,
  boundingBox: { x: number; y: number; width: number; height: number },
  options?: CreateMaskOptions
): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const w = img.naturalWidth
      const h = img.naturalHeight
      const x0 = Math.round(boundingBox.x * w)
      const y0 = Math.round(boundingBox.y * h)
      const rw = Math.max(1, Math.round(boundingBox.width * w))
      const rh = Math.max(1, Math.round(boundingBox.height * h))

      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(null)
        return
      }
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(
        Math.min(x0, w - 1),
        Math.min(y0, h - 1),
        Math.min(rw, w - x0),
        Math.min(rh, h - y0)
      )

      let feather = options?.featherPx
      if (feather === undefined && options?.autoFeatherForAdd) {
        const m = Math.min(w, h)
        feather = Math.max(3, Math.min(12, Math.round(m * 0.0065)))
      }
      if (feather != null && feather > 0) {
        const blur = Math.min(Math.round(feather), 64)
        const temp = document.createElement('canvas')
        temp.width = w
        temp.height = h
        const tctx = temp.getContext('2d')
        if (!tctx) {
          try {
            resolve(canvas.toDataURL('image/png', 0.95))
          } catch {
            resolve(null)
          }
          return
        }
        tctx.drawImage(canvas, 0, 0)
        ctx.fillStyle = '#000000'
        ctx.fillRect(0, 0, w, h)
        ctx.filter = `blur(${blur}px)`
        ctx.drawImage(temp, 0, 0)
        ctx.filter = 'none'
      }

      try {
        const dataUrl = canvas.toDataURL('image/png', 0.95)
        resolve(dataUrl)
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = imageDataUrl
  })
}

/** Full-frame white mask (inpaint entire image) for catalog-driven edits with a tight text prompt. */
export async function createFullWhiteMaskDataUrl(imageDataUrl: string): Promise<string | null> {
  return createMaskFromBoundingBox(imageDataUrl, { x: 0, y: 0, width: 1, height: 1 })
}
