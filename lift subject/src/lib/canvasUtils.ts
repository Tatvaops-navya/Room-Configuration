/**
 * Canvas-based extraction and cutout utilities.
 * Uses precise object segmentation (region growing or SAM) — not bounding box.
 */

import type { Region, HoverDetectedComponent } from '../types'
import {
  regionGrowingFromSeed,
  morphologicalClose,
  applyMaskToImageData,
  keepOnlyComponentContainingSeed,
  removeSmallComponents,
} from './segmentation'
import { isSamConfigured, getMaskFromSam } from './samApi'
import {
  isGroundingDinoConfigured,
  detectObjects,
  boxContainingPoint,
  DEFAULT_DETECTION_PROMPT,
} from './groundingDinoApi'

const ACCENT_COLORS = ['#2563EB', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B']

let colorIndex = 0
export function getNextAccentColor(): string {
  const color = ACCENT_COLORS[colorIndex % ACCENT_COLORS.length]
  colorIndex += 1
  return color
}

export function resetAccentIndex(): void {
  colorIndex = 0
}

/**
 * Load image from URL and return dimensions + canvas.
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * Draw image to canvas and return data URL of full image.
 */
export function imageToDataUrl(img: HTMLImageElement): string {
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)
  return canvas.toDataURL('image/png')
}

/**
 * Load image from URL and return a data URL scaled to target dimensions.
 * Used to fit product images into a component's region for replacement.
 */
export function imageUrlToDataUrlScaled(
  imageUrl: string,
  targetWidth: number,
  targetHeight: number
): Promise<string> {
  return loadImage(imageUrl).then((img) => {
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(targetWidth))
    canvas.height = Math.max(1, Math.round(targetHeight))
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(
      img,
      0,
      0,
      img.naturalWidth,
      img.naturalHeight,
      0,
      0,
      canvas.width,
      canvas.height
    )
    return canvas.toDataURL('image/png')
  })
}

/** Luminance threshold: pixels this bright or brighter are treated as background when removing background from product images. */
const PRODUCT_BG_LUMINANCE = 238
/** Color distance threshold for corner-sampled background in product images. */
const PRODUCT_BG_DISTANCE = 48

/**
 * Remove white/light background from a product image so only the product (e.g. sofa) remains on transparency.
 * Uses corner sampling and a luminance threshold so the pasted image blends into the scene instead of a full rectangle.
 */
export function removeBackgroundFromProductImage(dataUrl: string): Promise<string> {
  return loadImage(dataUrl).then((img) => {
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0)
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const d = data.data
    const w = data.width
    const h = data.height

    const band = Math.min(5, Math.floor(w / 4), Math.floor(h / 4))
    let rSum = 0, gSum = 0, bSum = 0, n = 0
    for (let y = 0; y < band; y++) {
      for (let x = 0; x < band; x++) {
        const i = (y * w + x) * 4
        rSum += d[i]; gSum += d[i + 1]; bSum += d[i + 2]; n++
      }
    }
    for (let y = 0; y < band; y++) {
      for (let x = w - band; x < w; x++) {
        const i = (y * w + x) * 4
        rSum += d[i]; gSum += d[i + 1]; bSum += d[i + 2]; n++
      }
    }
    for (let y = h - band; y < h; y++) {
      for (let x = 0; x < band; x++) {
        const i = (y * w + x) * 4
        rSum += d[i]; gSum += d[i + 1]; bSum += d[i + 2]; n++
      }
    }
    for (let y = h - band; y < h; y++) {
      for (let x = w - band; x < w; x++) {
        const i = (y * w + x) * 4
        rSum += d[i]; gSum += d[i + 1]; bSum += d[i + 2]; n++
      }
    }
    const rBg = n > 0 ? rSum / n : 255
    const gBg = n > 0 ? gSum / n : 255
    const bBg = n > 0 ? bSum / n : 255

    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2]
      const lum = (r * 0.299 + g * 0.587 + b * 0.114)
      const dist = colorDistance(r, g, b, rBg, gBg, bBg)
      if (lum >= PRODUCT_BG_LUMINANCE || dist <= PRODUCT_BG_DISTANCE) {
        d[i + 3] = 0
      }
    }
    ctx.putImageData(data, 0, 0)
    return canvas.toDataURL('image/png')
  })
}

/**
 * Load a catalog product image, scale to the given region size, and remove its background so only the product is pasted.
 */
export function loadCatalogImageForReplacement(
  imageUrl: string,
  targetWidth: number,
  targetHeight: number
): Promise<string> {
  return imageUrlToDataUrlScaled(imageUrl, targetWidth, targetHeight).then((scaled) =>
    removeBackgroundFromProductImage(scaled)
  )
}

const COMPOSITE_ALPHA_THRESHOLD = 20
const BACKGROUND_COLOR_DISTANCE = 35
const MASK_HARD_CUTOFF = 128
const MASK_SOFT_EDGE_END = 204

function colorDistance(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number
): number {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2)
}

/** Sample four corners to guess background color; treat pixels near that as transparent so only the object is composited. */
function maskOpaqueBackground(data: ImageData): void {
  const d = data.data
  const w = data.width
  const h = data.height
  const band = Math.min(4, Math.floor(w / 4), Math.floor(h / 4))
  let rSum = 0, gSum = 0, bSum = 0, n = 0
  for (let y = 0; y < band; y++) {
    for (let x = 0; x < band; x++) {
      const i = (y * w + x) * 4
      rSum += d[i]; gSum += d[i + 1]; bSum += d[i + 2]; n++
    }
  }
  for (let y = 0; y < band; y++) {
    for (let x = w - band; x < w; x++) {
      const i = (y * w + x) * 4
      rSum += d[i]; gSum += d[i + 1]; bSum += d[i + 2]; n++
    }
  }
  for (let y = h - band; y < h; y++) {
    for (let x = 0; x < band; x++) {
      const i = (y * w + x) * 4
      rSum += d[i]; gSum += d[i + 1]; bSum += d[i + 2]; n++
    }
  }
  for (let y = h - band; y < h; y++) {
    for (let x = w - band; x < w; x++) {
      const i = (y * w + x) * 4
      rSum += d[i]; gSum += d[i + 1]; bSum += d[i + 2]; n++
    }
  }
  if (n === 0) return
  const rBg = rSum / n, gBg = gSum / n, bBg = bSum / n
  for (let i = 0; i < d.length; i += 4) {
    const dist = colorDistance(d[i], d[i + 1], d[i + 2], rBg, gBg, bBg)
    if (dist <= BACKGROUND_COLOR_DISTANCE) d[i + 3] = 0
  }
}

