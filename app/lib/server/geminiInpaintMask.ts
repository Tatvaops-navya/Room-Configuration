/**
 * Masked inpainting for room editor: edit, replace, erase.
 * Uses Gemini image model with image + mask (white = region to modify).
 */
import sharp from 'sharp'

export type RoomEditorOperation = 'edit' | 'replace' | 'erase' | 'add'

/** Image models can exceed 3m on large images; align with route maxDuration. Override via GEMINI_IMAGE_TIMEOUT_MS (ms, 60s–600s). */
function resolveGeminiImageTimeoutMs(): number {
  const raw = Number(process.env.GEMINI_IMAGE_TIMEOUT_MS)
  if (Number.isFinite(raw) && raw >= 60_000 && raw <= 600_000) return raw
  return 300_000
}
const DESIGN_CONTEXT =
  'Context: Professional interior/exterior design and room configuration visualization. All content is for design purposes only.\n\n'
const NO_LOGO =
  'CRITICAL – NO TEXT, LOGOS, OR NAMES IN OUTPUT: The generated image must contain ZERO text, ZERO logos, and ZERO brand names. Never draw or reproduce any logo or text. Output must be a clean visualization.\n\n'

function parseDataUrl(dataUrl: string): { data: string; mimeType: string } | null {
  if (!dataUrl?.includes(',')) return null
  const [header, b64] = dataUrl.split(',')
  if (!b64) return null
  const m = header?.match(/data:([^;]+)/)
  const mimeType = m?.[1]?.toLowerCase().startsWith('image/') ? m[1] : 'image/png'
  return { data: b64, mimeType }
}

function toDataUrl(mimeType: string, base64: string): string {
  return `data:${mimeType};base64,${base64}`
}

/** Blend model output with source: mask luminance = alpha (white = use output). Guarantees unchanged pixels outside the mask. */
export async function compositeAddOutputOntoSource(
  outputDataUrl: string,
  sourceDataUrl: string,
  maskDataUrl: string,
  options?: { hardMask?: boolean }
): Promise<string | null> {
  try {
    const out = parseDataUrl(outputDataUrl)
    const src = parseDataUrl(sourceDataUrl)
    const mask = parseDataUrl(maskDataUrl)
    if (!out || !src || !mask) return null

    const srcBuf = Buffer.from(src.data, 'base64')
    const outBuf = Buffer.from(out.data, 'base64')
    const maskBuf = Buffer.from(mask.data, 'base64')

    const meta = await sharp(srcBuf).metadata()
    const width = meta.width ?? 0
    const height = meta.height ?? 0
    if (width <= 0 || height <= 0) return null

    const srcRaw = await sharp(srcBuf).resize(width, height).removeAlpha().raw().toBuffer()
    const outRaw = await sharp(outBuf).resize(width, height, { fit: 'fill' }).removeAlpha().raw().toBuffer()
    const maskRaw = await sharp(maskBuf).resize(width, height).removeAlpha().raw().toBuffer()

    const pixels = width * height
    const dst = Buffer.alloc(pixels * 3)
    const hardMask = !!options?.hardMask
    /** Feathered masks + full-frame model output: linear alpha leaves a wide “double exposure” band. Bias edge alphas toward source. */
    const compositeAlpha = (luma01: number) => {
      const t = Math.max(0, Math.min(1, luma01))
      if (hardMask) return t >= 0.5 ? 1 : 0
      return Math.pow(t, 1.55)
    }
    for (let p = 0; p < pixels; p++) {
      const i = p * 3
      const luma01 = (maskRaw[i] + maskRaw[i + 1] + maskRaw[i + 2]) / 3 / 255
      const a = compositeAlpha(luma01)
      dst[i] = Math.round(outRaw[i] * a + srcRaw[i] * (1 - a))
      dst[i + 1] = Math.round(outRaw[i + 1] * a + srcRaw[i + 1] * (1 - a))
      dst[i + 2] = Math.round(outRaw[i + 2] * a + srcRaw[i + 2] * (1 - a))
    }

    const png = await sharp(dst, { raw: { width, height, channels: 3 } })
      .png({ compressionLevel: 9 })
      .toBuffer()
    return toDataUrl('image/png', png.toString('base64'))
  } catch {
    return null
  }
}

/** Mean abs RGB diff inside high-confidence mask (luma ≥ threshold). Low score ⇒ no visible edit inside region. */
async function maskedRegionMeanAbsDiff(
  sourceDataUrl: string,
  resultDataUrl: string,
  maskDataUrl: string,
  maskLumaThreshold = 200
): Promise<{ mean: number; corePixels: number }> {
  try {
    const src = parseDataUrl(sourceDataUrl)
    const res = parseDataUrl(resultDataUrl)
    const mask = parseDataUrl(maskDataUrl)
    if (!src || !res || !mask) return { mean: 0, corePixels: 0 }

    const srcBuf = Buffer.from(src.data, 'base64')
    const resBuf = Buffer.from(res.data, 'base64')
    const maskBuf = Buffer.from(mask.data, 'base64')

    const meta = await sharp(srcBuf).metadata()
    const width = meta.width ?? 0
    const height = meta.height ?? 0
    if (width <= 0 || height <= 0) return { mean: 0, corePixels: 0 }

    const srcRaw = await sharp(srcBuf).resize(width, height).removeAlpha().raw().toBuffer()
    const resRaw = await sharp(resBuf).resize(width, height).removeAlpha().raw().toBuffer()
    const maskRaw = await sharp(maskBuf).resize(width, height).removeAlpha().raw().toBuffer()

    let corePixels = 0
    let sum = 0
    const pixels = width * height
    for (let p = 0; p < pixels; p++) {
      const i = p * 3
      const ml = (maskRaw[i] + maskRaw[i + 1] + maskRaw[i + 2]) / 3
      if (ml < maskLumaThreshold) continue
      corePixels++
      sum +=
        Math.abs(srcRaw[i] - resRaw[i]) +
        Math.abs(srcRaw[i + 1] - resRaw[i + 1]) +
        Math.abs(srcRaw[i + 2] - resRaw[i + 2])
    }
    if (corePixels === 0) return { mean: 0, corePixels: 0 }
    return { mean: sum / (corePixels * 3), corePixels }
  } catch {
    return { mean: 0, corePixels: 0 }
  }
}

