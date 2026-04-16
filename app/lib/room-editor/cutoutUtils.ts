/**
 * Cutout extraction and compositing (Lift Subject flow).
 * Used when selection has cutoutDataUrl — composite instead of inpainting.
 */

export interface RegionPx {
  x: number
  y: number
  width: number
  height: number
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/** Crop from normalized bbox (0–1). Returns data URL of cropped region. */
export function cropFromNormalizedBbox(
  imageDataUrl: string,
  bbox: { x: number; y: number; width: number; height: number }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onerror = () => reject(new Error('Failed to load image'))
    img.onload = () => {
      const w = img.naturalWidth
      const h = img.naturalHeight
      const region: RegionPx = {
        x: Math.max(0, bbox.x * w),
        y: Math.max(0, bbox.y * h),
        width: Math.max(1, bbox.width * w),
        height: Math.max(1, bbox.height * h),
      }
      cropToDataUrl(imageDataUrl, region).then(resolve).catch(reject)
    }
    img.src = imageDataUrl
  })
}

/** Crop region from image. */
export function cropToDataUrl(
  imageDataUrl: string,
  region: RegionPx
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onerror = () => reject(new Error('Failed to load image'))
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(region.width))
      canvas.height = Math.max(1, Math.round(region.height))
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('No canvas context'))
        return
      }
      ctx.drawImage(
        img,
        region.x, region.y, region.width, region.height,
        0, 0, canvas.width, canvas.height
      )
      resolve(canvas.toDataURL('image/png'))
    }
    img.src = imageDataUrl
  })
}

const MASK_ALPHA_LOW = 35
const MASK_ALPHA_HIGH = 180

function maskValueToAlpha(maskValue: number): number {
  if (maskValue <= MASK_ALPHA_LOW) return 0
  if (maskValue >= MASK_ALPHA_HIGH) return 255
  return Math.round((255 * (maskValue - MASK_ALPHA_LOW)) / (MASK_ALPHA_HIGH - MASK_ALPHA_LOW))
}

/**
 * Apply full-size mask to full-size image: object = image * mask, background = transparent.
 */
export function applyMaskToFullImage(
  fullImageDataUrl: string,
  maskDataUrl: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onerror = () => reject(new Error('Failed to load image'))
    img.onload = () => {
      const w = img.naturalWidth
      const h = img.naturalHeight
      const maskImg = new Image()
      maskImg.crossOrigin = 'anonymous'
      maskImg.onerror = () => reject(new Error('Failed to load mask'))
      maskImg.onload = () => {
        if (maskImg.naturalWidth !== w || maskImg.naturalHeight !== h) {
          reject(new Error('Mask size must match image'))
          return
        }
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('No canvas context'))
          return
        }
        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, w, h)
        const maskCanvas = document.createElement('canvas')
        maskCanvas.width = w
        maskCanvas.height = h
        const mctx = maskCanvas.getContext('2d')
        if (!mctx) {
          reject(new Error('No mask canvas context'))
          return
        }
        mctx.drawImage(maskImg, 0, 0, w, h)
        const maskData = mctx.getImageData(0, 0, w, h).data
        for (let i = 0; i < w * h; i++) {
          const r = maskData[i * 4]
          const g = maskData[i * 4 + 1]
          const b = maskData[i * 4 + 2]
          const a = maskData[i * 4 + 3]
          const maskValue = a > 0 ? a : Math.round((r + g + b) / 3)
          imageData.data[i * 4 + 3] = maskValueToAlpha(maskValue)
        }
        ctx.putImageData(imageData, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      }
      maskImg.src = maskDataUrl
    }
    img.src = fullImageDataUrl
  })
}

/** Compute bbox of foreground (value > 128) in mask. */
export function bboxFromMaskDataUrl(
  maskDataUrl: string,
  imageWidth: number,
  imageHeight: number,
  paddingPx = 2
): Promise<RegionPx> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onerror = () => reject(new Error('Failed to load mask'))
    img.onload = () => {
      const w = img.naturalWidth
      const h = img.naturalHeight
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('No canvas context'))
        return
      }
      ctx.drawImage(img, 0, 0)
      const id = ctx.getImageData(0, 0, w, h).data
      let minX = w, minY = h, maxX = 0, maxY = 0
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4
          const r = id[i]
          const g = id[i + 1]
          const b = id[i + 2]
          const a = id[i + 3]
          const v = a > 0 ? a : Math.round((r + g + b) / 3)
          if (v > 128) {
            if (x < minX) minX = x
            if (y < minY) minY = y
            if (x > maxX) maxX = x
            if (y > maxY) maxY = y
          }
        }
      }
      const pad = Math.max(0, paddingPx)
      const x = Math.max(0, minX - pad)
      const y = Math.max(0, minY - pad)
      const width = Math.min(imageWidth - x, Math.max(1, maxX - minX + 1 + 2 * pad))
      const height = Math.min(imageHeight - y, Math.max(1, maxY - minY + 1 + 2 * pad))
      resolve({ x, y, width, height })
    }
    img.src = maskDataUrl
  })
}