/** Feather alpha channel of ImageData in-place (box blur) for soft mask edges. */
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
 * Extract mask region (rw x rh) from full-size mask at (rx, ry).
 * Mask must have dimensions imageWidth x imageHeight.
 */
function getMaskRegionImageData(
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
    img.onerror = () => reject(new Error('Failed to load mask for composite'))
    img.onload = () => {
      if (img.naturalWidth !== imageWidth || img.naturalHeight !== imageHeight) {
        reject(new Error(`Mask size ${img.naturalWidth}x${img.naturalHeight} must match image ${imageWidth}x${imageHeight}`))
        return
      }
      const canvas = document.createElement('canvas')
      canvas.width = imageWidth
      canvas.height = imageHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const region = ctx.getImageData(rx, ry, rw, rh)
      resolve(region)
    }
    img.src = maskDataUrl
  })
}

/** Minimum mask coverage (object area / bbox area) to allow apply; avoids mixed-object selection. */
export const MIN_MASK_COVERAGE = 0.8

/**
 * Compute mask coverage in region: fraction of region pixels that are foreground (0..1).
 * Used to reject edits when selection is a large box but object is small (mixed-object case).
 */
export function getMaskCoverageInRegion(
  maskDataUrl: string,
  region: Region,
  imageWidth: number,
  imageHeight: number
): Promise<number> {
  const rx = Math.max(0, Math.floor(region.x))
  const ry = Math.max(0, Math.floor(region.y))
  const rw = Math.min(region.width, imageWidth - rx)
  const rh = Math.min(region.height, imageHeight - ry)
  if (rw <= 0 || rh <= 0) return Promise.resolve(0)
  return getMaskRegionImageData(maskDataUrl, rx, ry, rw, rh, imageWidth, imageHeight).then(
    (data) => {
      let foreground = 0
      const d = data.data
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.round((d[i] + d[i + 1] + d[i + 2]) / 3)
        if (v > 128) foreground++
      }
      return (foreground / (rw * rh)) as number
    },
    () => 0
  )
}

/**
 * Composite all component cutouts back onto the original image.
 * Draw order: base image, then each component in depth order (back to front) so overlapping
 * regions are correct and editing one component does not overwrite another.
 * Each component uses its own mask (component.maskDataUrl only). No global mask or overlay state.
 */
export function compositeComponentsOntoImage(
  originalDataUrl: string,
  imageWidth: number,
  imageHeight: number,
  components: Array<{ cutoutDataUrl: string | null; maskDataUrl?: string | null; region: Region }>
): Promise<string> {
  const withCutouts = components.filter((c) => c.cutoutDataUrl)
  if (withCutouts.length === 0) {
    return Promise.resolve(originalDataUrl)
  }
  const byDepth = [...withCutouts].sort((a, b) => {
    const ay = a.region.y + a.region.height
    const by = b.region.y + b.region.height
    return ay - by
  })
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    console.log('Composite: drawing base +', byDepth.length, 'component(s) in depth order')
  }
  return loadImage(originalDataUrl).then(async (baseImg) => {
    const canvas = document.createElement('canvas')
    canvas.width = imageWidth
    canvas.height = imageHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(baseImg, 0, 0)
    const FEATHER_MASK_PX = 2
    for (const c of byDepth) {
      const cutoutImg = await loadImage(c.cutoutDataUrl!)
      const { x, y, width, height } = c.region
      const rx = Math.max(0, Math.floor(x))
      const ry = Math.max(0, Math.floor(y))
      const rw = Math.min(width, imageWidth - rx)
      const rh = Math.min(height, imageHeight - ry)
      if (rw <= 0 || rh <= 0) continue

      const cutCanvas = document.createElement('canvas')
      cutCanvas.width = rw
      cutCanvas.height = rh
      const cutCtx = cutCanvas.getContext('2d')!
      cutCtx.drawImage(cutoutImg, 0, 0, cutoutImg.naturalWidth, cutoutImg.naturalHeight, 0, 0, rw, rh)
      const cutData = cutCtx.getImageData(0, 0, rw, rh)
      const originalCutData = new ImageData(
        new Uint8ClampedArray(cutData.data),
        cutData.width,
        cutData.height
      )

      const totalPixels = rw * rh
      let transparentCount = 0
      for (let i = 3; i < cutData.data.length; i += 4) {
        if (cutData.data[i] < 220) transparentCount++
      }
      const hasOwnAlpha = totalPixels > 0 && transparentCount / totalPixels > 0.02

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
          featherImageDataAlpha(maskRegion, FEATHER_MASK_PX)
          for (let i = 0; i < cutData.data.length; i += 4) {
            const r = maskRegion.data[i]
            const g = maskRegion.data[i + 1]
            const b = maskRegion.data[i + 2]
            const maskA = Math.round((r + g + b) / 3)
            cutData.data[i + 3] = Math.round((cutData.data[i + 3] * maskA) / 255)
          }
        } catch (e) {
          if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
            console.warn('[composite] Mask apply failed, using fallback:', e)
          }
          if (!hasOwnAlpha) {
            maskOpaqueBackground(cutData)
            let opaqueCount = 0
            for (let i = 3; i < cutData.data.length; i += 4) {
              if (cutData.data[i] > COMPOSITE_ALPHA_THRESHOLD) opaqueCount++
            }
            const visibleRatio = totalPixels > 0 ? opaqueCount / totalPixels : 0
            if (visibleRatio < 0.92) {
              cutData.data.set(originalCutData.data)
              for (let i = 3; i < cutData.data.length; i += 4) {
                cutData.data[i] = 255
              }
            }
          }
        }
      } else if (!hasOwnAlpha) {
        maskOpaqueBackground(cutData)
        let opaqueCount = 0
        for (let i = 3; i < cutData.data.length; i += 4) {
          if (cutData.data[i] > COMPOSITE_ALPHA_THRESHOLD) opaqueCount++
        }
        const visibleRatio = totalPixels > 0 ? opaqueCount / totalPixels : 0
        if (visibleRatio < 0.92) {
          cutData.data.set(originalCutData.data)
          for (let i = 3; i < cutData.data.length; i += 4) {
            cutData.data[i] = 255
          }
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
  })
}