const ADD_MIN_CORE_PIXELS = 400
const ADD_MIN_MEAN_ABS_DIFF = 9
const REPLACE_MIN_CORE_PIXELS = 400
const REPLACE_MIN_MEAN_ABS_DIFF = 10
const MASK_VARIANCE_SAMPLE_MIN = 400
/** Slabs over tiling + glazing often collapse global luma variance in mask; plush objects usually stay above ~46. */
const ADD_MASKED_LUMA_VARIANCE_RETRY_BELOW = 46

function isLikelyFloorStandingPrompt(userPrompt?: string): boolean {
  const t = (userPrompt || '').toLowerCase()
  return /(sofa|couch|chair|armchair|recliner|table|desk|cabinet|bed|stool|bench|ottoman|bookshelf|shelf|tv unit|console|wardrobe)/.test(
    t
  )
}

/** Estimate changed footprint inside mask; used to catch tiny "partial add" outputs. */
async function maskedChangedFootprint(
  sourceDataUrl: string,
  resultDataUrl: string,
  maskDataUrl: string
): Promise<{ changedRatio: number; bboxAreaRatio: number; changedPixels: number; maskPixels: number }> {
  try {
    const src = parseDataUrl(sourceDataUrl)
    const res = parseDataUrl(resultDataUrl)
    const mask = parseDataUrl(maskDataUrl)
    if (!src || !res || !mask) {
      return { changedRatio: 0, bboxAreaRatio: 0, changedPixels: 0, maskPixels: 0 }
    }
    const srcBuf = Buffer.from(src.data, 'base64')
    const resBuf = Buffer.from(res.data, 'base64')
    const maskBuf = Buffer.from(mask.data, 'base64')
    const meta = await sharp(srcBuf).metadata()
    const width = meta.width ?? 0
    const height = meta.height ?? 0
    if (width <= 0 || height <= 0) {
      return { changedRatio: 0, bboxAreaRatio: 0, changedPixels: 0, maskPixels: 0 }
    }
    const srcRaw = await sharp(srcBuf).resize(width, height).removeAlpha().raw().toBuffer()
    const resRaw = await sharp(resBuf).resize(width, height).removeAlpha().raw().toBuffer()
    const maskRaw = await sharp(maskBuf).resize(width, height).removeAlpha().raw().toBuffer()
    let maskPixels = 0
    let changedPixels = 0
    let minX = width
    let maxX = -1
    let minY = height
    let maxY = -1
    const diffThreshold = 24
    const pixels = width * height
    for (let p = 0; p < pixels; p++) {
      const i = p * 3
      const ml = (maskRaw[i] + maskRaw[i + 1] + maskRaw[i + 2]) / 3
      if (ml < 220) continue
      maskPixels++
      const dr = Math.abs(srcRaw[i] - resRaw[i])
      const dg = Math.abs(srcRaw[i + 1] - resRaw[i + 1])
      const db = Math.abs(srcRaw[i + 2] - resRaw[i + 2])
      if (dr + dg + db < diffThreshold) continue
      changedPixels++
      const x = p % width
      const y = Math.floor(p / width)
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
    if (maskPixels === 0 || changedPixels === 0 || maxX < minX || maxY < minY) {
      return { changedRatio: 0, bboxAreaRatio: 0, changedPixels, maskPixels }
    }
    const changedRatio = changedPixels / maskPixels
    const bboxArea = (maxX - minX + 1) * (maxY - minY + 1)
    const bboxAreaRatio = bboxArea / maskPixels
    return { changedRatio, bboxAreaRatio, changedPixels, maskPixels }
  } catch {
    return { changedRatio: 0, bboxAreaRatio: 0, changedPixels: 0, maskPixels: 0 }
  }
}

/**
 * Detect the common "white rectangle" artifact for add-object:
 * inside the masked area, output becomes mostly pure-white compared to source.
 */
async function hasAddWhiteBackgroundArtifact(
  outputDataUrl: string,
  sourceDataUrl: string,
  maskDataUrl: string
): Promise<boolean> {
  try {
    const out = parseDataUrl(outputDataUrl)
    const src = parseDataUrl(sourceDataUrl)
    const mask = parseDataUrl(maskDataUrl)
    if (!out || !src || !mask) return false

    const outBuf = Buffer.from(out.data, 'base64')
    const srcBuf = Buffer.from(src.data, 'base64')
    const maskBuf = Buffer.from(mask.data, 'base64')

    const meta = await sharp(outBuf).metadata()
    const width = meta.width ?? 0
    const height = meta.height ?? 0
    if (width <= 0 || height <= 0) return false

    const outRaw = await sharp(outBuf).resize(width, height).removeAlpha().raw().toBuffer()
    const srcRaw = await sharp(srcBuf).resize(width, height).removeAlpha().raw().toBuffer()
    const maskRaw = await sharp(maskBuf).resize(width, height).removeAlpha().raw().toBuffer()

    let maskedPixels = 0
    let outWhite = 0
    let srcWhite = 0
    for (let i = 0, p = 0; i < maskRaw.length; i += 3, p++) {
      const mr = maskRaw[i]
      const mg = maskRaw[i + 1]
      const mb = maskRaw[i + 2]
      const maskLuma = (mr + mg + mb) / 3
      if (maskLuma < 220) continue
      maskedPixels++
      const oi = p * 3
      const or = outRaw[oi]
      const og = outRaw[oi + 1]
      const ob = outRaw[oi + 2]
      if (or >= 236 && og >= 236 && ob >= 236) outWhite++
      const sr = srcRaw[oi]
      const sg = srcRaw[oi + 1]
      const sb = srcRaw[oi + 2]
      if (sr >= 236 && sg >= 236 && sb >= 236) srcWhite++
    }
    if (maskedPixels < 400) return false

    const outRatio = outWhite / maskedPixels
    const srcRatio = srcWhite / maskedPixels
    // Flag only when output becomes much whiter than source inside edited zone.
    return outRatio >= 0.45 && (outRatio - srcRatio) >= 0.22
  } catch {
    return false
  }
}

/**
 * Population luminance variance in high-confidence masked pixels — low values often mean billboard fill.
 */
async function maskedRegionLumaVariance(outputDataUrl: string, maskDataUrl: string): Promise<number | null> {
  try {
    const out = parseDataUrl(outputDataUrl)
    const mask = parseDataUrl(maskDataUrl)
    if (!out || !mask) return null

    const outBuf = Buffer.from(out.data, 'base64')
    const maskBuf = Buffer.from(mask.data, 'base64')

    const meta = await sharp(outBuf).metadata()
    const width = meta.width ?? 0
    const height = meta.height ?? 0
    if (width <= 0 || height <= 0) return null

    const outRaw = await sharp(outBuf).resize(width, height).removeAlpha().raw().toBuffer()
    const maskRaw = await sharp(maskBuf).resize(width, height).removeAlpha().raw().toBuffer()

    let n = 0
    let sum = 0
    let sumSq = 0
    for (let i = 0, p = 0; i < maskRaw.length; i += 3, p++) {
      const ml = (maskRaw[i] + maskRaw[i + 1] + maskRaw[i + 2]) / 3
      if (ml < 200) continue
      const oi = p * 3
      const lum = (outRaw[oi] + outRaw[oi + 1] + outRaw[oi + 2]) / 3
      sum += lum
      sumSq += lum * lum
      n++
    }
    if (n < MASK_VARIANCE_SAMPLE_MIN) return null
    const mean = sum / n
    const variance = Math.max(0, sumSq / n - mean * mean)
    return variance
  } catch {
    return null
  }
}

/**
 * Detect a "flat card" artifact: masked region becomes near-uniform (often near-white),
 * which usually indicates a pasted product-card / sticker composite rather than in-scene inpaint.
 */
async function hasFlatCardArtifact(outputDataUrl: string, maskDataUrl: string): Promise<boolean> {
  try {
    const out = parseDataUrl(outputDataUrl)
    const mask = parseDataUrl(maskDataUrl)
    if (!out || !mask) return false

    const outBuf = Buffer.from(out.data, 'base64')
    const maskBuf = Buffer.from(mask.data, 'base64')

    const meta = await sharp(outBuf).metadata()
    const width = meta.width ?? 0
    const height = meta.height ?? 0
    if (width <= 0 || height <= 0) return false

    const outRaw = await sharp(outBuf).resize(width, height).removeAlpha().raw().toBuffer()
    const maskRaw = await sharp(maskBuf).resize(width, height).removeAlpha().raw().toBuffer()

    let n = 0
    let sum = 0
    let sumSq = 0
    for (let i = 0, p = 0; i < maskRaw.length; i += 3, p++) {
      const ml = (maskRaw[i] + maskRaw[i + 1] + maskRaw[i + 2]) / 3
      if (ml < 220) continue
      const oi = p * 3
      const r = outRaw[oi]
      const g = outRaw[oi + 1]
      const b = outRaw[oi + 2]
      const luma = (r + g + b) / 3
      n++
      sum += luma
      sumSq += luma * luma
    }
    if (n < 400) return false

    const mean = sum / n
    const variance = Math.max(0, sumSq / n - mean * mean)
    // Heuristic: a pasted "card" tends to be bright and low-variance inside the mask.
    return mean >= 235 && variance <= 55
  } catch {
    return false
  }
}

/**
 * Detect the "studio floor / white slab" artifact often produced by add-mode:
 * a large bright low-chroma patch appears in the lower part of the masked area.
 */
async function hasAddStudioFloorArtifact(
  outputDataUrl: string,
  sourceDataUrl: string,
  maskDataUrl: string
): Promise<boolean> {
  try {
    const out = parseDataUrl(outputDataUrl)
    const src = parseDataUrl(sourceDataUrl)
    const mask = parseDataUrl(maskDataUrl)
    if (!out || !src || !mask) return false

    const outBuf = Buffer.from(out.data, 'base64')
    const srcBuf = Buffer.from(src.data, 'base64')
    const maskBuf = Buffer.from(mask.data, 'base64')

    const meta = await sharp(outBuf).metadata()
    const width = meta.width ?? 0
    const height = meta.height ?? 0
    if (width <= 0 || height <= 0) return false

    const outRaw = await sharp(outBuf).resize(width, height).removeAlpha().raw().toBuffer()
    const srcRaw = await sharp(srcBuf).resize(width, height).removeAlpha().raw().toBuffer()
    const maskRaw = await sharp(maskBuf).resize(width, height).removeAlpha().raw().toBuffer()

    const rowMasked = new Int32Array(height)
    const rowSuspicious = new Int32Array(height)
    let minY = height
    let maxY = -1

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const p = y * width + x
        const i = p * 3
        const ml = (maskRaw[i] + maskRaw[i + 1] + maskRaw[i + 2]) / 3
        if (ml < 220) continue
        rowMasked[y]++
        if (y < minY) minY = y
        if (y > maxY) maxY = y

        const or = outRaw[i]
        const og = outRaw[i + 1]
        const ob = outRaw[i + 2]
        const sr = srcRaw[i]
        const sg = srcRaw[i + 1]
        const sb = srcRaw[i + 2]
        const outLuma = (or + og + ob) / 3
        const srcLuma = (sr + sg + sb) / 3
        const spread = Math.max(or, og, ob) - Math.min(or, og, ob)
        const suspicious =
          outLuma >= 208 &&
          spread <= 24 &&
          outLuma - srcLuma >= 22 &&
          !(sr >= 228 && sg >= 228 && sb >= 228)
        if (suspicious) rowSuspicious[y]++
      }
    }

    if (maxY < minY) return false
    const span = maxY - minY + 1
    const lowerStart = Math.max(minY, minY + Math.floor(span * 0.45))
    let suspiciousRows = 0
    let suspiciousPixels = 0
    for (let y = lowerStart; y <= maxY; y++) {
      const masked = rowMasked[y]
      if (masked < 24) continue
      const ratio = rowSuspicious[y] / masked
      if (ratio >= 0.36) {
        suspiciousRows++
        suspiciousPixels += rowSuspicious[y]
      }
    }
    return suspiciousRows >= 8 && suspiciousPixels >= 900
  } catch {
    return false
  }
}

