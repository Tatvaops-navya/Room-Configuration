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

const GEMINI_INPAINT_TRANSIENT_HTTP = new Set([429, 503])

function normalizeGeminiModelId(model: string): string {
  return model.replace(/^models\//, '').trim()
}

/** Flash / image-generation ids need modalities or the API returns text-only. */
function inpaintGenerationConfig(model: string): { temperature: number; responseModalities?: string[] } {
  const m = normalizeGeminiModelId(model).toLowerCase()
  const needsModalities =
    m.includes('flash-image') || m.includes('image-generation') || m === 'gemini-2.5-flash-image'
  if (needsModalities) return { temperature: 0, responseModalities: ['TEXT', 'IMAGE'] }
  return { temperature: 0 }
}

function resolveInpaintFallbackModel(primary: string): string | null {
  const configured = process.env.GEMINI_FALLBACK_IMAGE_MODEL?.trim()
  const defaultFb = 'gemini-3.1-flash-image-preview'
  const candidate = normalizeGeminiModelId(configured || defaultFb)
  const p = normalizeGeminiModelId(primary)
  if (!candidate || candidate === p) return null
  return candidate
}

function sleepMs(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
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
  options?: {
    hardMask?: boolean
    /**
     * Add-object: default composite pulls toward source at soft-mask edges (pow 1.55), which can
     * clip arms/cushions at the capture rectangle. Use a gentler curve so the full silhouette survives feathered masks.
     */
    preserveAddSilhouette?: boolean
    /** If set, overrides gamma in Math.pow(maskLuma, gamma) for soft masks (default 1.55, or 1.12 when preserveAdd). */
    edgeBlendGamma?: number
    /** Upper luma bound for soft-mask ramp (default 0.9). Higher = model output dominates sooner at feathered edges. */
    blendSoftHigh?: number
    /**
     * Mask luma at or above this (0–1) uses 100% model output — prevents source ghosting through
     * the interior of a feathered capture box. Only pixels below this blend at the edge band.
     */
    interiorFullStrengthLuma?: number
  }
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
    const preserveAdd = !!options?.preserveAddSilhouette
    const gamma =
      typeof options?.edgeBlendGamma === 'number' && options.edgeBlendGamma > 0
        ? options.edgeBlendGamma
        : preserveAdd
          ? 1.12
          : 1.55
    /**
     * Soft masks: remap mask luma into a narrow blend band so the interior is full model output.
     * Raw pow(luma, γ) leaves a wide “double exposure” strip — reads as a milky rectangle on warm walls / glossy floors.
     */
    const softLow = 0.05
    const softHigh =
      typeof options?.blendSoftHigh === 'number' && options.blendSoftHigh > softLow && options.blendSoftHigh <= 1
        ? options.blendSoftHigh
        : 0.9
    const interiorFull =
      typeof options?.interiorFullStrengthLuma === 'number' &&
      options.interiorFullStrengthLuma >= 0 &&
      options.interiorFullStrengthLuma <= 1
        ? options.interiorFullStrengthLuma
        : null
    const compositeAlpha = (luma01: number) => {
      const t = Math.max(0, Math.min(1, luma01))
      if (hardMask) return t >= 0.5 ? 1 : 0
      if (interiorFull != null && t >= interiorFull) return 1
      if (t <= softLow) return 0
      if (t >= softHigh) return 1
      const u = (t - softLow) / (softHigh - softLow)
      return Math.pow(Math.max(0, Math.min(1, u)), gamma)
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
const ERASE_MIN_MEAN_ABS_DIFF = 12
const REPLACE_MIN_CORE_PIXELS = 400
const REPLACE_MIN_MEAN_ABS_DIFF = 10
const MASK_VARIANCE_SAMPLE_MIN = 400
/** Slabs over tiling + glazing often collapse global luma variance in mask; plush objects usually stay above ~46. */
const ADD_MASKED_LUMA_VARIANCE_RETRY_BELOW = 46

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
          outLuma >= 200 &&
          spread <= 32 &&
          outLuma - srcLuma >= 16 &&
          !(sr >= 228 && sg >= 228 && sb >= 228)
        if (suspicious) rowSuspicious[y]++
      }
    }

    if (maxY < minY) return false
    const span = maxY - minY + 1
    const lowerStart = Math.max(minY, minY + Math.floor(span * 0.28))
    let suspiciousRows = 0
    let suspiciousPixels = 0
    for (let y = lowerStart; y <= maxY; y++) {
      const masked = rowMasked[y]
      if (masked < 24) continue
      const ratio = rowSuspicious[y] / masked
      if (ratio >= 0.28) {
        suspiciousRows++
        suspiciousPixels += rowSuspicious[y]
      }
    }
    return suspiciousRows >= 4 && suspiciousPixels >= 420
  } catch {
    return false
  }
}