/**
 * Extract region as cutout with transparent background (simulated: crop + soft edges).
 */
export function extractCutout(
  imageDataUrl: string,
  region: Region,
  featherPx: number = 4
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const { x, y, width, height } = region
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.clearRect(0, 0, width, height)

      // Create circular gradient mask for soft edges (feather)
      const gradient = ctx.createRadialGradient(
        width / 2, height / 2, Math.max(0, width / 2 - featherPx),
        width / 2, height / 2, width / 2
      )
      gradient.addColorStop(0, 'rgba(255,255,255,1)')
      gradient.addColorStop(1, 'rgba(255,255,255,0)')

      ctx.save()
      ctx.drawImage(img, x, y, width, height, 0, 0, width, height)
      ctx.globalCompositeOperation = 'destination-in'
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)
      ctx.restore()

      resolve(canvas.toDataURL('image/png'))
    }
    img.src = imageDataUrl
  })
}

/**
 * Simple rectangular crop (no feather) for fast preview.
 */
export function cropToDataUrl(
  imageDataUrl: string,
  region: Region
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = region.width
      canvas.height = region.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(
        img,
        region.x, region.y, region.width, region.height,
        0, 0, region.width, region.height
      )
      resolve(canvas.toDataURL('image/png'))
    }
    img.src = imageDataUrl
  })
}

/**
 * Object segmentation mask: make background transparent so only the component
 * (e.g. sofa) remains. Samples corner pixels as background; applies strict
 * mask so edit is applied only inside component boundaries.
 */
export function removeBackgroundFromCrop(
  dataUrl: string,
  options?: { threshold?: number; edgeBand?: number }
): Promise<string> {
  const threshold = options?.threshold ?? 50
  const edgeBand = options?.edgeBand ?? 0.1
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onerror = () => reject(new Error('Failed to load image for background removal'))
    img.onload = () => {
      const w = img.naturalWidth
      const h = img.naturalHeight
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, w, h)
      const data = imageData.data
      const band = Math.max(2, Math.floor(Math.min(w, h) * edgeBand))
      const corners: Array<[number, number]> = []
      for (let y = 0; y < band; y++) {
        for (let x = 0; x < band; x++) {
          corners.push([x, y])
          corners.push([w - 1 - x, y])
          corners.push([x, h - 1 - y])
          corners.push([w - 1 - x, h - 1 - y])
        }
      }
      let rSum = 0, gSum = 0, bSum = 0
      const n = corners.length
      for (let k = 0; k < n; k++) {
        const [x, y] = corners[k]
        const i = (y * w + x) * 4
        rSum += data[i]
        gSum += data[i + 1]
        bSum += data[i + 2]
      }
      const rBg = rSum / n
      const gBg = gSum / n
      const bBg = bSum / n

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const dist = Math.sqrt((r - rBg) ** 2 + (g - gBg) ** 2 + (b - bBg) ** 2)
        if (dist <= threshold) {
          data[i + 3] = 0
        }
      }
      ctx.putImageData(imageData, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.src = dataUrl
  })
}

/** Material presets: hue offset (degrees), saturation scale (on 0–100). Used for smart material replacement. */
const MATERIAL_PRESETS: Record<string, { hue: number; sat: number }> = {
  wood: { hue: 28, sat: 1.1 },
  marble: { hue: 0, sat: 0.5 },
  fabric: { hue: 260, sat: 1.0 },
  leather: { hue: 24, sat: 1.2 },
  metal: { hue: 0, sat: 0.15 },
  glass: { hue: 200, sat: 0.4 },
  plastic: { hue: 0, sat: 1.3 },
}

/**
 * Smart material replacement: adjust hue/saturation of cutout to match material, preserve shading (luminance).
 * Uses existing rgbToHsl/hslToRgb (h 0–360, s/l 0–100). Returns new cutout data URL for preview.
 */
export function applyMaterialToCutout(
  cutoutDataUrl: string,
  materialId: string
): Promise<string> {
  const preset = MATERIAL_PRESETS[materialId] ?? { hue: 0, sat: 1 }
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onerror = () => reject(new Error('Failed to load cutout for material'))
    img.onload = () => {
      const w = img.naturalWidth
      const h = img.naturalHeight
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, w, h)
      const data = imageData.data
      for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3]
        if (a < 8) continue
        const [hh, ss, ll] = rgbToHsl(data[i], data[i + 1], data[i + 2])
        const newH = (hh + preset.hue + 360) % 360
        const newS = Math.min(100, Math.max(0, ss * preset.sat))
        const [r, g, b] = hslToRgb(newH, newS, ll)
        data[i] = r
        data[i + 1] = g
        data[i + 2] = b
      }
      ctx.putImageData(imageData, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.src = cutoutDataUrl
  })
}

/**
 * Feather the alpha channel of the mask so component edges blend smoothly
 * with the background — no visible hard edges or squares.
 */
export function featherMaskAlpha(
  dataUrl: string,
  radiusPx: number = 2
): Promise<string> {
  if (radiusPx < 1) return Promise.resolve(dataUrl)
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onerror = () => reject(new Error('Failed to load image for feather'))
    img.onload = () => {
      const w = img.naturalWidth
      const h = img.naturalHeight
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, w, h)
      const data = imageData.data
      const r = Math.max(1, Math.min(radiusPx, 5))
      const kernelSize = (2 * r + 1) ** 2
      const alphaOut = new Uint8Array(data.length / 4)
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          let sum = 0
          for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
              const ny = Math.max(0, Math.min(h - 1, y + dy))
              const nx = Math.max(0, Math.min(w - 1, x + dx))
              sum += data[(ny * w + nx) * 4 + 3]
            }
          }
          alphaOut[y * w + x] = Math.round(sum / kernelSize)
        }
      }
      for (let i = 3; i < data.length; i += 4) {
        data[i] = alphaOut[i >> 2]
      }
      ctx.putImageData(imageData, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.src = dataUrl
  })
}