const COMPOSITE_ALPHA_THRESHOLD = 20

/** Get mask region ImageData from full-size mask. */
async function getMaskRegionImageData(
  maskDataUrl: string,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
  imageWidth: number,
  imageHeight: number
): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onerror = () => reject(new Error('Failed to load mask'))
    img.onload = () => {
      if (img.naturalWidth !== imageWidth || img.naturalHeight !== imageHeight) {
        reject(new Error('Mask size must match image'))
        return
      }
      const canvas = document.createElement('canvas')
      canvas.width = imageWidth
      canvas.height = imageHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('No canvas context'))
        return
      }
      ctx.drawImage(img, 0, 0)
      const region = ctx.getImageData(rx, ry, rw, rh)
      resolve(region)
    }
    img.src = maskDataUrl
  })
}

/** Feather alpha channel (box blur) for soft edges. */
function featherImageDataAlpha(data: ImageData, radiusPx: number): void {
  if (radiusPx < 1) return
  const d = data.data
  const w = data.width
  const h = data.height
  const r = Math.max(1, Math.min(radiusPx, 8))
  const kernelSize = (2 * r + 1) ** 2
  const alphaOut = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const ny = Math.max(0, Math.min(h - 1, y + dy))
          const nx = Math.max(0, Math.min(w - 1, x + dx))
          sum += d[(ny * w + nx) * 4 + 3]
        }
      }
      alphaOut[y * w + x] = Math.round(sum / kernelSize)
    }
  }
  for (let i = 3; i < d.length; i += 4) {
    d[i] = alphaOut[i >> 2]
  }
}

/**
 * Composite cutouts back onto the original image.
 * Components drawn in depth order (bottom-to-top by Y).
 */
export async function compositeCutoutsOntoImage(
  originalDataUrl: string,
  imageWidth: number,
  imageHeight: number,
  components: Array<{ cutoutDataUrl: string; maskDataUrl?: string | null; region: RegionPx }>
): Promise<string> {
  if (components.length === 0) return originalDataUrl
  const byDepth = [...components].sort((a, b) => {
    const ay = a.region.y + a.region.height
    const by = b.region.y + b.region.height
    return ay - by
  })
  const baseImg = await loadImage(originalDataUrl)
  const canvas = document.createElement('canvas')
  canvas.width = imageWidth
  canvas.height = imageHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No canvas context')
  ctx.drawImage(baseImg, 0, 0)
  const FEATHER_PX = 2
  for (const c of byDepth) {
    const cutoutImg = await loadImage(c.cutoutDataUrl)
    const { x, y, width, height } = c.region
    const rx = Math.max(0, Math.floor(x))
    const ry = Math.max(0, Math.floor(y))
    const rw = Math.min(width, imageWidth - rx)
    const rh = Math.min(height, imageHeight - ry)
    if (rw <= 0 || rh <= 0) continue
    const cutCanvas = document.createElement('canvas')
    cutCanvas.width = rw
    cutCanvas.height = rh
    const cutCtx = cutCanvas.getContext('2d')
    if (!cutCtx) continue
    cutCtx.drawImage(cutoutImg, 0, 0, cutoutImg.naturalWidth, cutoutImg.naturalHeight, 0, 0, rw, rh)
    let cutData = cutCtx.getImageData(0, 0, rw, rh)
    if (c.maskDataUrl && imageWidth > 0 && imageHeight > 0) {
      try {
        const maskRegion = await getMaskRegionImageData(
          c.maskDataUrl,
          rx,
          ry,
          rw,
          rh,
          imageWidth,
          imageHeight
        )
        featherImageDataAlpha(maskRegion, FEATHER_PX)
        for (let i = 0; i < cutData.data.length; i += 4) {
          const maskA = Math.round(
            (maskRegion.data[i] + maskRegion.data[i + 1] + maskRegion.data[i + 2]) / 3
          )
          cutData.data[i + 3] = Math.round((cutData.data[i + 3] * maskA) / 255)
        }
      } catch {
        /* fallback: use cutout alpha as-is */
      }
    }
    const baseData = ctx.getImageData(rx, ry, rw, rh)
    for (let i = 0; i < baseData.data.length; i += 4) {
      const a = cutData.data[i + 3]
      if (a > COMPOSITE_ALPHA_THRESHOLD) {
        baseData.data[i] = cutData.data[i]
        baseData.data[i + 1] = cutData.data[i + 1]
        baseData.data[i + 2] = cutData.data[i + 2]
        baseData.data[i + 3] = 255
      }
    }
    ctx.putImageData(baseData, rx, ry)
  }
  return canvas.toDataURL('image/png')
}