/**
 * Safety post-process for add-mode: remove obvious white background artifacts inside the edit mask.
 * If output has near-white patch pixels where source is not white, copy those pixels from source.
 */
async function cleanAddWhiteArtifactPixels(
  outputDataUrl: string,
  sourceDataUrl: string,
  maskDataUrl: string
): Promise<string> {
  try {
    const out = parseDataUrl(outputDataUrl)
    const src = parseDataUrl(sourceDataUrl)
    const mask = parseDataUrl(maskDataUrl)
    if (!out || !src || !mask) return outputDataUrl

    const outBuf = Buffer.from(out.data, 'base64')
    const srcBuf = Buffer.from(src.data, 'base64')
    const maskBuf = Buffer.from(mask.data, 'base64')

    const meta = await sharp(outBuf).metadata()
    const width = meta.width ?? 0
    const height = meta.height ?? 0
    if (width <= 0 || height <= 0) return outputDataUrl

    const outRaw = await sharp(outBuf).resize(width, height).removeAlpha().raw().toBuffer()
    const srcRaw = await sharp(srcBuf).resize(width, height).removeAlpha().raw().toBuffer()
    const maskRaw = await sharp(maskBuf).resize(width, height).removeAlpha().raw().toBuffer()

    const rowMasked = new Int32Array(height)
    const rowSuspicious = new Int32Array(height)
    let minY = height
    let maxY = -1
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const p = y * width + x
        const i = p * 3
        const maskLuma = (maskRaw[i] + maskRaw[i + 1] + maskRaw[i + 2]) / 3
        if (maskLuma < 220) continue
        rowMasked[y]++
        if (y < minY) minY = y
        if (y > maxY) maxY = y

        const or = outRaw[i]
        const og = outRaw[i + 1]
        const ob = outRaw[i + 2]
        const sr = srcRaw[i]
        const sg = srcRaw[i + 1]
        const sb = srcRaw[i + 2]
        const outLuma = (or + og + ob) / 3
        const srcLuma = (sr + sg + sb) / 3
        const spread = Math.max(or, og, ob) - Math.min(or, og, ob)
        if (
          outLuma >= 208 &&
          spread <= 24 &&
          outLuma - srcLuma >= 22 &&
          !(sr >= 228 && sg >= 228 && sb >= 228)
        ) {
          rowSuspicious[y]++
        }
      }
    }

    const suspiciousRows = new Uint8Array(height)
    if (maxY >= minY) {
      const span = maxY - minY + 1
      const lowerStart = Math.max(minY, minY + Math.floor(span * 0.45))
      for (let y = lowerStart; y <= maxY; y++) {
        const masked = rowMasked[y]
        if (masked < 24) continue
        if (rowSuspicious[y] / masked >= 0.36) suspiciousRows[y] = 1
      }
    }

    let changed = 0
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const p = y * width + x
        const i = p * 3
        const maskLuma = (maskRaw[i] + maskRaw[i + 1] + maskRaw[i + 2]) / 3
        if (maskLuma < 220) continue

        const or = outRaw[i]
        const og = outRaw[i + 1]
        const ob = outRaw[i + 2]
        const sr = srcRaw[i]
        const sg = srcRaw[i + 1]
        const sb = srcRaw[i + 2]
        const outLuma = (or + og + ob) / 3
        const srcLuma = (sr + sg + sb) / 3
        const spread = Math.max(or, og, ob) - Math.min(or, og, ob)

        const outIsWhitePatch = or >= 234 && og >= 234 && ob >= 234
        const srcIsNotWhite = !(sr >= 236 && sg >= 236 && sb >= 236)
        const suspiciousStudioFloorPixel =
          suspiciousRows[y] === 1 &&
          outLuma >= 202 &&
          spread <= 28 &&
          outLuma - srcLuma >= 18 &&
          !(sr >= 228 && sg >= 228 && sb >= 228)

        if ((outIsWhitePatch && srcIsNotWhite) || suspiciousStudioFloorPixel) {
          outRaw[i] = sr
          outRaw[i + 1] = sg
          outRaw[i + 2] = sb
          changed++
        }
      }
    }

    if (changed === 0) return outputDataUrl

    const cleaned = await sharp(outRaw, {
      raw: { width, height, channels: 3 },
    })
      .png({ compressionLevel: 9 })
      .toBuffer()
    return `data:image/png;base64,${cleaned.toString('base64')}`
  } catch {
    return outputDataUrl
  }
}