/**
 * Apply a simple preset effect (mock: color/contrast adjustments via canvas).
 */
export function applyPresetToDataUrl(
  dataUrl: string,
  presetId: string
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      const w = canvas.width
      const h = canvas.height
      const idx = (y: number, x: number) => (y * w + x) * 4

      switch (presetId) {
        case 'clean':
          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] * 1.1)
            data[i + 1] = Math.min(255, data[i + 1] * 1.1)
            data[i + 2] = Math.min(255, data[i + 2] * 1.1)
            const g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
            data[i] = data[i] + (g - data[i]) * 0.2
            data[i + 1] = data[i + 1] + (g - data[i + 1]) * 0.2
            data[i + 2] = data[i + 2] + (g - data[i + 2]) * 0.2
          }
          break
        case 'vintage':
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2]
            data[i] = Math.min(255, r * 0.9 + 40)
            data[i + 1] = Math.min(255, g * 0.85 + 20)
            data[i + 2] = Math.min(255, b * 0.7)
          }
          break
        case 'neon':
          for (let i = 0; i < data.length; i += 4) {
            const a = data[i + 3]
            if (a < 10) continue
            data[i] = Math.min(255, data[i] * 1.3)
            data[i + 1] = Math.min(255, data[i + 1] * 1.3)
            data[i + 2] = Math.min(255, data[i + 2] * 1.3)
          }
          break
        case 'grayscale':
          for (let i = 0; i < data.length; i += 4) {
            const g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
            data[i] = data[i + 1] = data[i + 2] = g
          }
          break
        case 'studio':
          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] * 1.08 + 12)
            data[i + 1] = Math.min(255, data[i + 1] * 1.08 + 12)
            data[i + 2] = Math.min(255, data[i + 2] * 1.08 + 15)
          }
          break
        case 'watercolor':
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2]
            data[i] = Math.min(255, r * 0.95 + 25)
            data[i + 1] = Math.min(255, g * 0.9 + 30)
            data[i + 2] = Math.min(255, b * 1.05 + 10)
          }
          break
        case 'shadow':
          for (let py = 0; py < h; py++) {
            for (let px = 0; px < w; px++) {
              const i = idx(py, px)
              const edge = Math.min(py, h - 1 - py, px, w - 1 - px) / Math.max(w, h) * 4
              const f = Math.max(0.5, 1 - edge * 0.12)
              data[i] = Math.floor(data[i] * f)
              data[i + 1] = Math.floor(data[i + 1] * f)
              data[i + 2] = Math.floor(data[i + 2] * f)
            }
          }
          break
        case 'glow':
          for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] < 10) continue
            data[i] = Math.min(255, data[i] * 1.15 + 20)
            data[i + 1] = Math.min(255, data[i + 1] * 1.15 + 20)
            data[i + 2] = Math.min(255, data[i + 2] * 1.15 + 20)
          }
          break
        case 'gold':
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2]
            const gray = 0.299 * r + 0.587 * g + 0.114 * b
            data[i] = Math.min(255, gray * 1.1 + 80)
            data[i + 1] = Math.min(255, gray * 0.9 + 60)
            data[i + 2] = Math.min(255, gray * 0.4 + 20)
          }
          break
        case 'white':
          for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] < 10) {
              data[i] = data[i + 1] = data[i + 2] = 255
              data[i + 3] = 255
            }
          }
          break
        case 'black':
          for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] < 10) {
              data[i] = data[i + 1] = data[i + 2] = 0
              data[i + 3] = 255
            }
          }
          break
        case 'gradient-warm':
          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] * 1.1 + 15)
            data[i + 1] = Math.min(255, data[i + 1] * 1.05 + 5)
            data[i + 2] = Math.min(255, data[i + 2] * 0.95)
          }
          break
        case 'gradient-cool':
          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] * 0.95)
            data[i + 1] = Math.min(255, data[i + 1] * 1.05 + 10)
            data[i + 2] = Math.min(255, data[i + 2] * 1.15 + 15)
          }
          break
        case 'border':
        case 'transparent':
        default:
          break
      }

      ctx.putImageData(imageData, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.src = dataUrl
  })
}

/** Map product variation color names to [R, G, B] for tinting */
const COLOR_NAME_TO_RGB: Record<string, [number, number, number]> = {
  'Charcoal Grey': [70, 70, 75],
  'Beige Linen': [220, 205, 175],
  'Navy Blue': [40, 65, 115],
  'Warm White': [252, 245, 235],
  'Sage Green': [175, 190, 165],
  'Terracotta': [180, 95, 70],
  'Walnut Brown': [115, 85, 55],
  'Oak Natural': [200, 165, 120],
  'White Matte': [245, 242, 238],
  'Matte Black': [45, 45, 48],
  'Pure White': [255, 252, 248],
  'Silver Grey': [185, 188, 192],
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }
  return [h * 360, s * 100, l * 100]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360
  s /= 100
  l /= 100
  let r: number, g: number, b: number
  if (s === 0) {
    r = g = b = l
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}
function hue2rgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1
  if (t > 1) t -= 1
  if (t < 1 / 6) return p + (q - p) * 6 * t
  if (t < 1 / 2) return q
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
  return p
}

/**
 * Apply material/color change only inside the component mask.
 * Preserves original luminance (lighting, shadows, perspective) and only shifts
 * hue and saturation toward the target color — realistic before/after look.
 */
export function applyVariationTintToDataUrl(
  dataUrl: string,
  color: string,
  finish: string
): Promise<string> {
  const targetRgb = COLOR_NAME_TO_RGB[color] ?? [200, 200, 200]
  const [tH, tS, tL] = rgbToHsl(targetRgb[0], targetRgb[1], targetRgb[2])
  const strength = 0.7
  const finishFactor = finish === 'Matte' ? 0.96 : finish === 'Satin' || finish === 'Eggshell' ? 1 : 1.04
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onerror = () => reject(new Error('Failed to load image for tint'))
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3]
        if (a < 10) continue
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const [pH, pS, pL] = rgbToHsl(r, g, b)
        const newH = pH + (tH - pH) * strength
        const newS = Math.min(100, pS + (tS - pS) * strength)
        const newL = Math.max(0, Math.min(100, pL * finishFactor))
        const [nr, ng, nb] = hslToRgb(newH, newS, newL)
        data[i] = Math.min(255, nr)
        data[i + 1] = Math.min(255, ng)
        data[i + 2] = Math.min(255, nb)
      }
      ctx.putImageData(imageData, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.src = dataUrl
  })
}

