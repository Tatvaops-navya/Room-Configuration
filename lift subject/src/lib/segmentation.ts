/**
 * Object-level segmentation for interior component editing.
 * Produces a precise binary mask (object vs background) so only the selected
 * component is edited — no bounding box, no wall/floor fragments.
 *
 * Supports: region growing from click + morphological refinement.
 * Optional: SAM (Segment Anything) API when configured.
 */

export const SEGMENTATION_API_KEY = import.meta.env.VITE_SEGMENTATION_API_KEY ?? ''
export const SEGMENTATION_API_URL = import.meta.env.VITE_SEGMENTATION_API_URL ?? ''

export function isSegmentationApiConfigured(): boolean {
  return Boolean(SEGMENTATION_API_KEY && SEGMENTATION_API_URL)
}

/** Color distance (Euclidean in RGB) */
function colorDist(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number
): number {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2)
}

/**
 * Region growing from seed: object mask where pixels connected to the seed
 * and similar in color are marked as object (255). Rest are background (0).
 * Prevents wall/floor from being included when user clicks on sofa/cabinet.
 */
export function regionGrowingFromSeed(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  seedX: number,
  seedY: number,
  options?: { colorThreshold?: number; maxAreaRatio?: number }
): Uint8Array {
  const threshold = options?.colorThreshold ?? 48
  const maxAreaRatio = options?.maxAreaRatio ?? 0.85
  const maxPixels = Math.floor(width * height * maxAreaRatio)
  const mask = new Uint8Array(width * height)
  const visited = new Uint8Array(width * height)
  const queue: number[] = [seedY * width + seedX]
  visited[seedY * width + seedX] = 1
  let count = 0
  const dx = [-1, 0, 1, -1, 1, -1, 0, 1]
  const dy = [-1, -1, -1, 0, 0, 1, 1, 1]
  while (queue.length > 0 && count < maxPixels) {
    const idx = queue.shift()!
    mask[idx] = 255
    count++
    const y = Math.floor(idx / width)
    const x = idx % width
    const i = idx * 4
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    for (let k = 0; k < 8; k++) {
      const nx = x + dx[k]
      const ny = y + dy[k]
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
      const nidx = ny * width + nx
      if (visited[nidx]) continue
      const ni = nidx * 4
      const nr = data[ni]
      const ng = data[ni + 1]
      const nb = data[ni + 2]
      if (colorDist(r, g, b, nr, ng, nb) <= threshold) {
        visited[nidx] = 1
        queue.push(nidx)
      }
    }
  }
  return mask
}

/**
 * Keep only the connected component that contains the seed pixel.
 * Removes stray mask islands that don't contain the click point.
 */
export function keepOnlyComponentContainingSeed(
  mask: Uint8Array,
  width: number,
  height: number,
  seedX: number,
  seedY: number
): Uint8Array {
  const out = new Uint8Array(mask.length)
  const seedIdx = seedY * width + seedX
  if (mask[seedIdx] === 0) return out
  const queue: number[] = [seedIdx]
  const visited = new Uint8Array(mask.length)
  visited[seedIdx] = 1
  const dx = [-1, 0, 1, -1, 1, -1, 0, 1]
  const dy = [-1, -1, -1, 0, 0, 1, 1, 1]
  while (queue.length > 0) {
    const idx = queue.shift()!
    out[idx] = 255
    const y = Math.floor(idx / width)
    const x = idx % width
    for (let k = 0; k < 8; k++) {
      const nx = x + dx[k]
      const ny = y + dy[k]
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
      const nidx = ny * width + nx
      if (visited[nidx] || mask[nidx] === 0) continue
      visited[nidx] = 1
      queue.push(nidx)
    }
  }
  return out
}

/**
 * Remove small connected components (noise) below minPixels.
 * Keeps the mask binary.
 */
export function removeSmallComponents(
  mask: Uint8Array,
  width: number,
  height: number,
  minPixels: number
): Uint8Array {
  const out = new Uint8Array(mask.length)
  const visited = new Uint8Array(mask.length)
  const dx = [-1, 0, 1, -1, 1, -1, 0, 1]
  const dy = [-1, -1, -1, 0, 0, 1, 1, 1]
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] === 0 || visited[i]) continue
    const queue: number[] = [i]
    const component: number[] = []
    visited[i] = 1
    while (queue.length > 0) {
      const idx = queue.shift()!
      component.push(idx)
      const y = Math.floor(idx / width)
      const x = idx % width
      for (let k = 0; k < 8; k++) {
        const nx = x + dx[k]
        const ny = y + dy[k]
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
        const nidx = ny * width + nx
        if (visited[nidx] || mask[nidx] === 0) continue
        visited[nidx] = 1
        queue.push(nidx)
      }
    }
    if (component.length >= minPixels) {
      for (const idx of component) out[idx] = 255
    }
  }
  return out
}

/**
 * Morphological closing: dilate then erode to fill small holes and smooth
 * the object boundary without including background.
 */
export function morphologicalClose(
  mask: Uint8Array,
  width: number,
  height: number,
  radius: number = 2
): Uint8Array {
  const out = new Uint8Array(mask.length)
  const r = Math.max(1, Math.min(radius, 4))
  const dilate = (src: Uint8Array, dst: Uint8Array) => {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let any = src[y * width + x] ? 1 : 0
        for (let dy = -r; dy <= r && !any; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            const ny = Math.max(0, Math.min(height - 1, y + dy))
            const nx = Math.max(0, Math.min(width - 1, x + dx))
            if (src[ny * width + nx] > 0) { any = 1; break }
          }
        }
        dst[y * width + x] = any ? 255 : 0
      }
    }
  }
  const erode = (src: Uint8Array, dst: Uint8Array) => {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (!src[y * width + x]) { dst[y * width + x] = 0; continue }
        let all = 1
        for (let dy = -r; dy <= r && all; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            const ny = Math.max(0, Math.min(height - 1, y + dy))
            const nx = Math.max(0, Math.min(width - 1, x + dx))
            if (src[ny * width + nx] === 0) { all = 0; break }
          }
        }
        dst[y * width + x] = all ? 255 : 0
      }
    }
  }
  const temp = new Uint8Array(mask.length)
  dilate(mask, temp)
  erode(temp, out)
  return out
}

/**
 * Apply binary mask to image data: set alpha = mask value.
 * Result is object pixels opaque, background fully transparent.
 */
export function applyMaskToImageData(
  imageData: ImageData,
  mask: Uint8Array
): void {
  const data = imageData.data
  for (let i = 0; i < mask.length; i++) {
    data[i * 4 + 3] = mask[i]
  }
}