async function fetchGemini(
  url: string,
  options: RequestInit & { body: string },
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    clearTimeout(timeoutId)
    return res
  } catch (err) {
    clearTimeout(timeoutId)
    throw err
  }
}

export interface RunGeminiMaskedInpaintParams {
  operation: RoomEditorOperation
  imageDataUrl: string
  maskDataUrl: string
  userPrompt?: string
  /** Add-object only: optional catalog/product image (data URL) for appearance matching. */
  referenceImageDataUrl?: string
}

export interface RunGeminiMaskedInpaintResult {
  ok: true
  imageUrl: string
}

export interface RunGeminiMaskedInpaintError {
  ok: false
  error: string
  status: number
}

export async function runGeminiMaskedInpaint(
  params: RunGeminiMaskedInpaintParams
): Promise<RunGeminiMaskedInpaintResult | RunGeminiMaskedInpaintError> {
  const { operation, imageDataUrl, maskDataUrl, userPrompt, referenceImageDataUrl } = params

  const imageParts = parseDataUrl(imageDataUrl)
  const maskParts = parseDataUrl(maskDataUrl)
  if (!imageParts || !maskParts) {
    return { ok: false, error: 'Invalid image or mask data URL', status: 400 }
  }

  const referenceParts: Array<
    { text: string } | { inlineData: { data: string; mimeType: string } }
  > = []
  if ((operation === 'add' || operation === 'replace') && referenceImageDataUrl?.trim()) {
    const refParsed = parseDataUrl(referenceImageDataUrl.trim())
    if (refParsed) {
      referenceParts.push({
        text:
          operation === 'replace'
            ? 'REFERENCE — USER-SELECTED CATALOG ITEM FOR REPLACE (strict): The next image is the exact product the user chose. In the white masked region, fully remove old content and render ONLY this selected item in-scene (same design, silhouette, parts, materials, and colors). IMPORTANT: ignore plain/white/neutral reference backgrounds; use object pixels only. FORBIDDEN: pasted catalog card, white/gray rectangle, sticker-like cutout, or additive layering over old object. Output must be a true photoreal replacement integrated with room lighting/perspective and floor/rug continuity.'
            : 'REFERENCE — USER-SELECTED CATALOG ITEM (strict): The next image is the exact product or tile the user chose. Reproduce only that item inside the bright masked region of the FIRST room photograph: same design, shape, number of parts, materials, and colors — not a different SKU and not a “similar” or upgraded alternative. IMPORTANT: treat any plain/white/neutral background in the reference as non-object pixels to ignore; extract and use ONLY the object itself (its silhouette + materials). Do not add companion objects, extra accessories, plants, additional lamps, side tables, duplicate units, or decorative groupings unless they are clearly part of the same single product in the reference (e.g. a photographed set). For wall/floor tile references, match that pattern only — no extra borders or mixed patterns. Re-render in the room’s camera angle, perspective, scale, and lighting — fully integrated in 3D with correct contact shadow and floor/rug continuity. Do not paste the reference as a flat layer; do not output a white or gray studio card behind it; the result must look photographed in the same scene as the room.',
      })
      referenceParts.push({
        inlineData: { data: refParsed.data, mimeType: refParsed.mimeType },
      })
    }
  }

  const apiKey = process.env.IMAGE_GENERATION_API_KEY
  if (!apiKey) {
    return { ok: false, error: 'Image generation API key is not configured', status: 500 }
  }

  const addPrompt = `${DESIGN_CONTEXT}${NO_LOGO}ADD-OBJECT — NATIVE 3D IN SCENE (NOT A PASTE): You receive (1) one interior photograph and (2) a mask on the same pixel grid. Output must be ONE photograph — as if the camera captured the room with the new object already there.

HARD REGION RULES (NON-NEGOTIABLE):
• Place the object strictly inside the selected region only (bright / white mask). The new object’s visible pixels must lie inside that region in image coordinates.
• Do not modify any area outside the selected region — outside the mask must remain pixel-identical to the first photograph.
• Do not remove or alter existing objects outside the selection. Do not replace the entire image or repaint the whole room.

FORBIDDEN — “PRODUCT PHOTO” OR STICKER COMPOSITES:
• NEVER paste a rectangular picture of furniture with a white, light gray, cream, or solid studio backdrop behind it.
• NEVER output a flat front-on catalog / e-commerce cutout floating in the room.
• NEVER surround the object with a visible rectangle, card, panel, or uniform fill that is not real architecture.
• The bookshelf, plant, lamp, etc. must be RE-RENDERED in the room’s own camera angle, perspective, and vanishing points — volumetric, lit like the rest of the scene, not a 2D layer.

PHOTOREAL INTEGRATION (REQUIRED):
• Match the room’s focal length and viewpoint: the added object must obey the same floor plane, horizon, and depth cues as nearby sofa, tables, and walls.
• Match color temperature, shadow softness, and highlight direction from the room’s windows and lights.
• Wood, metal, fabric, and leaves must show material-appropriate response to that light — not a flat illustration.
• Soft ambient occlusion and a visible contact shadow where the object meets the floor or rug inside the masked area — same direction and softness as other shadows in the photo.
• Brass, chrome, gold, or glass must show specular highlights consistent with the dominant light direction already visible on walls and furniture — not generic studio sparkle.

MASK EDGE — NO HALO OR “DOUBLE FLOOR” (CRITICAL):
• Do not create a bright ring, dark ring, blur ghost, or duplicated texture around the mask boundary.
• At the edge of the selected region, new pixels must meet unchanged pixels seamlessly — no second copy of rug, tile, or wood grain offset from the real one.

RUG / CARPET / HARD FLOOR CONTINUITY:
• If the source shows a rug, carpet, or patterned floor inside or next to the mask, continue that exact texture, scale, and perspective under the object’s base — do not replace rug with plain tile, smooth concrete, or a different pattern unless the photograph already shows that transition.
• Legs or plinths sit on the continued surface; do not cut off the rug abruptly at an artificial straight edge under the object.

WALL SURFACE CONTINUITY (MIRRORS, ART, SHELVES, SCONCES):
• If most of the mask is wall space, preserve the existing wall finish (color, plaster/stucco noise, wallpaper, panel lines) everywhere except where the new object physically covers it. Extend the same wall texture behind and around the object at the correct perspective.
• NEVER replace the masked wall with a flat solid gray, off-white, cream, or uniform fill that does not match the surrounding wall — that reads as a pasted rectangle, not a real room.
• New pixels should be the added object plus natural wall contact shadow and thin frame geometry; the wall substrate must match adjacent visible wall pixels in hue, grain, and lighting.

FLOOR LINE — NO WHITE MAT / STRIP (CRITICAL):
• NEVER paint a white, off-white, cream, light gray, or flat “paper” rectangle, band, or plinth along the bottom of the object where it meets the floor.
• NEVER leave an e-commerce “studio floor” or product-base mat under cabinets, bookcases, or legs.
• The real floor from the photograph (tile pattern, grout, wood planks, carpet/rug texture) must continue seamlessly under and around the object’s base inside the mask — same hue, noise, and perspective as adjacent visible floor.
• Any kick plate or plinth on the furniture must be stained wood, painted trim, or metal matching the unit — not pure white unless the room’s trim is actually white and continuous with surroundings.

SOFAS / CHAIRS ON PATTERNED FLOOR OR TILE (CRITICAL — NO FULL-BLEED BILLBOARD):
• The selection box is only a GUIDE for placement—not a billboard to repaint. Everywhere inside the rectangle that shows **floor**, **open doorway/outside light**, **window glazing, bars/grilles, sill, reflections**, OR **distinct wall plaster** MUST stay tied to **the SAME pixels/details as the FIRST photo** wherever the furniture does not genuinely occlude them.
• A sofa skirt, frame, cushions, pillows, legs, arms, tufting, and cast shadows are allowed to change—but you MUST preserve local floor/window/door realism in exposed zones: patterned tiles keep their pattern continuity; barred windows remain visible translucent glass with daylight — NOT flattened to a solid upholstered color slab.
• If part of an open doorway or window falls inside the white mask but is **visible around** the silhouette of the couch, KEEP that outdoor light and architecture—do NOT smear upholstery yellow (or any object color) over it as one opaque rectangle.

SPATIAL RULE — USER BOX ONLY:
• Bright mask = only region where pixels may change. The object’s footprint on the floor must fall inside that rectangle in image coordinates.
• Do not relocate the object to hallways, door paths, or distant walls unless the mask covers that area.

CATALOG / REFERENCE LOCK-IN (when a reference product image was provided):
• Exactly one faithful instance of the selected item — no automatic extras, no “complete the vignette” staging, no additional decor to fill the mask.
• If the reference shows one chair, output one chair; if one vase, one vase — never a pair or cluster unless the reference clearly shows multiple as one product.

BLACK / DARK MASK:
• Must remain identical to the first image — same pixels as the input photograph (no edits, no relighting, no cleanup outside the mask).

STRICT PROMPT-TEXT MODE GUARANTEE (for text-described objects):
• If the user prompt specifies attributes (color, object type, material, size, style), they are mandatory and must be reproduced exactly.
• Never substitute specified attributes with “better looking” defaults (e.g., pink sofa must not become green/beige sofa).
• Never add extra decor, companion objects, or stylistic variations not requested.
• Validation before final output: exact color match, exact object-type match, and no extra additions.
• If anything conflicts, prioritize the user's prompt attributes over model defaults.

User request: ${userPrompt || 'Add one plausible object that fits the space.'}`

  const basePrompt =
    operation === 'erase'
      ? `${DESIGN_CONTEXT}${NO_LOGO}INPAINTING TASK: You are given two images. The FIRST image is the room. The SECOND image is a binary mask (white = region to remove, black = keep). Your output must be a single image that is identical to the first image except: the area that was white in the mask must be completely removed and seamlessly filled with the surrounding background (floor, wall, ceiling, furniture, etc.) so it looks natural, as if that object or area was never there. Do not change anything outside the white region. Preserve the exact same image dimensions, framing, and all unchanged pixels. No text or labels in the output.`
      : operation === 'add'
        ? addPrompt
          : operation === 'edit'
          ? `${DESIGN_CONTEXT}${NO_LOGO}INPAINTING TASK: You are given two images. The FIRST image is the room. The SECOND image is a binary mask (white = region to modify, black = keep unchanged). Modify ONLY the white region according to the user's instructions. Do not change anything outside the white region. Preserve the exact same image dimensions, framing, and all unchanged pixels. No text or labels in the output.\n\nUser instructions: ${userPrompt || 'Restyle the selected region to match the room style.'}`
          : `${DESIGN_CONTEXT}${NO_LOGO}REPLACE — FULL SCENE REGENERATION INSIDE MASK (NOT ADD-ON-TOP): You receive (1) one interior photograph and (2) a mask on the same pixel grid. Output ONE photograph.

YOUR TASK: COMPLETELY REPLACE an existing object with a new one, seamlessly and photorealistically, as a true in-scene regeneration inside the selected region.

CRITICAL INSTRUCTIONS:

1) COMPLETE OBJECT REMOVAL (MANDATORY)
• Fully remove the existing object from the selected area.
• Remove all traces of the old object: shape, texture, shadows, highlights, silhouettes, edges, reflections, and remnants.
• The original object must not be visible in any form after replacement.
• First reconstruct the background and surfaces in the region naturally so the floor, wall, and surrounding areas are clean and continuous before the new object is resolved.

2) NO OVERLAY / NO PARTIAL BLENDING (MANDATORY)
• This is REPLACEMENT, not addition.
• Do NOT paste or layer a new object on top of the old one.
• Do NOT create visible seams, split regions, hard cut lines, card-like patches, transparency artifacts, or double structures.
• The edited region must read as one continuous render.

3) SEAMLESS BLENDING (MANDATORY)
• No visible boundary between edited and original region.
• Match local texture frequency, brightness, noise, and grain to surrounding pixels.
• Avoid vertical/horizontal split artifacts and abrupt transitions at mask edges.
• Edge quality is critical: no blur halo, no cut boundary, and no pasted-cutout look.

4) LIGHTING CONSISTENCY (MANDATORY)
• Match room lighting direction, intensity, and color temperature.
• Generate realistic contact shadows and occlusion aligned with existing light sources.
• New object must not look artificially inserted.

5) PERSPECTIVE & SCALE ACCURACY (MANDATORY)
• Align object with room geometry, floor plane, vanishing points, and camera angle.
• Scale must be plausible relative to nearby furniture and architecture.
• Ensure correct position and floor alignment relative to surrounding objects and surfaces.

6) STRUCTURAL PRESERVATION (MANDATORY)
• Do NOT alter walls, floor, ceiling, windows, doors, or room layout.
• Do NOT alter decor, lighting fixtures, or background elements outside the selected region.
• Only replace content inside the white mask.
• Black mask pixels must remain identical to the first image.

7) FINAL SELF-CHECK (MANDATORY)
Before final output, verify:
• old object is completely gone
• no ghosting, transparency artifacts, or double structures
• no seams, split lines, patch edges, or blur halos
• lighting and shadow consistency
• perspective, scale, and floor alignment consistency
If any check fails, internally regenerate and fix before returning the final image.

User instructions: ${userPrompt || 'Replace with one object that fits the room; remove the old subject entirely within the mask.'}`

  const maskCaption =
    operation === 'add'
      ? 'Mask: bright = selected region ONLY. Place the object strictly inside this region. Do not modify any area outside the bright region — keep those pixels identical to the first image. Synthesize in full 3D scene perspective — not a flat product image on white. Continue existing rug/floor texture under the object; no halo or double floor pattern at the mask edge; contact shadow matches room lighting.'
      : operation === 'replace'
        ? 'Mask: white = region to fully repaint. Remove old content there completely — single layer, no stacked objects. Black = unchanged pixels.'
        : 'Mask (white = region to modify):'

  const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-3-pro-image-preview'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const buildBody = (extraText?: string) =>
    JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { text: basePrompt },
            { inlineData: { data: imageParts.data, mimeType: imageParts.mimeType } },
            { text: maskCaption },
            { inlineData: { data: maskParts.data, mimeType: 'image/png' } },
            ...referenceParts,
            ...(operation === 'add'
              ? [
                  {
                    text: 'Last checks: (1) Object strictly inside the bright mask only. (2) Pixels outside the mask unchanged. (3) No white/gray studio card behind the object. (4) Floor/rug texture continues naturally under the base — no rug-to-tile swap. (5) No halo, ghost edge, or duplicated floor pattern at the mask boundary. (6) Contact shadow + speculars match the room’s existing light. (7) Full 3D integration — not a pasted flat cutout. (8) If a reference product image was supplied: only that selected item — no extra objects, duplicates, or invented accessories.',
                  },
                ]
              : operation === 'replace'
                ? [
                    {
                      text: 'Final checks (replace): (1) Inside the white mask there is exactly one subject — no old furniture still visible behind or beside a new copy. (2) No additive layering or pasted cutout on top of the original. (3) Photoreal blend with room light; black mask pixels unchanged.',
                    },
                  ]
                : []),
            ...(extraText ? [{ text: extraText }] : []),
          ],
        },
      ],
      generationConfig: { temperature: 0 },
    })

  try {
    const callModel = async (extraText?: string): Promise<{ imageUrl: string | null; error?: string; status?: number }> => {
      const body = buildBody(extraText)
      const res = await fetchGemini(
        url,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body },
        resolveGeminiImageTimeoutMs()
      )

      if (!res.ok) {
        const errText = await res.text()
        return { imageUrl: null, error: errText || res.statusText, status: res.status }
      }

      const data = (await res.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{ inlineData?: { data: string; mimeType?: string } }>
          }
        }>
      }
      const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)
      if (!part?.inlineData?.data) {
        return { imageUrl: null, error: 'Image model did not return image data', status: 502 }
      }
      const mime = part.inlineData.mimeType || 'image/png'
      return { imageUrl: toDataUrl(mime, part.inlineData.data) }
    }

    const first = await callModel()
    if (!first.imageUrl) {
      return { ok: false, error: first.error || 'Image generation failed', status: first.status || 502 }
    }

    if (operation === 'replace' || operation === 'edit' || operation === 'add') {
      const processMaskedOutput = async (rawOutputUrl: string): Promise<string> => {
        // Soft-edge compositing prevents visible split lines at mask boundary.
        const composited = await compositeAddOutputOntoSource(rawOutputUrl, imageDataUrl, maskDataUrl, {
          hardMask: false,
        })
        return composited ?? rawOutputUrl
      }

      let workingUrl = await processMaskedOutput(first.imageUrl)
      let replaceChange = await maskedRegionMeanAbsDiff(imageDataUrl, workingUrl, maskDataUrl)
      let addChange =
        operation === 'add'
          ? await maskedRegionMeanAbsDiff(imageDataUrl, workingUrl, maskDataUrl)
          : { mean: 0, corePixels: 0 }
      let addFootprint =
        operation === 'add'
          ? await maskedChangedFootprint(imageDataUrl, workingUrl, maskDataUrl)
          : { changedRatio: 0, bboxAreaRatio: 0, changedPixels: 0, maskPixels: 0 }

      if (operation === 'replace' && replaceChange.corePixels >= REPLACE_MIN_CORE_PIXELS && replaceChange.mean < REPLACE_MIN_MEAN_ABS_DIFF) {
        const retry = await callModel(
          'RETRY FIX REQUIRED: replacement is incomplete. Fully delete old object pixels inside the white mask and render only the new subject there. No old subject remnants, no overlap, no blend/ghost. White mask area must clearly change to one coherent replacement; black mask must remain identical to source.'
        )
        if (retry.imageUrl) {
          workingUrl = await processMaskedOutput(retry.imageUrl)
          replaceChange = await maskedRegionMeanAbsDiff(imageDataUrl, workingUrl, maskDataUrl)
        }
      }

      // Add-mode quality gate: reject tiny/weak edits and reject "whole-box repaint" slabs.
      if (operation === 'add') {
        const tooLittleAddChange =
          addChange.corePixels >= ADD_MIN_CORE_PIXELS && addChange.mean < ADD_MIN_MEAN_ABS_DIFF
        const addTooSmall = addFootprint.maskPixels >= 1200 && addFootprint.changedRatio < 0.05
        const addTooBroad = addFootprint.maskPixels >= 1200 && addFootprint.changedRatio > 0.56
        if (tooLittleAddChange || addTooSmall || addTooBroad) {
          const retry = await callModel(
            addTooBroad
              ? 'RETRY FIX REQUIRED: previous output repainted too much of the selected box. Add only one object; do not flood-fill the rectangle. Preserve floor/window/door details anywhere not physically occluded by the new object.'
              : 'RETRY FIX REQUIRED: added object is too weak/partial. Place one clearly visible full 3D object inside the white mask with proper perspective and contact shadows, while preserving surrounding room details.'
          )
          if (retry.imageUrl) {
            workingUrl = await processMaskedOutput(retry.imageUrl)
            addChange = await maskedRegionMeanAbsDiff(imageDataUrl, workingUrl, maskDataUrl)
            addFootprint = await maskedChangedFootprint(imageDataUrl, workingUrl, maskDataUrl)
          }
        }
      }

      // Replace/edit can also return a "catalog card" style white rectangle artifact.
      const artifact = await hasAddWhiteBackgroundArtifact(workingUrl, imageDataUrl, maskDataUrl)
      const flatCard = await hasFlatCardArtifact(workingUrl, maskDataUrl)
      const addMaskedVar =
        operation === 'add'
          ? await maskedRegionLumaVariance(workingUrl, maskDataUrl)
          : null
      const addLooksLikeFlatBillboard =
        operation === 'add' &&
        addMaskedVar !== null &&
        addMaskedVar < ADD_MASKED_LUMA_VARIANCE_RETRY_BELOW
      if (artifact || flatCard || addLooksLikeFlatBillboard) {
        const retry = await callModel(
          artifact || flatCard
            ? 'RETRY FIX REQUIRED: previous output looks like a pasted product card / sticker (flat, near-uniform patch) in the masked area. Repaint the region photorealistically in-scene with NO white/gray studio backdrop, NO flat cutout, and NO rectangular panel. Keep all pixels outside the black/unchanged mask identical to the first image.'
            : 'RETRY FIX REQUIRED — MASKED ZONE STILL “POSTER BOARD”: The editable region lacks real scene texture—it reads as one flat tinted layer instead of wallpaper/floor glazing/door daylight continuing behind and between furniture silhouette. Fully re-render INSIDE WHITE ONLY: reconstruct the SAME floor pattern and grout/reflection continuity under legs and skirts; barred windows/transom/door openings keep real transparency and grille geometry where visible; upholstered pieces get real 3D volume, shading, tufted seams, shadows—NOT uniform paint over the rectangle. Forbidden: billboard fill, solid color card over tiling or glazing. Black mask untouched.'
        )
        if (retry.imageUrl) {
          const retried = await processMaskedOutput(retry.imageUrl)
          workingUrl = await cleanAddWhiteArtifactPixels(retried, imageDataUrl, maskDataUrl)
        } else {
          workingUrl = await cleanAddWhiteArtifactPixels(workingUrl, imageDataUrl, maskDataUrl)
        }
      }

      // Add-only second pass when texture still collapses after first retry bucket.
      if (operation === 'add') {
        const v = await maskedRegionLumaVariance(workingUrl, maskDataUrl)
        if (v !== null && v < ADD_MASKED_LUMA_VARIANCE_RETRY_BELOW) {
          const second = await callModel(
            'SECOND RETRY — STILL FAILING QUALITY GATE: Visible floor tile/circle grout pattern, doorway outdoor light, and window bars MUST match first-image reality anywhere they show through—not one flat tinted rectangle. Couch volumes only where fabric exists; carve negative space/light paths. Seamless photographic integration.'
          )
          if (second.imageUrl) {
            workingUrl = await cleanAddWhiteArtifactPixels(
              await processMaskedOutput(second.imageUrl),
              imageDataUrl,
              maskDataUrl
            )
          }
        }
      }

      // Always run a final white-card cleanup pass for replace/edit before returning.
      const finalClean = await cleanAddWhiteArtifactPixels(workingUrl, imageDataUrl, maskDataUrl)
      return { ok: true, imageUrl: finalClean }
    }

    if (operation === 'erase') {
      const composited = await compositeAddOutputOntoSource(first.imageUrl, imageDataUrl, maskDataUrl, {
        hardMask: true,
      })
      return { ok: true, imageUrl: composited ?? first.imageUrl }
    }

    return { ok: true, imageUrl: first.imageUrl }
  } catch (err) {
    const aborted =
      err instanceof Error &&
      (err.name === 'AbortError' || /aborted|AbortError/i.test(err.message))
    if (aborted) {
      return {
        ok: false,
        error:
          'Image generation timed out before the model finished. Try again, or use a smaller room image. On slow networks or heavy models, set GEMINI_IMAGE_TIMEOUT_MS in .env.local (e.g. 360000).',
        status: 504,
      }
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Inpainting failed',
      status: 500,
    }
  }
}