export interface ExtractResult {
  dataUrl: string
  region: Region
  /** Cached binary/alpha mask (grayscale PNG) for reuse on reset — avoids re-segmentation */
  maskDataUrl?: string
}

/**
 * Compute a rectangular region centered on the click that contains the object.
 * Uses a sensible size (about 35–45% of image) so the whole object is usually inside.
 */
function regionAroundClick(
  clickX: number,
  clickY: number,
  imageWidth: number,
  imageHeight: number
): Region {
  const padW = Math.max(80, Math.floor(imageWidth * 0.4))
  const padH = Math.max(80, Math.floor(imageHeight * 0.4))
  let x = Math.floor(clickX - padW / 2)
  let y = Math.floor(clickY - padH / 2)
  let width = padW
  let height = padH
  if (x < 0) {
    width += x
    x = 0
  }
  if (y < 0) {
    height += y
    y = 0
  }
  if (x + width > imageWidth) width = imageWidth - x
  if (y + height > imageHeight) height = imageHeight - y
  width = Math.max(1, width)
  height = Math.max(1, height)
  return { x, y, width, height }
}

/**
 * Apply an external mask image to the crop: set crop alpha = mask luminance.
 * Used only for non-SAM path (region-growing crop).
 */
function applyMaskImageToCrop(
  cropDataUrl: string,
  maskImageUrl: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onerror = () => reject(new Error('Failed to load crop'))
    img.onload = () => {
      const maskImg = new Image()
      maskImg.crossOrigin = 'anonymous'
      maskImg.onerror = () => reject(new Error('Failed to load mask'))
      maskImg.onload = () => {
        const w = img.naturalWidth
        const h = img.naturalHeight
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, w, h)
        const maskCanvas = document.createElement('canvas')
        maskCanvas.width = w
        maskCanvas.height = h
        const mctx = maskCanvas.getContext('2d')!
        mctx.drawImage(maskImg, 0, 0, w, h)
        const maskData = mctx.getImageData(0, 0, w, h).data
        for (let i = 0; i < w * h; i++) {
          const r = maskData[i * 4]
          const g = maskData[i * 4 + 1]
          const b = maskData[i * 4 + 2]
          const a = maskData[i * 4 + 3]
          imageData.data[i * 4 + 3] = a > 0 ? Math.round((r + g + b) / 3) : 0
        }
        ctx.putImageData(imageData, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      }
      maskImg.src = maskImageUrl
    }
    img.src = cropDataUrl
  })
}

/**
 * Generate a precise object mask for the crop using region growing only.
 * SAM is not used here; full-image SAM is used in extractComponentAtPoint.
 */
export function segmentObjectInCrop(
  cropDataUrl: string,
  seedX: number,
  seedY: number
): Promise<string> {
  const sx = Math.max(0, Math.floor(seedX))
  const sy = Math.max(0, Math.floor(seedY))
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onerror = () => reject(new Error('Failed to load crop for segmentation'))
    img.onload = () => {
      const w = img.naturalWidth
      const h = img.naturalHeight
      const px = Math.min(w - 1, sx)
      const py = Math.min(h - 1, sy)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, w, h)
      let mask = regionGrowingFromSeed(imageData.data, w, h, px, py, { colorThreshold: 42, maxAreaRatio: 0.88 })
      mask = keepOnlyComponentContainingSeed(mask, w, h, px, py)
      mask = removeSmallComponents(mask, w, h, 80)
      mask = morphologicalClose(mask, w, h, 2)
      applyMaskToImageData(imageData, mask)
      ctx.putImageData(imageData, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.src = cropDataUrl
  })
}

/**
 * Verify mask has same resolution as the original image. Log and throw if not.
 * Returns the mask data URL for chaining.
 */
function verifyMaskDimensions(
  maskDataUrl: string,
  imageWidth: number,
  imageHeight: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onerror = () => reject(new Error('Failed to load mask for verification'))
    img.onload = () => {
      const maskW = img.naturalWidth
      const maskH = img.naturalHeight
      if (import.meta.env.DEV) {
        console.debug('[segmentation] image resolution:', imageWidth, 'x', imageHeight)
        console.debug('[segmentation] mask resolution:', maskW, 'x', maskH)
      }
      if (maskW !== imageWidth || maskH !== imageHeight) {
        const msg = `Mask resolution (${maskW}x${maskH}) must equal image resolution (${imageWidth}x${imageHeight}). Do not resize masks after segmentation.`
        console.error('[segmentation]', msg)
        reject(new Error(msg))
        return
      }
      resolve(maskDataUrl)
    }
    img.src = maskDataUrl
  })
}

/**
 * Check if the mask has object-shaped contours (not a solid rectangular block).
 * Returns false if foreground fills almost all of its bounding box (likely a bad mask).
 */
function maskHasObjectShapedContours(
  maskDataUrl: string,
  _region: Region
): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onerror = () => resolve(true)
    img.onload = () => {
      const w = img.naturalWidth
      const h = img.naturalHeight
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const id = ctx.getImageData(0, 0, w, h).data
      let minX = w
      let minY = h
      let maxX = 0
      let maxY = 0
      let foregroundArea = 0
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4
          const r = id[i]
          const g = id[i + 1]
          const b = id[i + 2]
          const a = id[i + 3]
          const v = a > 0 ? a : Math.round((r + g + b) / 3)
          if (v > 128) {
            foregroundArea++
            if (x < minX) minX = x
            if (y < minY) minY = y
            if (x > maxX) maxX = x
            if (y > maxY) maxY = y
          }
        }
      }
      const bboxW = Math.max(1, maxX - minX + 1)
      const bboxH = Math.max(1, maxY - minY + 1)
      const bboxArea = bboxW * bboxH
      const fillRatio = bboxArea > 0 ? foregroundArea / bboxArea : 0
      const hasShape = fillRatio < 0.92
      if (import.meta.env.DEV && !hasShape) {
        console.warn('[segmentation] Mask looks like a rectangular block (fill ratio', fillRatio.toFixed(2), '). Consider rerun with point-only prompt.')
      }
      resolve(hasShape)
    }
    img.src = maskDataUrl
  })
}