/**
 * Detect “sticker on glass” ghosting: most of the white mask still matches the source photo
 * (window/floor visible through the capture rectangle) while only the object center changed.
 */
async function hasAddSourceGhostingArtifact(
  sourceDataUrl: string,
  outputDataUrl: string,
  maskDataUrl: string
): Promise<boolean> {
  try {
    const src = parseDataUrl(sourceDataUrl)
    const out = parseDataUrl(outputDataUrl)
    const mask = parseDataUrl(maskDataUrl)
    if (!src || !out || !mask) return false

    const srcBuf = Buffer.from(src.data, 'base64')
    const outBuf = Buffer.from(out.data, 'base64')
    const maskBuf = Buffer.from(mask.data, 'base64')

    const meta = await sharp(srcBuf).metadata()
    const width = meta.width ?? 0
    const height = meta.height ?? 0
    if (width <= 0 || height <= 0) return false

    const srcRaw = await sharp(srcBuf).resize(width, height).removeAlpha().raw().toBuffer()
    const outRaw = await sharp(outBuf).resize(width, height).removeAlpha().raw().toBuffer()
    const maskRaw = await sharp(maskBuf).resize(width, height).removeAlpha().raw().toBuffer()

    let corePixels = 0
    let unchangedPixels = 0
    const pixels = width * height
    for (let p = 0; p < pixels; p++) {
      const i = p * 3
      const ml = (maskRaw[i] + maskRaw[i + 1] + maskRaw[i + 2]) / 3
      if (ml < 185) continue
      corePixels++
      const diff =
        Math.abs(srcRaw[i] - outRaw[i]) +
        Math.abs(srcRaw[i + 1] - outRaw[i + 1]) +
        Math.abs(srcRaw[i + 2] - outRaw[i + 2])
      if (diff < 24) unchangedPixels++
    }
    if (corePixels < 600) return false
    return unchangedPixels / corePixels >= 0.32
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
          outLuma >= 200 &&
          spread <= 32 &&
          outLuma - srcLuma >= 16 &&
          !(sr >= 228 && sg >= 228 && sb >= 228)
        ) {
          rowSuspicious[y]++
        }
      }
    }

    const suspiciousRows = new Uint8Array(height)
    if (maxY >= minY) {
      const span = maxY - minY + 1
      const lowerStart = Math.max(minY, minY + Math.floor(span * 0.28))
      for (let y = lowerStart; y <= maxY; y++) {
        const masked = rowMasked[y]
        if (masked < 24) continue
        if (rowSuspicious[y] / masked >= 0.28) suspiciousRows[y] = 1
      }
    }

    const verticalMaskSpan = maxY >= minY ? maxY - minY + 1 : 1
    /** Include mid/lower mask so under-furniture “white cast” on glossy floors is healed (not only bottom rows). */
    const lowerBandStart = minY + Math.floor(verticalMaskSpan * 0.1)

    let changed = 0
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const p = y * width + x
        const i = p * 3
        const maskLuma = (maskRaw[i] + maskRaw[i + 1] + maskRaw[i + 2]) / 3
        if (maskLuma < 168) continue

        const or = outRaw[i]
        const og = outRaw[i + 1]
        const ob = outRaw[i + 2]
        const sr = srcRaw[i]
        const sg = srcRaw[i + 1]
        const sb = srcRaw[i + 2]
        const outLuma = (or + og + ob) / 3
        const srcLuma = (sr + sg + sb) / 3
        const spread = Math.max(or, og, ob) - Math.min(or, og, ob)
        const srcSpread = Math.max(sr, sg, sb) - Math.min(sr, sg, sb)
        const inLowerMaskBand = maxY >= minY && y >= lowerBandStart && y <= maxY

        /** Cream/off-white slabs (not RGB 234+): glossy floors still read as lifted flat paste. */
        const slabTooFlatVersusSource =
          srcSpread >= 20 && spread < srcSpread - 6 && spread <= 44
        /** Require real brightening vs source (or strong flattening + lift) so gold/metal legs are not restored to floor. */
        const brightOrFlattenedSlab =
          outLuma >= srcLuma + 8 ||
          (slabTooFlatVersusSource && spread <= 34 && outLuma >= srcLuma + 6) ||
          (outLuma >= srcLuma + 3 && spread <= 36 && spread < srcSpread - 10)
        const outLooksLiftedPale =
          outLuma >= 206 &&
          spread <= 50 &&
          (or >= 198 && og >= 198 && ob >= 198) &&
          brightOrFlattenedSlab
        const srcHasFloorDetail = srcSpread >= 16 && !(sr >= 244 && sg >= 244 && sb >= 244 && srcSpread <= 14)
        const brightSlabOverTexturedFloor =
          inLowerMaskBand &&
          maskLuma >= 175 &&
          srcHasFloorDetail &&
          outLooksLiftedPale

        /** Milky / lifted patch on glossy tile under furniture (moderate brightening vs source). */
        const milkyLiftOnGlossyFloor =
          inLowerMaskBand &&
          maskLuma >= 185 &&
          srcHasFloorDetail &&
          srcSpread >= 18 &&
          outLuma >= 198 &&
          outLuma >= srcLuma + 9 &&
          spread <= 46 &&
          spread <= srcSpread - 3

        const outIsWhitePatch = or >= 234 && og >= 234 && ob >= 234
        const creamWhitePatch =
          or >= 222 && og >= 222 && ob >= 222 && outLuma >= 223 && spread <= 36 && outLuma >= srcLuma + 3
        const srcIsNotWhite = !(sr >= 236 && sg >= 236 && sb >= 236)
        const suspiciousStudioFloorPixel =
          suspiciousRows[y] === 1 &&
          outLuma >= 198 &&
          spread <= 34 &&
          outLuma - srcLuma >= 14 &&
          !(sr >= 228 && sg >= 228 && sb >= 228)
        /**
         * Only strip *true* near-white mat pixels in the feather ring. Loose luma thresholds were
         * restoring floor tiles onto light beige sofa cushions / seat decks (half-sofa look).
         */
        const maskLumaForPixel = maskLuma
        const inFeatherOrSoftEdge = maskLumaForPixel >= 28 && maskLumaForPixel <= 235
        /** Full-strength mask core: near-white output vs chromatic room backdrop (wall/tile) = pasted halo, not cushion. */
        const inCoreWhiteOnChromaticBackdrop =
          maskLumaForPixel >= 236 &&
          srcSpread >= 18 &&
          !(sr >= 236 && sg >= 236 && sb >= 236) &&
          outLuma - srcLuma >= 20
        /** Pale halo in mask core on saturated wall/window — only clearly lifted near-white fringes. */
        const corePaleHaloOnColoredBackdrop =
          maskLumaForPixel >= 225 &&
          srcSpread >= 22 &&
          !(sr >= 236 && sg >= 236 && sb >= 236) &&
          or >= 228 &&
          og >= 228 &&
          ob >= 228 &&
          spread <= 28 &&
          outLuma >= 228 &&
          outLuma - srcLuma >= 14
        /** Lifted low-chroma “plate” on saturated walls/floor (common add-object box), without matching upholstery texture. */
        const milkyLowChromaPlateOnChromatic =
          maskLumaForPixel >= 218 &&
          srcSpread >= 26 &&
          spread <= 38 &&
          spread < srcSpread - 8 &&
          outLuma >= srcLuma + 14 &&
          outLuma >= 212 &&
          !(sr >= 236 && sg >= 236 && sb >= 236)
        const outIsNearWhiteRgb = or >= 232 && og >= 232 && ob >= 232
        const outIsPaleFringeRgb = or >= 216 && og >= 216 && ob >= 216
        const featherWhiteHalo =
          (inFeatherOrSoftEdge || inCoreWhiteOnChromaticBackdrop) &&
          outIsNearWhiteRgb &&
          outLuma >= 226 &&
          spread <= 24 &&
          srcLuma <= 238 &&
          outLuma - srcLuma >= 14 &&
          !(sr >= 232 && sg >= 232 && sb >= 232)
        /** Softer “cream” halos on textured rug/floor (missed by strict 232+ RGB gate). Tight luma delta so light upholstery is not replaced by rug. */
        const featherPaleFringeOnTexture =
          inFeatherOrSoftEdge &&
          outIsPaleFringeRgb &&
          spread <= 22 &&
          srcHasFloorDetail &&
          srcLuma <= 228 &&
          outLuma >= 220 &&
          outLuma - srcLuma >= 14 &&
          !(sr >= 232 && sg >= 232 && sb >= 232)

        /**
         * Full-white mask core on rug/floor: model sometimes leaves 1–3px pale “card” lines or halos
         * that featherWhiteHalo misses (mask luma 255). Only neutral near-white vs textured source.
         */
        const coreMaskNeutralBrightSeam =
          maskLuma >= 218 &&
          srcHasFloorDetail &&
          srcLuma <= 232 &&
          or >= 216 &&
          og >= 216 &&
          ob >= 216 &&
          spread <= 32 &&
          outLuma >= 216 &&
          outLuma - srcLuma >= 8 &&
          !(sr >= 232 && sg >= 232 && sb >= 232)

        const healCoreOrFeatherFloor =
          (maskLuma >= 218 &&
            ((outIsWhitePatch && srcIsNotWhite) ||
              suspiciousStudioFloorPixel ||
              (creamWhitePatch && srcHasFloorDetail && maskLuma >= 210))) ||
          (brightSlabOverTexturedFloor && maskLuma >= 168) ||
          (milkyLiftOnGlossyFloor && maskLuma >= 165)

        if (
          healCoreOrFeatherFloor ||
          featherWhiteHalo ||
          featherPaleFringeOnTexture ||
          coreMaskNeutralBrightSeam ||
          corePaleHaloOnColoredBackdrop ||
          milkyLowChromaPlateOnChromatic
        ) {
          outRaw[i] = sr
          outRaw[i + 1] = sg
          outRaw[i + 2] = sb
          changed++
        }
      }
    }

    // Matte white/Gray fringe around pasted objects: pull toward nearby real object colors (5×5, softer gates than before).
    const snap = Buffer.from(outRaw)
    const rNei = 2
    for (let y = rNei; y < height - rNei; y++) {
      for (let x = rNei; x < width - rNei; x++) {
        const i = (y * width + x) * 3
        const maskLuma = (maskRaw[i] + maskRaw[i + 1] + maskRaw[i + 2]) / 3
        if (maskLuma < 95) continue

        const or = snap[i]
        const og = snap[i + 1]
        const ob = snap[i + 2]
        const outLuma = (or + og + ob) / 3
        const spreadOut = Math.max(or, og, ob) - Math.min(or, og, ob)
        if (outLuma < 200 || spreadOut > 40) continue

        let rr = 0
        let gg = 0
        let bb = 0
        let nClr = 0
        let strong = 0
        for (let dy = -rNei; dy <= rNei; dy++) {
          for (let dx = -rNei; dx <= rNei; dx++) {
            if (dx === 0 && dy === 0) continue
            const xi = x + dx
            const yi = y + dy
            const j = (yi * width + xi) * 3
            const mjl = (maskRaw[j] + maskRaw[j + 1] + maskRaw[j + 2]) / 3
            if (mjl < 72) continue
            const jr = snap[j]
            const jg = snap[j + 1]
            const jb = snap[j + 2]
            const jlum = (jr + jg + jb) / 3
            const jspread = Math.max(jr, jg, jb) - Math.min(jr, jg, jb)
            const darkerThanHalo = jlum <= 224 && jlum <= outLuma + 42
            if (jspread > 7 && jlum <= 234 && darkerThanHalo) {
              rr += jr
              gg += jg
              bb += jb
              nClr++
              if (jlum <= 208 || jspread >= 26) strong++
            }
          }
        }
        if (!nClr) continue
        if (strong < 1 && !(nClr >= 4 && outLuma >= 226)) continue
        const ar = rr / nClr
        const ag = gg / nClr
        const ab = bb / nClr
        const t = Math.min(0.94, strong >= 2 ? 0.92 : nClr >= 10 ? 0.86 : 0.8)
        outRaw[i] = Math.round(or * (1 - t) + ar * t)
        outRaw[i + 1] = Math.round(og * (1 - t) + ag * t)
        outRaw[i + 2] = Math.round(ob * (1 - t) + ab * t)
        changed++
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
  /** Optional catalog / product image (data URL) for edit (e.g. Add Object via `/api/add`) and replace. */
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
  const hasCatalogReference =
    (operation === 'replace' || operation === 'edit' || operation === 'add') &&
    !!referenceImageDataUrl?.trim()

  if (hasCatalogReference) {
    const refParsed = parseDataUrl(referenceImageDataUrl!.trim())
    if (refParsed) {
      referenceParts.push({
        text:
          operation === 'replace'
            ? 'REFERENCE — USER-SELECTED CATALOG ITEM FOR REPLACE (strict): The next image is the exact product the user chose. In the white masked region, fully remove old content and render ONLY this selected item in-scene (same design, silhouette, parts, materials, and colors). IMPORTANT: ignore plain/white/neutral reference backgrounds; use object pixels only. FORBIDDEN: pasted catalog card, white/gray rectangle, sticker-like cutout, or additive layering over old object. Output must be a true photoreal replacement integrated with room lighting/perspective and floor/rug continuity.'
            : operation === 'add'
              ? 'REFERENCE — USER-SELECTED CATALOG ITEM FOR ADD (strict): The next image is the exact product to place in the white masked region of the FIRST room photo. Reproduce that item only (same design, silhouette, parts, materials, colors). Ignore plain/white/neutral reference backgrounds — object pixels only. FORBIDDEN: pasted catalog card, sticker cutout, milky floor smear, or studio slab under the piece. Integrate in 3D with the FIRST image’s real floor tiles/grout/reflections and room lighting; one natural contact shadow on the existing floor plane.'
              : 'REFERENCE — USER-SELECTED CATALOG ITEM (strict): The next image is the exact product or tile the user chose. Reproduce only that item inside the bright masked region of the FIRST room photograph: same design, shape, number of parts, materials, and colors — not a different SKU and not a “similar” or upgraded alternative. For sofas/chairs/beds: preserve the full width and both sides of the piece in-scene (scale down if needed) — never crop one arm or half the seating. IMPORTANT: treat any plain/white/neutral background in the reference as non-object pixels to ignore; extract and use ONLY the object itself (its silhouette + materials). Do not add companion objects, extra accessories, plants, additional lamps, side tables, duplicate units, or decorative groupings unless they are clearly part of the same single product in the reference (e.g. a photographed set). For wall/floor tile references, match that pattern only — no extra borders or mixed patterns. Re-render in the room’s camera angle, perspective, scale, and lighting — fully integrated in 3D with correct contact shadow and floor/rug continuity. Do not paste the reference as a flat layer; do not output a white or gray studio card behind it; the result must look photographed in the same scene as the room. CRITICAL: the floor plane under the object must continue the FIRST image’s real floor (tiles/reflections/grout)—never substitute the reference photo’s studio floor, a gray mat, or a flipped copy of the product as the floor reflection.',
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

  /** Masked inpaint preamble for edit and for Add Object (routed as edit via `/api/add`). */
  const maskedEditInpaintIntro =
    `${DESIGN_CONTEXT}${NO_LOGO}INPAINTING TASK: You are given two images. The FIRST image is the room. The SECOND image is a binary mask (white = region to modify, black = keep unchanged). Modify ONLY the white region according to the user's instructions. Do not change anything outside the white region. Preserve the exact same image dimensions, framing, and all unchanged pixels. No text or labels in the output.`

  const basePrompt =
    operation === 'erase'
      ? `${DESIGN_CONTEXT}${NO_LOGO}INPAINTING TASK: You are given two images. The FIRST image is the room. The SECOND image is a binary mask (white = region to remove, black = keep). Your output must be a single image that is identical to the first image except: the area that was white in the mask must be completely removed and seamlessly filled with the surrounding background (floor, wall, ceiling, furniture, etc.) so it looks natural, as if that object or area was never there. Do not change anything outside the white region. Preserve the exact same image dimensions, framing, and all unchanged pixels. No text or labels in the output.

ERASE — COMPLETE REMOVAL (MANDATORY): Inside white only, remove the entire subject — including thin parts (chains, rods, cords, frames, bulbs), cast shadows on adjacent surfaces, specular highlights, glow/halos, and reflections on glossy floors or glass. Inpaint only a plausible continuation of the real background (same wallpaper, paint, plaster, tiles, wood grain, outdoor view through windows) with matching noise, color temperature, and perspective. Do not leave ghost geometry, semitransparent remnants, or a flat white/gray patch. Do not add new objects or decor.${userPrompt?.trim() ? `\n\nAdditional focus: ${userPrompt.trim()}` : ''}`
      : operation === 'add'
        ? `${maskedEditInpaintIntro}

ADD OBJECT — IN-SCENE PLACEMENT (NOT A STICKER): Place exactly one new subject inside the white mask. Fully repaint the ENTIRE white region as one coherent photograph — not a cutout pasted on top of the unchanged background. The old window/floor/wall pixels inside the mask must be replaced, not left visible through the object. Fully opaque 3D form with correct perspective, scale, and lighting direction.

FLOOR & REFLECTIONS (MANDATORY): Where the floor is visible inside the mask, continue the SAME tile/grout/pattern, specular highlights, and perspective as the rest of the photograph. One natural contact shadow under the object (darker than the floor, not a white/gray smear or horizontal blur band). On glossy floors, reflections must follow the room’s existing reflection geometry — no milky haze, no studio slab, no smeared mirror blob under the piece.

EDGES & INTEGRATION: Crisp material boundaries against walls, window bars, and glass. No foggy “sticker” edge, no semitransparent blend, no pale halo following the mask rectangle. Do not repaint unrelated background as a flat color card.

${hasCatalogReference ? `Use the reference image for the object’s design only — never paste its studio floor or white backdrop into the room.

` : ''}
User instructions: ${userPrompt || 'Add one suitable object naturally in the selected area.'}`
      : operation === 'edit'
        ? `${maskedEditInpaintIntro}

Output integration: the new or edited subject must read as one **fully opaque, solid** piece of furniture or decor—no semitransparent edge, no foggy or milky blend band, no “sticker” softness against walls, window bars, or glass. Silhouettes against window grilles and frames must be crisp where geometry is sharp. Where the object meets floor or rug: one coherent soft contact shadow (darker than the floor, not a white or gray lifted haze); glossy floors keep the same tile grid and reflection law as the rest of the room—no smeared mirror blob. Avoid pale halos at any boundary.

${hasCatalogReference ? `CATALOG / ADD OBJECT — HARD CONSTRAINTS: Do not output any pale rectangle, lifted-brightness panel, or “studio card” that follows the mask outline—especially on terracotta, plaster, tile, or glossy floors. The floor under the piece must be the SAME real floor as the rest of the photo (continuous grout, specular highlights, perspective); reflections must plausibly include the new object’s color and volume—not an empty-room mirror. No white or cream halo framing the furniture; object edges must be photoreal against the backdrop.

` : ''}
User instructions: ${userPrompt || 'Restyle the selected region to match the room style.'}`
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
    operation === 'replace'
      ? 'Mask: white = region to fully repaint. Remove old content there completely — single layer, no stacked objects. Black = unchanged pixels.'
      : operation === 'erase'
        ? 'Mask: white = remove everything here and inpaint seamless background only. Black = unchanged pixels identical to first image.'
        : operation === 'add'
          ? 'Mask: white = place the new object here, integrated with existing floor/walls. Black = unchanged pixels identical to first image.'
          : 'Mask (white = region to modify):'

  const primaryModel = process.env.GEMINI_IMAGE_MODEL || 'gemini-3-pro-image-preview'

  const buildBody = (modelForConfig: string, extraText?: string) =>
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
            ...(operation === 'replace'
              ? [
                  {
                    text: 'Final checks (replace): (1) Inside the white mask there is exactly one subject — no old furniture still visible behind or beside a new copy. (2) No additive layering or pasted cutout on top of the original. (3) Photoreal blend with room light; black mask pixels unchanged.',
                  },
                ]
              : operation === 'add'
                ? [
                    {
                      text: 'Final checks (add): (1) Exactly one new object inside white. (2) Floor tiles/grout/reflections match the first image — no milky smear or studio slab. (3) Natural contact shadow; black mask pixels unchanged.',
                    },
                  ]
                : []),
            ...(extraText ? [{ text: extraText }] : []),
          ],
        },
      ],
      generationConfig: inpaintGenerationConfig(modelForConfig),
    })

  try {
    const callGeminiInpaintOnce = async (
      modelName: string,
      extraText?: string
    ): Promise<{ imageUrl: string | null; error?: string; status?: number }> => {
      const m = normalizeGeminiModelId(modelName)
      const body = buildBody(m, extraText)
      const res = await fetchGemini(
        `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`,
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

    const callModel = async (extraText?: string): Promise<{ imageUrl: string | null; error?: string; status?: number }> => {
      let last: { imageUrl: string | null; error?: string; status?: number } = {
        imageUrl: null,
        error: 'Image generation failed',
        status: 502,
      }
      const primaryAttempts = 3
      for (let a = 0; a < primaryAttempts; a++) {
        const r = await callGeminiInpaintOnce(primaryModel, extraText)
        if (r.imageUrl) return r
        last = r
        const st = r.status ?? 0
        if (GEMINI_INPAINT_TRANSIENT_HTTP.has(st) && a < primaryAttempts - 1) {
          console.warn(`Gemini inpaint HTTP ${st} (model ${normalizeGeminiModelId(primaryModel)}), retry ${a + 2}/${primaryAttempts}…`)
          await sleepMs(1200 * (a + 1))
          continue
        }
        break
      }
      const fb = resolveInpaintFallbackModel(primaryModel)
      const st = last.status ?? 0
      if (fb && (GEMINI_INPAINT_TRANSIENT_HTTP.has(st) || st === 502)) {
        console.warn(`Gemini inpaint: primary failed (${st}), trying fallback ${fb}.`)
        for (let a = 0; a < 2; a++) {
          const r = await callGeminiInpaintOnce(fb, extraText)
          if (r.imageUrl) return r
          last = r
          const st2 = r.status ?? 0
          if (GEMINI_INPAINT_TRANSIENT_HTTP.has(st2) && a < 1) {
            await sleepMs(2000)
            continue
          }
          break
        }
      }
      return last
    }

    const first = await callModel()
    if (!first.imageUrl) {
      return { ok: false, error: first.error || 'Image generation failed', status: first.status || 502 }
    }

    if (operation === 'replace' || operation === 'edit' || operation === 'add') {
      const isAdd = operation === 'add'
      const processMaskedOutput = async (rawOutputUrl: string): Promise<string> => {
        const composited = await compositeAddOutputOntoSource(rawOutputUrl, imageDataUrl, maskDataUrl, {
          hardMask: false,
          preserveAddSilhouette: false,
          edgeBlendGamma: isAdd ? 1.38 : 1.42,
          blendSoftHigh: isAdd ? 0.9 : undefined,
          /** Mask interior = full model output; only the outer feather band blends (avoids rectangular ghosting). */
          interiorFullStrengthLuma: isAdd ? 0.36 : undefined,
        })
        return composited ?? rawOutputUrl
      }

      let workingUrl = await processMaskedOutput(first.imageUrl)
      let replaceChange = await maskedRegionMeanAbsDiff(imageDataUrl, workingUrl, maskDataUrl)

      if (operation === 'replace' && replaceChange.corePixels >= REPLACE_MIN_CORE_PIXELS && replaceChange.mean < REPLACE_MIN_MEAN_ABS_DIFF) {
        const retry = await callModel(
          'RETRY FIX REQUIRED: replacement is incomplete. Fully delete old object pixels inside the white mask and render only the new subject there. No old subject remnants, no overlap, no blend/ghost. White mask area must clearly change to one coherent replacement; black mask must remain identical to source.'
        )
        if (retry.imageUrl) {
          workingUrl = await processMaskedOutput(retry.imageUrl)
          replaceChange = await maskedRegionMeanAbsDiff(imageDataUrl, workingUrl, maskDataUrl)
        }
      }

      const artifact = await hasAddWhiteBackgroundArtifact(workingUrl, imageDataUrl, maskDataUrl)
      const flatCard = await hasFlatCardArtifact(workingUrl, maskDataUrl)
      const studioFloorSlab = await hasAddStudioFloorArtifact(workingUrl, imageDataUrl, maskDataUrl)
      const maskedLumVar = await maskedRegionLumaVariance(workingUrl, maskDataUrl)
      const maskedLooksLikeFlatBillboard =
        maskedLumVar !== null && maskedLumVar < ADD_MASKED_LUMA_VARIANCE_RETRY_BELOW
      const sourceGhosting =
        isAdd && (await hasAddSourceGhostingArtifact(imageDataUrl, workingUrl, maskDataUrl))
      const runAddArtifactRetry =
        isAdd &&
        (artifact || flatCard || maskedLooksLikeFlatBillboard || studioFloorSlab || sourceGhosting)
      const runEditArtifactRetry =
        !isAdd && (artifact || flatCard || maskedLooksLikeFlatBillboard || studioFloorSlab)
      if (runAddArtifactRetry || runEditArtifactRetry) {
        const addGhostBoxRetry =
          'RETRY ADD — VISIBLE RECTANGLE / GHOSTING: Prior output left the original background visible inside the white mask (washed-out box, window bars through furniture, or sticker on unchanged scene). Fully regenerate the ENTIRE white mask as one integrated photograph: replace all background pixels there, then place the object with natural shadows. No semitransparent overlay, no unchanged scene showing through the capture area. Black mask unchanged.'
        const addFloorSmearRetry =
          'RETRY ADD — FLOOR SMEAR / STICKER: Prior output has a milky horizontal band, studio slab, or pasted-card look on the floor under the object. Repaint INSIDE WHITE ONLY: keep the FIRST image’s exact floor tile grid, grout, gloss, and reflection law; place one natural contact shadow; fully opaque object with crisp edges. No white/gray haze on tile, no sticker rectangle, no foggy blend at the silhouette. Black mask unchanged.'
        const genericArtifactRetry =
          'RETRY FIX REQUIRED: previous output looks like a pasted product card / sticker (flat, near-uniform patch) or has a visible white/light border around the object, or a wrong floor patch / mirror-flipped product reflection under it, or looks foggy/semitransparent at the silhouette. Repaint photorealistically in-scene with NO white/gray studio backdrop, NO flat cutout, NO rectangular panel, NO glowing outline at the mask edge, NO milky edge blend—fully opaque materials—and the SAME floor tiles and reflection geometry as the first image under the furniture. Keep all pixels outside the black/unchanged mask identical to the first image.'
        const posterBoardRetry =
          'RETRY FIX REQUIRED — MASKED ZONE STILL “POSTER BOARD”: The editable region lacks real scene texture—it reads as one flat tinted layer instead of wallpaper/floor glazing/door daylight continuing behind and between furniture silhouette. Fully re-render INSIDE WHITE ONLY: reconstruct the SAME floor pattern and grout/reflection continuity under legs and skirts; barred windows/transom/door openings keep real transparency and grille geometry where visible; upholstered pieces get real 3D volume, shading, tufted seams, shadows—NOT uniform paint over the rectangle. Forbidden: billboard fill, solid color card over tiling or glazing. Black mask untouched.'
        const retry = await callModel(
          isAdd && sourceGhosting
            ? addGhostBoxRetry
            : isAdd && studioFloorSlab
              ? addFloorSmearRetry
              : artifact || flatCard || studioFloorSlab
                ? genericArtifactRetry
                : posterBoardRetry
        )
        if (retry.imageUrl) {
          const retried = await processMaskedOutput(retry.imageUrl)
          workingUrl = isAdd
            ? retried
            : await cleanAddWhiteArtifactPixels(retried, imageDataUrl, maskDataUrl)
        } else if (!isAdd) {
          workingUrl = await cleanAddWhiteArtifactPixels(workingUrl, imageDataUrl, maskDataUrl)
        }
      }

      // Add-object: this heal step copies source pixels onto pale mask output and recreates rectangular ghosting.
      const finalClean = isAdd
        ? workingUrl
        : await cleanAddWhiteArtifactPixels(workingUrl, imageDataUrl, maskDataUrl)
      return { ok: true, imageUrl: finalClean }
    }

    if (operation === 'erase') {
      let eraseOut = first.imageUrl
      const eraseDiff = await maskedRegionMeanAbsDiff(imageDataUrl, eraseOut, maskDataUrl)
      if (
        eraseDiff.corePixels >= ADD_MIN_CORE_PIXELS &&
        eraseDiff.mean < ERASE_MIN_MEAN_ABS_DIFF
      ) {
        const retry = await callModel(
          'RETRY ERASE — INCOMPLETE: The white masked region still reads as containing the old subject, shadows, glow, wires, or reflections. Completely delete all of that and inpaint only natural wall/ceiling/floor/window continuation matching the rest of the photo. Black mask pixels must stay identical to the first image.'
        )
        if (retry.imageUrl) eraseOut = retry.imageUrl
      }
      const composited = await compositeAddOutputOntoSource(eraseOut, imageDataUrl, maskDataUrl, {
        hardMask: true,
      })
      return { ok: true, imageUrl: composited ?? eraseOut }
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