/**
 * Compute bounding box of foreground (value > 128) in a full-size mask.
 * Returns padded region clamped to image bounds for use with crop/applyMask.
 */
export function bboxFromMaskDataUrl(
  maskDataUrl: string,
  imageWidth: number,
  imageHeight: number,
  paddingPx: number = 2
): Promise<Region> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onerror = () => reject(new Error('Failed to load mask for bbox'))
    img.onload = () => {
      const w = img.naturalWidth
      const h = img.naturalHeight
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const id = ctx.getImageData(0, 0, w, h).data
      let minX = w
      let minY = h
      let maxX = 0
      let maxY = 0
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

/** Mask values below this are treated as background (alpha 0). Reduces halo. */
const MASK_ALPHA_LOW = 35
/** Mask values at or above this get full opacity. Tighter band for clearer edges. */
const MASK_ALPHA_HIGH = 180

/**
 * Map mask value to output alpha so the object is fully opaque and does not look desaturated in preview.
 * Keeps a smooth edge band for blending.
 */
function maskValueToAlpha(maskValue: number): number {
  if (maskValue <= MASK_ALPHA_LOW) return 0
  if (maskValue >= MASK_ALPHA_HIGH) return 255
  return Math.round((255 * (maskValue - MASK_ALPHA_LOW)) / (MASK_ALPHA_HIGH - MASK_ALPHA_LOW))
}

/**
 * Apply full-size mask to full-size image: object_pixels = image * mask, background = transparent.
 * Mask must have the exact same dimensions as the image. No resizing.
 * Uses a contrast curve so the object region is fully opaque (no faded/washed look in preview).
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
          reject(new Error(`Mask size ${maskImg.naturalWidth}x${maskImg.naturalHeight} does not match image size ${w}x${h}`))
          return
        }
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, w, h)
        const maskCanvas = document.createElement('canvas')
        maskCanvas.width = w
        maskCanvas.height = h
        const mctx = maskCanvas.getContext('2d')!
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

/** Alias for applying cached full-size mask to full image (used on reset). */
export const applyCachedMaskToFullImage = applyMaskToFullImage

/**
 * Expand a crop-sized mask to full image size by placing it at (region.x, region.y).
 * Used so maskDataUrl is always in original image coordinate space.
 */
function expandCropMaskToFullImage(
  cropMaskDataUrl: string,
  region: Region,
  imageWidth: number,
  imageHeight: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const maskImg = new Image()
    maskImg.crossOrigin = 'anonymous'
    maskImg.onerror = () => reject(new Error('Failed to load crop mask'))
    maskImg.onload = () => {
      const cw = maskImg.naturalWidth
      const ch = maskImg.naturalHeight
      const canvas = document.createElement('canvas')
      canvas.width = imageWidth
      canvas.height = imageHeight
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = 'black'
      ctx.fillRect(0, 0, imageWidth, imageHeight)
      ctx.drawImage(maskImg, region.x, region.y, cw, ch, region.x, region.y, cw, ch)
      resolve(canvas.toDataURL('image/png'))
    }
    maskImg.src = cropMaskDataUrl
  })
}

/** Normalize mask image to grayscale single-channel (R=G=B=A = luminance/alpha). */
function maskToGrayscaleDataUrl(maskImageUrl: string): Promise<string> {
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
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const id = ctx.getImageData(0, 0, w, h)
      for (let i = 0; i < w * h; i++) {
        const r = id.data[i * 4]
        const g = id.data[i * 4 + 1]
        const b = id.data[i * 4 + 2]
        const a = id.data[i * 4 + 3]
        const v = a > 0 ? Math.round((r + g + b) / 3) : 0
        id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = id.data[i * 4 + 3] = v
      }
      ctx.putImageData(id, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.src = maskImageUrl
  })
}

/**
 * Extract alpha channel as grayscale PNG for mask caching (object=255, background=0).
 */
function alphaChannelToMaskDataUrl(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onerror = () => reject(new Error('Failed to load image for mask'))
    img.onload = () => {
      const w = img.naturalWidth
      const h = img.naturalHeight
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const id = ctx.getImageData(0, 0, w, h)
      for (let i = 0; i < w * h; i++) {
        const a = id.data[i * 4 + 3]
        id.data[i * 4] = a
        id.data[i * 4 + 1] = a
        id.data[i * 4 + 2] = a
      }
      ctx.putImageData(id, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.src = dataUrl
  })
}

/**
 * Apply a cached mask (grayscale PNG) to a crop. Used on reset to avoid re-segmentation.
 */
export function applyCachedMaskToCrop(
  cropDataUrl: string,
  maskDataUrl: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onerror = () => reject(new Error('Failed to load crop'))
    img.onload = () => {
      const maskImg = new Image()
      maskImg.crossOrigin = 'anonymous'
      maskImg.onerror = () => reject(new Error('Failed to load cached mask'))
      maskImg.onload = () => {
        const w = img.naturalWidth
        const h = img.naturalHeight
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, w, h)
        const maskCanvas = document.createElement('canvas')
        maskCanvas.width = w
        maskCanvas.height = h
        const mctx = maskCanvas.getContext('2d')!
        mctx.drawImage(maskImg, 0, 0, w, h)
        const maskData = mctx.getImageData(0, 0, w, h).data
        for (let i = 0; i < w * h; i++) {
          imageData.data[i * 4 + 3] = maskData[i * 4]
        }
        ctx.putImageData(imageData, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      }
      maskImg.src = maskDataUrl
    }
    img.src = cropDataUrl
  })
}

/**
 * Pad a region by a fraction of its size (for Grounding DINO box → prompt region).
 */
function padRegion(region: Region, imageWidth: number, imageHeight: number, padRatio = 0.08): Region {
  const padX = Math.max(8, Math.floor(region.width * padRatio))
  const padY = Math.max(8, Math.floor(region.height * padRatio))
  let x = Math.max(0, region.x - padX)
  let y = Math.max(0, region.y - padY)
  let width = region.width + 2 * padX
  let height = region.height + 2 * padY
  if (x + width > imageWidth) width = imageWidth - x
  if (y + height > imageHeight) height = imageHeight - y
  width = Math.max(1, width)
  height = Math.max(1, height)
  return { x, y, width, height }
}

/**
 * Full-image SAM pipeline: no crop before segmentation. Mask is full image size;
 * apply mask to full image then crop for display only. Ensures alpha matte shows object shape.
 */
async function extractWithFullImageSam(
  imageDataUrl: string,
  clickX: number,
  clickY: number,
  imageWidth: number,
  imageHeight: number,
  region: Region,
  objectPrompt?: string
): Promise<ExtractResult> {
  if (import.meta.env.DEV) {
    console.debug('[segmentation] bbox coordinates:', region.x, region.y, region.width, region.height)
  }

  let maskDataUrl: string

  const runSam = (boxPrompt?: Region) =>
    getMaskFromSam(imageDataUrl, clickX, clickY, boxPrompt)

  // Prefer point-only so we get the single object under the rectangle center, not everything in the box.
  try {
    maskDataUrl = await runSam(undefined)
    await verifyMaskDimensions(maskDataUrl, imageWidth, imageHeight)
    const hasShape = await maskHasObjectShapedContours(maskDataUrl, region)
    if (!hasShape) {
      maskDataUrl = await runSam(region)
      await verifyMaskDimensions(maskDataUrl, imageWidth, imageHeight)
    }
  } catch {
    maskDataUrl = await runSam(region)
    await verifyMaskDimensions(maskDataUrl, imageWidth, imageHeight)
  }

  maskDataUrl = await maskToGrayscaleDataUrl(maskDataUrl)

  // Use mask bbox so the component is the object only, not the full drawn rectangle.
  const maskBbox = await bboxFromMaskDataUrl(maskDataUrl, imageWidth, imageHeight, 4)
  const cropRegion = maskBbox

  const fullSizeCutout = await applyMaskToFullImage(imageDataUrl, maskDataUrl)
  const croppedCutout = await cropToDataUrl(fullSizeCutout, cropRegion)
  const featheredUrl = await featherMaskAlpha(croppedCutout, 3)

  return {
    dataUrl: featheredUrl,
    region: cropRegion,
    maskDataUrl,
  }
}

/**
 * Resolve the bounding box to use: from Grounding DINO (if configured) or regionAroundClick.
 */
async function resolveRegion(
  imageDataUrl: string,
  clickX: number,
  clickY: number,
  imageWidth: number,
  imageHeight: number,
  objectPrompt?: string
): Promise<Region> {
  if (isGroundingDinoConfigured()) {
    const prompt = objectPrompt?.trim() || DEFAULT_DETECTION_PROMPT
    const boxes = await detectObjects(imageDataUrl, prompt)
    const dinoBox = boxContainingPoint(boxes, clickX, clickY)
    if (dinoBox) return padRegion(dinoBox, imageWidth, imageHeight)
  }
  return regionAroundClick(clickX, clickY, imageWidth, imageHeight)
}

/**
 * Extract component: segmentation on FULL image; bbox only as prompt. Mask same resolution
 * as image; apply mask to full image then crop for display. Alpha matte shows object shape.
 */
export function extractComponentAtPoint(
  imageDataUrl: string,
  clickX: number,
  clickY: number,
  imageWidth: number,
  imageHeight: number,
  objectPrompt?: string
): Promise<ExtractResult> {
  if (isSamConfigured()) {
    return resolveRegion(imageDataUrl, clickX, clickY, imageWidth, imageHeight, objectPrompt).then(
      (region) => extractWithFullImageSam(imageDataUrl, clickX, clickY, imageWidth, imageHeight, region, objectPrompt)
    )
  }

  const region = regionAroundClick(clickX, clickY, imageWidth, imageHeight)
  const seedX = clickX - region.x
  const seedY = clickY - region.y
  return cropToDataUrl(imageDataUrl, region)
    .then((croppedUrl) =>
      segmentObjectInCrop(croppedUrl, seedX, seedY).then((maskedUrl) =>
        removeBackgroundFromCrop(maskedUrl, { threshold: 32, edgeBand: 0.08 }).catch(() => maskedUrl)
      )
    )
    .then((maskedUrl) =>
      Promise.all([
        featherMaskAlpha(maskedUrl, 4),
        alphaChannelToMaskDataUrl(maskedUrl),
      ]).then(([featheredUrl, cropMaskDataUrl]) =>
        expandCropMaskToFullImage(cropMaskDataUrl, region, imageWidth, imageHeight).then((fullMaskDataUrl) => ({
          featheredUrl,
          maskDataUrl: fullMaskDataUrl,
        }))
      )
    )
    .then(({ featheredUrl, maskDataUrl }) => ({
      dataUrl: featheredUrl,
      region,
      maskDataUrl,
    }))
}

/**
 * Click-to-select: use SAM with point prompt only (no box), derive bbox from mask, then extract.
 * Used when interactionMode === 'click'.
 */
export async function extractComponentAtPointClick(
  imageDataUrl: string,
  clickX: number,
  clickY: number,
  imageWidth: number,
  imageHeight: number
): Promise<ExtractResult> {
  if (!isSamConfigured()) {
    throw new Error('Click-to-select requires SAM. Configure VITE_SEGMENTATION_API_KEY and VITE_SEGMENTATION_API_URL.')
  }
  let maskDataUrl = await getMaskFromSam(imageDataUrl, clickX, clickY, undefined)
  await verifyMaskDimensions(maskDataUrl, imageWidth, imageHeight)
  maskDataUrl = await maskToGrayscaleDataUrl(maskDataUrl)
  const region = await bboxFromMaskDataUrl(maskDataUrl, imageWidth, imageHeight, 4)
  const fullSizeCutout = await applyMaskToFullImage(imageDataUrl, maskDataUrl)
  const croppedCutout = await cropToDataUrl(fullSizeCutout, region)
  const featheredUrl = await featherMaskAlpha(croppedCutout, 3)
  return { dataUrl: featheredUrl, region, maskDataUrl }
}

/**
 * Extract component from a known rectangular region.
 * Used by screenshot selection and AI text detection modes.
 */
export function extractComponentFromRegion(
  imageDataUrl: string,
  region: Region,
  imageWidth: number,
  imageHeight: number,
  objectPrompt?: string,
  seedPoint?: { x: number; y: number }
): Promise<ExtractResult> {
  const clickX = seedPoint?.x ?? region.x + region.width / 2
  const clickY = seedPoint?.y ?? region.y + region.height / 2
  if (isSamConfigured()) {
    return extractWithFullImageSam(
      imageDataUrl,
      clickX,
      clickY,
      imageWidth,
      imageHeight,
      region,
      objectPrompt
    )
  }
  const seedX = Math.max(1, Math.floor((seedPoint?.x ?? (region.x + region.width / 2)) - region.x))
  const seedY = Math.max(1, Math.floor((seedPoint?.y ?? (region.y + region.height / 2)) - region.y))
  return cropToDataUrl(imageDataUrl, region)
    .then((croppedUrl) =>
      segmentObjectInCrop(croppedUrl, seedX, seedY).then((maskedUrl) =>
        removeBackgroundFromCrop(maskedUrl, { threshold: 32, edgeBand: 0.08 }).catch(() => maskedUrl)
      )
    )
    .then((maskedUrl) =>
      Promise.all([
        featherMaskAlpha(maskedUrl, 4),
        alphaChannelToMaskDataUrl(maskedUrl),
      ]).then(([featheredUrl, cropMaskDataUrl]) =>
        expandCropMaskToFullImage(cropMaskDataUrl, region, imageWidth, imageHeight).then((fullMaskDataUrl) => ({
          featheredUrl,
          maskDataUrl: fullMaskDataUrl,
        }))
      )
    )
    .then(({ featheredUrl, maskDataUrl }) => ({
      dataUrl: featheredUrl,
      region,
      maskDataUrl,
    }))
}

/** Minimum box size for auto-detect to avoid tiny/noise detections. */
const AUTO_DETECT_MIN_SIZE = 50

/** Prompt for auto room component detection (Grounding DINO). */
export const AUTO_DETECT_PROMPT =
  'sofa . chair . coffee table . desk . wall . floor . door . glass partition . reception desk'

/** Prompt for hover-mode object detection (run once per image). */
export const HOVER_DETECTION_PROMPT =
  'sofa . chair . coffee table . table . desk . reception desk . wall . door . floor . plant'

/**
 * Detect objects for hover mode: DINO for boxes, SAM for each mask. Does not add to components[].
 * Run once when image loads or when hover mode activates. Used for hover highlight only.
 */
export async function detectHoverComponents(
  imageDataUrl: string,
  imageWidth: number,
  imageHeight: number
): Promise<HoverDetectedComponent[]> {
  if (!isGroundingDinoConfigured()) throw new Error('Hover detection requires Grounding DINO.')
  if (!isSamConfigured()) throw new Error('Hover detection requires SAM.')
  const boxes = await detectObjects(imageDataUrl, HOVER_DETECTION_PROMPT)
  const padded = boxes
    .map((b) => padRegion(b, imageWidth, imageHeight))
    .filter((r) => r.width >= AUTO_DETECT_MIN_SIZE && r.height >= AUTO_DETECT_MIN_SIZE)
  const results: HoverDetectedComponent[] = []
  const baseId = `hover-${Date.now()}`
  for (let i = 0; i < padded.length; i++) {
    try {
      const box = padded[i]
      const cx = box.x + box.width / 2
      const cy = box.y + box.height / 2
      const maskDataUrl = await getMaskFromSam(imageDataUrl, cx, cy, box)
      results.push({
        id: `${baseId}-${i}`,
        label: `Object ${i + 1}`,
        boundingBox: box,
        maskDataUrl,
      })
    } catch (e) {
      if (import.meta.env?.DEV) console.warn('[detectHoverComponents] skip box', i, e)
    }
  }
  return results
}

/**
 * Detect room components automatically: Grounding DINO for boxes, then SAM for each mask, then extract.
 * Returns array of { cutoutDataUrl, region, maskDataUrl, name } for ADD_EXTRACTED_COMPONENTS.
 */
export async function detectRoomComponents(
  imageDataUrl: string,
  imageWidth: number,
  imageHeight: number
): Promise<Array<{ cutoutDataUrl: string; region: Region; maskDataUrl?: string; name: string }>> {
  if (!isGroundingDinoConfigured()) {
    throw new Error('Auto-detect requires Grounding DINO. Configure VITE_GROUNDING_DINO_API_KEY and URL.')
  }
  const boxes = await detectObjects(imageDataUrl, AUTO_DETECT_PROMPT)
  const padded = boxes
    .map((b) => padRegion(b, imageWidth, imageHeight))
    .filter((r) => r.width >= AUTO_DETECT_MIN_SIZE && r.height >= AUTO_DETECT_MIN_SIZE)
  const results: Array<{ cutoutDataUrl: string; region: Region; maskDataUrl?: string; name: string }> = []
  for (let i = 0; i < padded.length; i++) {
    try {
      const r = await extractComponentFromRegion(
        imageDataUrl,
        padded[i],
        imageWidth,
        imageHeight,
        undefined,
        { x: padded[i].x + padded[i].width / 2, y: padded[i].y + padded[i].height / 2 }
      )
      results.push({
        cutoutDataUrl: r.dataUrl,
        region: r.region,
        maskDataUrl: r.maskDataUrl,
        name: `Detected ${i + 1}`,
      })
    } catch (e) {
      if (import.meta.env?.DEV) console.warn('[detectRoomComponents] skip box', i, e)
    }
  }
  return results
}

/**
 * Legacy: grid of regions (used only if we need fallback).
 */
export function detectComponents(
  imageWidth: number,
  imageHeight: number
): Region[] {
  const w = imageWidth
  const h = imageHeight
  const cols = 3
  const rows = 2
  const regions: Region[] = []
  const cellW = Math.floor(w / cols)
  const cellH = Math.floor(h / rows)
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * cellW
      const y = row * cellH
      const width = col === cols - 1 ? w - x : cellW
      const height = row === rows - 1 ? h - y : cellH
      if (width > 0 && height > 0) {
        regions.push({ x, y, width, height })
      }
    }
  }
  return regions
}
