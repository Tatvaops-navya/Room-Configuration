import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { buildPrompt, buildPromptSummary, getPaletteInstruction } from '@/app/utils/promptBuilder'
import { compositeAddOutputOntoSource } from '@/app/lib/server/geminiInpaintMask'

/** Timeouts for Gemini API (ms). Image generation can take 60–120+ seconds. */
const GEMINI_TEXT_TIMEOUT_MS = 120_000
const GEMINI_IMAGE_TIMEOUT_MS = 180_000
const GEMINI_RETRY_ATTEMPTS = 2
const GEMINI_RETRY_DELAY_MS = 3000
const DEFAULT_FALLBACK_IMAGE_MODEL = 'models/gemini-3.1-flash-preview'
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://internalconfigf.vercel.app',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  Vary: 'Origin',
}

function isRetryableNetworkError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message
    const cause = (err as Error & { cause?: { code?: string } }).cause
    const code = cause?.code
    return (
      msg.includes('fetch failed') ||
      msg.includes('Headers Timeout') ||
      msg.includes('UND_ERR_HEADERS_TIMEOUT') ||
      msg.includes('aborted') ||
      msg.includes('The operation was aborted') ||
      code === 'ECONNRESET' ||
      code === 'ETIMEDOUT' ||
      code === 'ECONNREFUSED' ||
      code === 'ABORT_ERR'
    )
  }
  return false
}

async function fetchGemini(
  url: string,
  options: RequestInit & { body: string },
  timeoutMs: number
): Promise<Response> {
  let lastError: unknown
  for (let attempt = 0; attempt <= GEMINI_RETRY_ATTEMPTS; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      return res
    } catch (err) {
      clearTimeout(timeoutId)
      lastError = err
      if (attempt < GEMINI_RETRY_ATTEMPTS && isRetryableNetworkError(err)) {
        console.warn(`Gemini request attempt ${attempt + 1} failed (${err instanceof Error ? err.message : err}). Retrying in ${GEMINI_RETRY_DELAY_MS}ms...`)
        await new Promise((r) => setTimeout(r, GEMINI_RETRY_DELAY_MS))
        continue
      }
      throw err
    }
  }
  throw lastError
}

// --- Guardrails to avoid safety filters, model limits, and input size issues ---
const DESIGN_CONTEXT_PREFIX =
  'Context: Professional interior/exterior design and room configuration visualization. All content is for design purposes only.\n\n'

/** Instructs the model to never add any text, names, or logos to the output. Only TatvaOps watermark is added by the app later. */
const NO_LOGO_INSTRUCTION =
  'CRITICAL – NO TEXT, LOGOS, OR NAMES IN OUTPUT: The generated image must contain ZERO text, ZERO logos, and ZERO brand names. Do NOT add or copy from reference images: no MYTYLES, no Mytyles, no brand logos, no product names, no tile names/codes (e.g. Code35087), no dimensions (e.g. 1200x2400mm), no finish names (e.g. Glossy, Matt), and no watermarks. Reference images (tiles, sofas) may contain logos or text – you must IGNORE those and use ONLY the visual appearance (pattern, color, texture, shape). Never draw or reproduce any logo or text from any reference. The output must be a clean visualization with zero text and zero logos; branding will be added by the application separately.'

/** Global output quality directive appended to generation prompts. */
const ULTRA_QUALITY_INSTRUCTION =
  'OUTPUT QUALITY REQUIREMENT: Produce an ultra-detailed, 4K-quality photoreal render with crisp edges, clean fine textures, realistic materials, accurate lighting/shadows, and no blur, smearing, compression artifacts, or painterly softness.'

/** Infer seating from product title when sofa_products.seating_capacity is null (e.g. "Vetra 3 Seater Leather Sofa"). */
function inferSofaSeatingFromLabel(label: string): string | undefined {
  const s = label.toLowerCase().replace(/,/g, ' ')
  if (/\b3[\s-]*seater\b/.test(s) || /\bthree[\s-]*seater\b/.test(s)) return '3 Seater'
  if (/\b2[\s-]*seater\b/.test(s) || /\btwo[\s-]*seater\b/.test(s)) return '2 Seater'
  if (/\b1[\s-]*seater\b/.test(s) || /\bone[\s-]*seater\b/.test(s) || /\bsingle[\s-]*seater\b/.test(s)) return '1 Seater'
  return undefined
}

function resolveSofaSeatingCapacity(entry: CustomizationLabelEntry): string | undefined {
  const fromDb = entry.seatingCapacity?.trim()
  if (fromDb) return fromDb
  return inferSofaSeatingFromLabel(entry.label)
}

/** Explicit constraints so a 3-seater is not replaced by a single armchair/recliner. */
function sofaSeatingSizeConstraint(seating: string): string {
  const low = seating.toLowerCase()
  if (low.includes('3'))
    return 'MANDATORY SIZE — THREE-SEATER SOFA: Replace the main sofa with ONE piece that is unmistakably a full-width 3-seat sofa (three seat cushions OR one continuous bench-style seat spanning the same approximate width as a typical 3-seater in the room—similar horizontal footprint to the original sofa in the input). FORBIDDEN: single armchair, one-seater recliner, accent chair, lounge chair, or any narrow one-person seat as the sofa replacement. FORBIDDEN: loveseat-only (2 seats) when 3 Seater was requested. The reference photo may be cropped—still output a wide 3-person sofa in the scene.'
  if (low.includes('2'))
    return 'MANDATORY SIZE — TWO-SEATER SOFA: Replace with ONE sofa for exactly two people (two seat cushions or equivalent width). FORBIDDEN: replacing with a single armchair/recliner when 2 Seater was requested. FORBIDDEN: shrinking to one seat.'
  if (low.includes('1'))
    return 'MANDATORY — 1-SEATER PRODUCT = ONE SEAT ONLY, NOT WHOLE SOFA REMOVAL: The catalog item is a 1-seater reference for styling ONE seating position. If the input already has a 2- or 3-seat sofa, KEEP the same overall sofa: same total width, same number of seat cushions visible, same backrest length. Change ONLY ONE seat cushion (one module / one position—e.g. left, center, or right) to match this reference′s upholstery, color, and silhouette; all other seats must stay as in the input image. FORBIDDEN: removing the entire multi-seat sofa and replacing it with a single freestanding armchair or recliner that leaves empty wall space. FORBIDDEN: shrinking the seating area to one small chair when a long sofa was present. If the input shows only one chair already, update that single seat to match the reference.'
  return 'Match the reference; preserve comparable seating width and seat count in the scene unless product seating type says otherwise.'
}

/** Supported aspect ratios for image generation (model default avoided; we use 16:9 or input). */
const SUPPORTED_ASPECT_RATIOS: { ratio: string; value: number }[] = [
  { ratio: '21:9', value: 21 / 9 },
  { ratio: '16:9', value: 16 / 9 },
  { ratio: '3:2', value: 3 / 2 },
  { ratio: '4:3', value: 4 / 3 },
  { ratio: '5:4', value: 5 / 4 },
  { ratio: '1:1', value: 1 },
  { ratio: '4:5', value: 4 / 5 },
  { ratio: '3:4', value: 3 / 4 },
  { ratio: '2:3', value: 2 / 3 },
  { ratio: '9:16', value: 9 / 16 },
]

/**
 * Get the closest supported aspect ratio string for given dimensions.
 * Defaults to "16:9" if no dimensions. Ensures we never use the model's own default size.
 */
function getAspectRatioForDimensions(width: number, height: number): string {
  if (!width || !height) return '16:9'
  const r = width / height
  let best = SUPPORTED_ASPECT_RATIOS[0]
  let bestDiff = Math.abs(best.value - r)
  for (const { ratio, value } of SUPPORTED_ASPECT_RATIOS) {
    const diff = Math.abs(value - r)
    if (diff < bestDiff) {
      bestDiff = diff
      best = { ratio, value }
    }
  }
  return best.ratio
}

/**
 * Resolve aspect ratio for this request: use input image's ratio (exact same proportions) or 16:9.
 * Uses first room image when available so output matches input size proportions.
 */
function resolveAspectRatio(roomImageParts: { inlineData: { data: string; mimeType?: string } }[]): string {
  const first = roomImageParts[0]
  if (!first?.inlineData?.data) return '16:9'
  const mime = first.inlineData.mimeType || 'image/png'
  const dataUrl = `data:${mime};base64,${first.inlineData.data}`
  const dims = getImageDimensionsFromDataUrl(dataUrl)
  if (!dims) return '16:9'
  return getAspectRatioForDimensions(dims.width, dims.height)
}

function resolveFallbackImageModel(primaryImageModel: string): string | null {
  const configured = process.env.GEMINI_FALLBACK_IMAGE_MODEL?.trim()
  const candidate = configured || DEFAULT_FALLBACK_IMAGE_MODEL
  const normalizedPrimary = primaryImageModel.replace(/^models\//, '').trim()
  const normalizedCandidate = candidate.replace(/^models\//, '').trim()
  if (!normalizedCandidate || normalizedCandidate === normalizedPrimary) return null
  return normalizedCandidate
}

/**
 * Resize a data URL image to exact target dimensions (same pixel canvas as layout / previous result).
 * - `cover`: scales to fill the full target canvas; avoids letterboxing/pillarboxing and keeps
 *   visual size consistent throughout the flow.
 * - `contain`: keeps full image visible but may add padding when aspect ratios differ.
 */
async function resizeDataUrlToDimensions(
  dataUrl: string,
  targetWidth: number,
  targetHeight: number,
  fit: 'cover' | 'contain' = 'contain',
  position: 'center' | 'top' | 'bottom' | 'left' | 'right' = 'center'
): Promise<string> {
  try {
    const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl
    if (!base64) return dataUrl
    const inputBuffer = Buffer.from(base64, 'base64')
    const mime = dataUrl.startsWith('data:image/') ? dataUrl.split(';')[0].replace('data:', '') : 'image/png'
    const format = mime === 'image/jpeg' ? 'jpeg' : mime === 'image/webp' ? 'webp' : 'png'
    const padBg = { r: 245, g: 243, b: 240, alpha: 1 as const }
    const resized = await sharp(inputBuffer)
      .resize(targetWidth, targetHeight, {
        fit,
        position,
        ...(fit === 'contain' ? { background: padBg } : {}),
      })
      .toFormat(format, { quality: 92 })
      .toBuffer()
    const outB64 = resized.toString('base64')
    return `data:${mime};base64,${outB64}`
  } catch (err) {
    console.warn('Resize to input dimensions failed:', err instanceof Error ? err.message : err)
    return dataUrl
  }
}

/**
 * Normalize generated output to the same pixel width×height as the primary input (layout / last result).
 * Uses `cover` by default so the final frame always fills the same canvas without reduced-looking content.
 */
async function ensureImageMatchesInputSize(
  generatedDataUrl: string,
  roomImageParts: { inlineData: { data: string; mimeType?: string } }[],
  options?: { fit?: 'cover' | 'contain'; position?: 'center' | 'top' | 'bottom' | 'left' | 'right' }
): Promise<string> {
  const first = roomImageParts[0]
  if (!first?.inlineData?.data) return generatedDataUrl
  const mime = first.inlineData.mimeType || 'image/png'
  const inputDataUrl = `data:${mime};base64,${first.inlineData.data}`
  const targetDims = await getImageDimensionsRobust(inputDataUrl)
  const generatedDims = await getImageDimensionsRobust(generatedDataUrl)
  if (!targetDims || !generatedDims) return generatedDataUrl
  if (targetDims.width === generatedDims.width && targetDims.height === generatedDims.height) {
    return generatedDataUrl
  }
  const fit = options?.fit ?? 'cover'
  const position = options?.position ?? 'center'
  console.log(
    `[Generate] Fitting output ${generatedDims.width}x${generatedDims.height} → canvas ${targetDims.width}x${targetDims.height} (fit=${fit})`
  )
  return resizeDataUrlToDimensions(generatedDataUrl, targetDims.width, targetDims.height, fit, position)
}

/**
 * Detect major geometry/layout drift between source and generated images.
 * Uses strong-edge mismatch in upper/mid frame where architecture dominates.
 * Returns 0..1 (higher = more drift), or null when it cannot be computed.
 */
async function estimateLayoutDriftScore(
  sourceDataUrl: string,
  generatedDataUrl: string
): Promise<number | null> {
  try {
    const sourceBase64 = sourceDataUrl.includes(',') ? sourceDataUrl.split(',')[1] : sourceDataUrl
    const generatedBase64 = generatedDataUrl.includes(',')
      ? generatedDataUrl.split(',')[1]
      : generatedDataUrl
    if (!sourceBase64 || !generatedBase64) return null

    const sourceBuffer = Buffer.from(sourceBase64, 'base64')
    const generatedBuffer = Buffer.from(generatedBase64, 'base64')
    const meta = await sharp(sourceBuffer).metadata()
    const width = meta.width ?? 0
    const height = meta.height ?? 0
    if (width < 64 || height < 64) return null

    const sourceEdges = await sharp(sourceBuffer)
      .resize(width, height, { fit: 'fill' })
      .greyscale()
      .normalize()
      .convolve({
        width: 3,
        height: 3,
        kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1],
      })
      .raw()
      .toBuffer()

    const generatedEdges = await sharp(generatedBuffer)
      .resize(width, height, { fit: 'fill' })
      .greyscale()
      .normalize()
      .convolve({
        width: 3,
        height: 3,
        kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1],
      })
      .raw()
      .toBuffer()

    const yStart = Math.floor(height * 0.08)
    const yEnd = Math.floor(height * 0.78)
    let union = 0
    let mismatch = 0
    const edgeThreshold = 92

    for (let y = yStart; y < yEnd; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x
        const srcStrong = sourceEdges[i] >= edgeThreshold
        const genStrong = generatedEdges[i] >= edgeThreshold
        if (!srcStrong && !genStrong) continue
        union++
        if (srcStrong !== genStrong) mismatch++
      }
    }

    if (union < 1000) return null
    return mismatch / union
  } catch {
    return null
  }
}

/**
 * Get image dimensions from a base64 data URL (PNG or JPEG) without full decode.
 * Used to log what size the AI actually generated.
 */
function getImageDimensionsFromDataUrl(dataUrl: string): { width: number; height: number } | null {
  try {
    const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl
    if (!base64) return null
    const buf = Buffer.from(base64, 'base64')
    if (buf.length < 24) return null
    // PNG: bytes 16–23 are width (4) and height (4) big-endian
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e) {
      return {
        width: buf.readUInt32BE(16),
        height: buf.readUInt32BE(20),
      }
    }
    // JPEG: find SOF0 (0xFF 0xC0) and read dimensions at offset 5 and 7
    let i = 2
    while (i < buf.length - 9) {
      if (buf[i] === 0xff && buf[i + 1] === 0xc0) {
        return {
          height: buf.readUInt16BE(i + 5),
          width: buf.readUInt16BE(i + 7),
        }
      }
      if (buf[i] !== 0xff) {
        i++
        continue
      }
      const len = buf.readUInt16BE(i + 2)
      i += 2 + len
    }
    return null
  } catch {
    return null
  }
}

/** PNG/JPEG fast path, then Sharp (WebP, AVIF, odd JPEG markers) so resize-to-input never skips. */
async function getImageDimensionsRobust(dataUrl: string): Promise<{ width: number; height: number } | null> {
  const fast = getImageDimensionsFromDataUrl(dataUrl)
  if (fast) return fast
  try {
    const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl
    if (!base64) return null
    const meta = await sharp(Buffer.from(base64, 'base64')).metadata()
    if (meta.width && meta.height) return { width: meta.width, height: meta.height }
  } catch {
    /* ignore */
  }
  return null
}

/**
 * Create a binary mask image (PNG, same size as source): black (0) everywhere, white (255) in the rectangle.
 * Region is in normalized coords 0–1 (x, y, width, height).
 */
async function createEraseMaskImage(
  sourceImageBuffer: Buffer,
  region: { x: number; y: number; width: number; height: number }
): Promise<{ buffer: Buffer; width: number; height: number }> {
  const meta = await sharp(sourceImageBuffer).metadata()
  const w = meta.width ?? 1024
  const h = meta.height ?? 1024
  const x0 = Math.round(region.x * w)
  const y0 = Math.round(region.y * h)
  const rw = Math.max(1, Math.round(region.width * w))
  const rh = Math.max(1, Math.round(region.height * h))
  const whiteRect = await sharp({
    create: { width: rw, height: rh, channels: 3, background: { r: 255, g: 255, b: 255 } },
  })
    .png()
    .toBuffer()
  const maskBuffer = await sharp({
    create: { width: w, height: h, channels: 3, background: { r: 0, g: 0, b: 0 } },
  })
    .composite([{ input: whiteRect, left: Math.min(x0, w - 1), top: Math.min(y0, h - 1) }])
    .png()
    .toBuffer()
  return { buffer: maskBuffer, width: w, height: h }
}

/** Max characters for text sent to Gemini (avoids token/input limits and reduces filter risk). */
const MAX_PROMPT_CHARS = 24000
/** Max room images sent to the image model (reduces input size and improves reliability). */
const MAX_ROOM_IMAGES_FOR_IMAGE_MODEL = 3
/** Max component reference images sent to the image model. */
const MAX_COMPONENT_IMAGES_FOR_IMAGE_MODEL = 3
/** Max length for user-supplied text (e.g. fullRoomAdditionalText) to avoid oversized prompts. */
const MAX_USER_TEXT_CHARS = 2000

/** Fetch image from URL and return base64 + mimeType for Gemini inlineData. */
async function fetchImageAsBase64(url: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return null
    const buf = await res.arrayBuffer()
    const b64 = Buffer.from(buf).toString('base64')
    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const mimeType = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(contentType.split(';')[0].trim())
      ? contentType.split(';')[0].trim()
      : 'image/jpeg'
    return { data: b64, mimeType }
  } catch {
    return null
  }
}

/** Get base64 + mime from a URL (data URL or http(s)). Data URLs are used when client sends inline tile images. */
async function getImageBase64FromUrl(url: string): Promise<{ data: string; mimeType: string } | null> {
  if (!url?.trim()) return null
  const trimmed = url.trim()
  if (trimmed.startsWith('data:')) {
    const match = trimmed.match(/^data:([^;]+);base64,(.+)$/)
    if (!match) return null
    const mime = match[1].toLowerCase()
    const data = match[2].trim()
    const mimeType = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mime) ? mime : 'image/png'
    return { data, mimeType }
  }
  return fetchImageAsBase64(trimmed)
}

function capUserText(s: string | undefined): string {
  if (!s?.trim()) return ''
  return s.trim().length > MAX_USER_TEXT_CHARS ? s.trim().slice(0, MAX_USER_TEXT_CHARS) + ' [trimmed]' : s.trim()
}

function truncatePrompt(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text
  const keepStart = Math.floor(maxChars * 0.6)
  const keepEnd = maxChars - keepStart - 50 // reserve for "... [prompt truncated] ..."
  return text.slice(0, keepStart) + '\n\n... [prompt truncated for length] ...\n\n' + text.slice(text.length - keepEnd)
}

/**
 * API Route: /api/generate
 * 
 * Handles room configuration image generation requests
 * 
 * Expected request body:
 * {
 *   images: string[],                    // Array of base64 room image strings
 *   componentReferenceImages?: string[], // Optional component reference images
 *   componentReferenceLabels?: string[], // Optional short labels describing each reference
 *   configMode: 'purpose' | 'arrangement' | 'customization',
 *   purposeInput?: string,
 *   fullRoomReferenceImages?: string[],  // Reference image(s) for Full Room Configuration (purpose mode)
 *   optionalReferenceImages?: string[],  // Optional style refs + merged with fullRoomReferenceImages (max 4 total); also used in arrangement mode
 *   fullRoomAdditionalText?: string,    // Optional extra reconfiguration notes (purpose + arrangement)
 *   arrangementConfig?: {
 *     numberOfDesks: number,
 *     deskType: 'linear' | 'cluster',
 *     collaborationArea: boolean,
 *     storageLevel: 'low' | 'medium' | 'high'
 *   },
 *   vastuEnabled: boolean,
 *   shuffle?: boolean
 * }
 */

/**
 * Generate image using Google Gemini API for prompt enhancement
 * and Stability AI (or Replicate) for actual image-to-image generation
 * 
 * @param images - Reference images (base64 strings)
 * @param prompt - Generated prompt for AI
 * @returns Generated image as data URL string, or { imageUrl, warning } when falling back (e.g. Gemini returned empty content / finishReason OTHER)
 */
interface CustomizationLabelEntry {
  label: string
  description: string
  isDecor: boolean
  action?: 'edit' | 'add' | 'replace' | 'erase'
  /** URL of the exact tile/product image (floor or wall). AI will use this to reproduce the tile precisely. */
  referenceImageUrl?: string
  /** Seating capacity for sofa (e.g. "1 Seater", "2 Seater", "3 Seater"). */
  seatingCapacity?: string
}

/** Tile/sofa reference image (base64) for exact reproduction in customization mode. */
type CustomizationReferenceImage = { elementType: string; data: string; mimeType: string; seatingCapacity?: string }

async function generateImageWithAI(
  images: string[],
  prompt: string,
  componentReferenceImages?: string[],
  componentReferenceLabels?: string[],
  fullRoomReferenceImages?: string[],
  fullRoomAdditionalText?: string,
  purposeInput?: string,
  configType: 'internal' | 'external' = 'internal',
  shuffle: boolean = false,
  isCustomizationMode: boolean = false,
  customizationLabels?: Record<string, CustomizationLabelEntry>,
  selectedStyle?: string | null,
  selectedColorPalette?: string | null,
  customizationReferenceImages?: CustomizationReferenceImage[],
  strictLayoutLock: boolean = true
): Promise<string | { imageUrl: string; warning: string }> {
  const isExternal = configType === 'external'
  const userSpaceLabel = isExternal ? "USER'S ORIGINAL PROPERTY/HOUSE" : "USER'S ROOM"
  const geminiApiKey = process.env.IMAGE_GENERATION_API_KEY

  if (!geminiApiKey) {
    console.warn('No IMAGE_GENERATION_API_KEY — returning original image as placeholder (same as input).')
    return {
      imageUrl: generatePlaceholderImage(images, prompt),
      warning:
        'IMAGE_GENERATION_API_KEY is not set on the Next.js server. Add it to .env.local in the project root (same folder as package.json for `next dev`), restart `npm run dev`, then try again. Until then the API echoes your upload.',
    }
  }

  try {
    /**
     * Convert unsupported MIME types to JPEG
     * Gemini API supports: image/jpeg, image/png, image/webp, image/gif
     * Does NOT support: image/avif, image/heic, etc.
     */
    const normalizeMimeType = (mimeType: string): string => {
      const supported = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      if (supported.includes(mimeType)) {
        return mimeType
      }
      // Convert unsupported formats to JPEG
      console.log(`Converting unsupported MIME type ${mimeType} to image/jpeg`)
      return 'image/jpeg'
    }

    // Step 1: Use Gemini to analyze images and enhance the prompt
    const roomImageParts = images.slice(0, 4).map(img => {
      let mimeType = 'image/jpeg'
      let base64Data = img
      
      if (img.includes(',')) {
        const [header, data] = img.split(',')
        base64Data = data
        
        const mimeMatch = header.match(/data:([^;]+)/)
        if (mimeMatch) {
          mimeType = normalizeMimeType(mimeMatch[1])
        }
      }
      
      return {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      }
    })

    /** Match input pixel size: exact WxH canvas; `cover` keeps full-frame visual size consistent (no letterboxing). */
    const sizeMatchOptions: { fit: 'cover'; position: 'center' } = {
      fit: 'cover',
      position: 'center',
    }
    const firstInputDataUrlForDims =
      roomImageParts[0]?.inlineData?.data
        ? `data:${roomImageParts[0].inlineData.mimeType || 'image/png'};base64,${roomImageParts[0].inlineData.data}`
        : ''
    const inputPixelDims = await getImageDimensionsRobust(firstInputDataUrlForDims)

    // Full Room reference images (for purpose mode) - style/layout reference for reconfiguration
    const fullRoomRefParts = (fullRoomReferenceImages || []).slice(0, 4).map(img => {
      let mimeType = 'image/jpeg'
      let base64Data = img
      if (img.includes(',')) {
        const [header, data] = img.split(',')
        base64Data = data
        const mimeMatch = header.match(/data:([^;]+)/)
        if (mimeMatch) mimeType = normalizeMimeType(mimeMatch[1])
      }
      return { inlineData: { data: base64Data, mimeType } }
    })

    // Component reference images (style / design only)
    const componentParts = (componentReferenceImages || []).slice(0, 6).map((img, index) => {
      let mimeType = 'image/jpeg'
      let base64Data = img

      if (img.includes(',')) {
        const [header, data] = img.split(',')
        base64Data = data

        const mimeMatch = header.match(/data:([^;]+)/)
        if (mimeMatch) {
          mimeType = normalizeMimeType(mimeMatch[1])
        }
      }

      return {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
        label: componentReferenceLabels?.[index] || '',
      }
    })

    // Build reference component description if provided (style, elements, furniture, colors, components ONLY; not layout/size)
    const referenceComponentsText = componentParts.length > 0
      ? `\n\nREFERENCE COMPONENT IMAGES PROVIDED (${componentParts.length} images):
Use reference ONLY for: style, elements, furniture types, colors, components. Do NOT use reference for room layout, size, length, width, or height—those must come from the user's uploaded images and must NOT change.
${componentParts
  .map((comp, idx) => {
    const label = comp.label || `Component ${idx + 1}`
    return `- ${label}: Use this reference for style, design, material, color of this component type. When placing similar components in the room, match the visual style and characteristics. Room layout and dimensions come ONLY from the user's room images.`
  })
  .join('\n')}

IMPORTANT: Reference = style, elements, furniture, colors, components ONLY. Layout and dimensions of the room must remain exactly as in the user's uploaded images.`
      : ''

    // CRITICAL: Reference = style/elements/furniture/colors/components ONLY. Layout/size/length/width/height must NOT change.
    const doNotCopyRefBlock = fullRoomRefParts.length > 0
      ? `

CRITICAL - REFERENCE IMAGE USAGE:
- Reference image(s) are for extracting ONLY: style, elements, furniture, colors, components. Do NOT use reference for layout, size, length, width, height, or proportions.
- Layout, size, length, width, height MUST come ONLY from the user's UPLOADED images. They must NOT change in the generated output.
- Your output MUST be the user's ORIGINAL ${isExternal ? 'property (first images above)' : 'room (first images above)'} - same ${isExternal ? 'building' : 'room'}, same structure, same layout, same dimensions.
- From reference use ONLY: style, elements, furniture types, colors, components. The result must be the user's original ${isExternal ? 'property' : 'room'} with reference-inspired style, NOT a copy of the reference.`
      : ''

    // Full Room/External reference: use reference ONLY for style, elements, furniture, colors, components. Layout/size must not change.
    const fullRoomRefText = fullRoomRefParts.length > 0
      ? `\n\nFULL CONFIGURATION - REFERENCE IMAGES (${fullRoomRefParts.length} image(s)):
Reference = style, elements, furniture, colors, components ONLY. Layout, size, length, width, height must NOT change; they come ONLY from the user's uploaded images.
You MUST:
1. PRESERVE the user's ORIGINAL ${isExternal ? 'property (first images)' : 'room (first images)'} - same ${isExternal ? 'building shape, facade, doors, windows, balconies, staircase, size' : 'room structure, walls, floor, ceiling, doors, windows, dimensions'}.
2. Use the reference ONLY to extract: style, elements, furniture, colors, components (e.g. ${isExternal ? 'lighting style, landscaping, color tone' : 'furniture style, color palette, decor'}). Do NOT take layout or dimensions from the reference.
3. Do NOT copy or redraw the reference ${isExternal ? 'building' : 'room'}. The output must BE the user's original ${isExternal ? 'property' : 'room'} from the first set of images, with the same layout and size.
4. ${isExternal ? 'Only styling (elements, colors, components) may be inspired by the reference. Building layout, size, length, width, height come ONLY from the user\'s images.' : 'Only furniture and decor may be inspired by the reference. Room layout, size, length, width, height come ONLY from the user\'s images.'}
${capUserText(fullRoomAdditionalText) ? `\nAdditional user instructions:\n${capUserText(fullRoomAdditionalText)}` : ''}${doNotCopyRefBlock}`
      : capUserText(fullRoomAdditionalText)
        ? `\n\nAdditional user instructions for reconfiguration:\n${capUserText(fullRoomAdditionalText)}`
        : ''

    const structureLabel = isExternal ? 'PROPERTY STRUCTURE' : 'ROOM STRUCTURE'
    const reconfigLabel = isExternal ? 'EXTERNAL RECONFIGURATION' : 'RECONFIGURATION'
    const structureBracketDesc = isExternal
      ? "Describe ONLY the user's property from the first set of images so the image model can reproduce it EXACTLY. Building shape, facade layout, roof type, door/window positions, balconies, staircase position, compound, boundary wall, gates. Describe the COMPLETE scene so the output shows the FULL image - same framing from edge to edge (full building, sky, ground, foreground). Do NOT describe a cropped or zoomed-in view. Be specific - the output must MATCH this property in full, NOT the reference."
      : "Describe ONLY the user's room from the first set of images so the image model can reproduce THIS EXACT ROOM. Include: camera viewpoint and framing, room shape and dimensions, each wall (materials, colors, features like slats or panels), floor type and color, ceiling type and lights, every door and window and their positions, any corridors or alcoves, fixed elements (e.g. reception desk area, glass partition, built-in wardrobe run). The description must be detailed enough that the image model draws the SAME room – same layout, same structure – not a different space. Do NOT use reference images for layout; describe only what is in the user's room images."
    const hasUserPurposeOrAdditionalText = !!capUserText(purposeInput) || !!capUserText(fullRoomAdditionalText)
    const reconfigBracketDesc = isExternal
      ? "Describe in detail how to restyle the user's existing facade so that its COLORS, CLADDING MATERIALS, RAILINGS, WINDOW/DOOR FRAMES, EXTERNAL LIGHTING, AND PLANTING closely match the reference image, while keeping the same building massing, floors, and opening positions. Do NOT add or remove structural elements (no extra floors, wings, staircases, balconies, or boundary walls)."
      : (hasUserPurposeOrAdditionalText
        ? "The room LAYOUT and STRUCTURE are already defined above – do NOT describe a different room. Only describe what furniture and decor to REMOVE and REPLACE so the ENTIRE room fulfills the user's intent (e.g. full kitchen: cabinets, island, appliances, seating; or bedroom: bed, nightstands, wardrobe area) using the full space. Apply reference style/elements. Do NOT suggest changing walls, floor, ceiling, doors, windows, corridors, or room shape – only furniture and decor."
        : "The room LAYOUT and STRUCTURE are already defined above – do NOT describe a different room. Only describe what furniture and decor to REMOVE and REPLACE with reference-inspired style, elements, furniture, colors, components. Do NOT suggest changing walls, floor, ceiling, doors, windows, or room shape – only furniture and decor.")
    const structureLine = '[' + structureBracketDesc + ']'
    const reconfigLine = '[' + reconfigBracketDesc + ']'
    const geminiPrompt = `${prompt}${referenceComponentsText}${fullRoomRefText}

MAIN IDEA: The generated image must MATCH the user's ORIGINAL ${isExternal ? 'property' : 'room'} (first images above) - same SIZE, LAYOUT, and STRUCTURE. ${isExternal ? 'Only external styling (e.g. landscaping, lighting mood) may be inspired by the reference. Do NOT copy the reference building.' : 'Only the INTERIOR (furniture, decor) is reconfigured. Do NOT copy the reference room.'}

CRITICAL - WHICH IMAGES DEFINE THE OUTPUT (LAYOUT MUST NOT CHANGE):
- The FIRST set of images above are the ${userSpaceLabel} - the actual physical space. Your output MUST be this SAME ${isExternal ? 'building/property' : 'room'} (same layout, same size, same length, width, height, same structure). The result must look like the SAME ${isExternal ? 'property' : 'room'} – recognizably the same space – with only ${isExternal ? 'external styling' : 'furniture and decor'} changed.
- Reference images are for extracting ONLY: style, elements, furniture, colors, components. Do NOT use reference for layout, size, length, width, or height. Layout and dimensions must NOT change; they come ONLY from the user's uploaded images.
- Preserve the EXACT ${isExternal ? 'property: building shape, facade, roof, doors, windows, balconies, staircase, compound area, dimensions' : 'room: dimensions, wall positions, window positions, door positions, ceiling, floor, corridors, fixed elements (e.g. desk area, glass partition)'}. ${isExternal ? 'Only optional style cues from reference.' : 'Only change furniture, components, and decor inside that room. Do NOT describe or generate a different room layout.'}

Your response MUST be in exactly this format:

${structureLabel}:
` + structureLine + `


${reconfigLabel}:
${reconfigLine}`

    const geminiPromptTruncated = truncatePrompt(geminiPrompt, MAX_PROMPT_CHARS)
    console.log('=== [Generate] Gemini Text Prompt Start ===')
    console.log(geminiPromptTruncated)
    console.log('=== [Generate] Gemini Text Prompt End ===')

    // Call Google Gemini API for enhanced prompt
    // Allow overriding the model via environment variable (GEMINI_TEXT_MODEL)
    // Default to gemini-2.5-flash on the v1 API
    const geminiModel =
      process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash'

    const geminiTextBody = JSON.stringify({
      contents: [
        {
          parts: [
            // Design-context prefix helps safety filters treat request as non-sensitive
            {
              text: DESIGN_CONTEXT_PREFIX + (isExternal
                ? `MAIN IDEA: The output must MATCH the user's ORIGINAL PROPERTY (following images). The following image(s) are the USER'S ORIGINAL HOUSE/PROPERTY - preserve this exact building: same facade, same roof, same doors/windows/balconies/staircase positions, same proportions. Do NOT copy any reference building shown later. Only optional external styling (e.g. lighting, landscaping) may be inspired by reference.`
                : 'MAIN IDEA: The output must be the SAME ROOM as in the following image(s). The following image(s) are the USER\'S ROOM – preserve this exact room: same layout, same walls, floor, ceiling, doors, windows, corridors, fixed elements (e.g. desk area, glass partition), same camera angle. Only furniture and decor may change. Do NOT describe or generate a different room layout. Do NOT copy the reference room.'),
            },
            ...roomImageParts,
            // Full config reference - STYLE ONLY, do NOT copy reference
            ...(fullRoomRefParts.length > 0
              ? [
                  {
                    text: isExternal
                      ? "REFERENCE image(s) below - for STYLE INSPIRATION ONLY. Do NOT copy this building. Do NOT describe or redraw the reference property. Describe ONLY the user's property (first images) and optional subtle style cues (e.g. lighting, plant style) inspired by the reference. The output must BE the user's original property."
                      : "REFERENCE image(s) below - for style, elements, furniture, colors, components ONLY. Do NOT use reference for layout, size, length, width, or height. Describe what to remove from the user's room and what style/elements/colors/components to add from references. The output must BE the user's room (first images) with the same layout and dimensions, with reference-style interior.",
                  },
                  ...fullRoomRefParts.map(p => ({ inlineData: p.inlineData })),
                ]
              : []),
            // Component reference images (style / design only) with labels
            ...componentParts.flatMap((comp) =>
              comp.label
                ? [
                    { text: `Reference component style: ${comp.label}` },
                    { inlineData: comp.inlineData },
                  ]
                : [{ inlineData: comp.inlineData }]
            ),
            { text: geminiPromptTruncated },
          ],
        },
      ],
      generationConfig: {
        temperature: shuffle ? 0.2 : 0,
        topP: 0.8,
      },
    })

    const geminiResponse = await fetchGemini(
      `https://generativelanguage.googleapis.com/v1/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: geminiTextBody,
      },
      GEMINI_TEXT_TIMEOUT_MS
    )

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text()
      console.error('Gemini API error:', errorData)
      throw new Error(`Gemini API error: ${geminiResponse.status}`)
    }

    const geminiData = await geminiResponse.json()
    const firstCandidate = geminiData.candidates?.[0]
    const finishReason = firstCandidate?.finishReason
    const parts = firstCandidate?.content?.parts
    if (!parts?.length || finishReason === 'OTHER') {
      console.warn('Gemini text response had no content or finishReason OTHER:', { finishReason, hasParts: !!parts?.length })
    }
    const enhancedDescription = parts?.[0]?.text || ''
    console.log('Gemini enhanced description:', enhancedDescription.substring(0, 300) + (enhancedDescription ? '...' : '(empty)'))

    // Parse STRUCTURE and RECONFIGURATION from the text model (ROOM STRUCTURE or PROPERTY STRUCTURE)
    let roomStructureText = ''
    let reconfigurationText = enhancedDescription
    const structureMatch = enhancedDescription.match(/\b(?:ROOM\s+STRUCTURE|PROPERTY\s+STRUCTURE)\s*:?\s*\n?([\s\S]*?)(?=\s*(?:RECONFIGURATION|EXTERNAL\s+RECONFIGURATION)\s*:|\s*$)/i)
    const reconfigMatch = enhancedDescription.match(/\b(?:RECONFIGURATION|EXTERNAL\s+RECONFIGURATION)\s*:?\s*\n?([\s\S]*)/i)
    if (structureMatch && structureMatch[1]?.trim()) {
      roomStructureText = structureMatch[1].trim()
    }
    if (reconfigMatch && reconfigMatch[1]?.trim()) {
      reconfigurationText = reconfigMatch[1].trim()
    }

    // Step 2: Combine original prompt with Gemini's analysis for image generation
    const referenceComponentsFinalText = componentParts.length > 0
      ? `\n\nREFERENCE COMPONENT IMAGES: Use for style, elements, furniture, colors, components ONLY. The room layout, size, length, width, height must come from the user's room images and must NOT change.`
      : ''

    // When reference exists: preserve user's original, use reference for style only - do NOT copy reference
    const fullConfigInstruction = fullRoomRefParts.length > 0
      ? (isExternal
          ? `
EXTERNAL CONFIGURATION: Your output MUST be the user's ORIGINAL property (first images above) - same building, same facade, same doors/windows/balconies/staircase. The reference image(s) define the TARGET STYLE for colors, wall finishes, railing/window designs, external lighting, and landscape treatment. Strongly match this STYLE while keeping the user's original building geometry (massing, floors, opening positions) unchanged. Do NOT draw the reference building itself.`
          : `
FULL CONFIGURATION: Your output MUST be the user's ORIGINAL room (first images above) - same room structure. REMOVE existing furniture/decor and REPLACE with reference-inspired style. Do NOT draw the reference room - only the user's room with reference-style interior.`)
      : ''

    const structureBlock = roomStructureText
      ? `
MAIN IDEA: Your output must be the SAME ${isExternal ? 'property' : 'room'} as in the user's images – same structure, same layout, same camera angle. ${isExternal ? 'Do NOT draw the reference building. Only optional style cues from reference.' : 'Only INTERIOR (furniture, decor) reconfigured. Do NOT draw a different room.'}

LAYOUT LOCK – DRAW EXACTLY THIS ${isExternal ? 'PROPERTY' : 'ROOM'} (from the user's images above; the structure below is FIXED – do not change it):
${roomStructureText}

The image you generate MUST look like the SAME ${isExternal ? 'property' : 'room'} as the user's photos: same ${isExternal ? 'building, facade, doors, windows, balconies, staircase' : 'dimensions, walls, floor, ceiling, doors, windows, corridors, fixed elements'}, same viewpoint and framing. ${
          isExternal
            ? 'Do NOT copy the reference image. Do NOT add or remove any structural massing: no extra floors, no new wings/blocks, no new staircases, no new balconies/terraces, no new boundary walls or major volumes that are not present in the uploaded property images.'
            : 'Only finishes and movable contents may change. Do NOT add or remove interior architecture: keep the same stair flights and geometry (no new staircases, no re-routed flights, no different tread/riser count), same door and window openings (do not brick over glazing or invent new doorways), same ceiling line and structural beams/columns. No new partition walls or full-height built-ins that change room shape or wall depth. For raw or construction-stage rooms, keep the same concrete/brick shell and opening positions—apply style as surfaces and furniture inside that exact shell only. If the room has a reception desk zone and corridor, keep that same zone geometry—only furniture and decor change.'
        }
${fullConfigInstruction}

${isExternal ? 'OPTIONAL STYLE TO APPLY (colors, lighting, materials, landscaping only - no new structure):' : 'FURNITURE AND DECOR TO APPLY (remove old items, replace with the following – room layout stays as above):'}
${reconfigurationText}

OUTPUT: The SAME ${isExternal ? 'property' : 'room'} as the user\'s images – recognizably the same space. Do NOT generate the same as any reference image. Do NOT generate a different room layout.`
      : `
MAIN IDEA: Your output must be the SAME ${isExternal ? 'property' : 'room'} as in the user's images – same structure, same layout, same camera angle. Do NOT generate the same as the reference image. Do NOT generate a different room layout.

CRITICAL - PRESERVE THE USER'S ${isExternal ? 'PROPERTY' : 'ROOM'} (FIRST IMAGE(S) ABOVE):
Your output must be the SAME ${isExternal ? 'building/property' : 'room'} as shown in the user's uploaded images – recognizably the same space. Do NOT copy the reference ${isExternal ? 'building' : 'room'}. Reference images are for STYLE only. Only furniture and decor may change; walls, floor, ceiling, doors, corridors, and room shape must stay as in the user's images.
${fullConfigInstruction}

Detailed configuration requirements:
${enhancedDescription}

OUTPUT: The SAME ${isExternal ? 'property' : 'room'} as the user's images. Do NOT output the reference image. Do NOT output a different room layout.`

    // Build a compact prompt for the image model.
    // In customization mode: build a DIRECT, TARGETED prompt from user's selections —
    // do NOT use the text model's reconfig output which may describe unrelated changes.
    // In normal mode: use text model's parsed structure + reconfig snippets.
    const STRUCT_CAP = 800
    const RECONFIG_CAP = 800
    const structSnippet = roomStructureText.length > STRUCT_CAP
      ? roomStructureText.slice(0, STRUCT_CAP) + '…'
      : roomStructureText

    let imageModelPrompt: string

    if (isCustomizationMode && customizationLabels && Object.keys(customizationLabels).length > 0) {
      // Build explicit per-element instructions from the user's selections
      const restyleLines: string[] = []
      const addDecorLines: string[] = []
      const replaceLines: string[] = []
      const eraseLines: string[] = []

      const hasTileReferenceImages = (customizationReferenceImages?.length ?? 0) > 0

      Object.entries(customizationLabels).forEach(([elementType, entry]) => {
        if (entry.action === 'erase') {
          eraseLines.push(`• ${elementType}: ${entry.description}`)
        } else if (entry.action === 'replace') {
          replaceLines.push(`• ${elementType}: replace with "${entry.label}" – ${entry.description}`)
        } else if (entry.isDecor || entry.action === 'add') {
          addDecorLines.push(`• ${entry.label} – ${entry.description}`)
        } else {
          const isTileWithRef = hasTileReferenceImages && (elementType === 'floor' || elementType === 'wall') && customizationReferenceImages?.some((r) => r.elementType === elementType)
          if (isTileWithRef) {
            restyleLines.push(`• ${elementType}: REMOVE any existing ${elementType} finish in the image (the input may already have a pattern – erase it completely). REPLACE the entire ${elementType} with ONLY the EXACT tile from the reference image. One continuous surface; no overlay, no blending, no visible previous pattern.`)
          } else {
            const replaceNotOverlay = (elementType === 'floor' || elementType === 'wall')
              ? ' REMOVE the current ' + elementType + ' finish entirely, then apply the new one (no overlay, no second layer). '
              : ''
            const sofaCap = elementType === 'sofa' ? resolveSofaSeatingCapacity(entry) : undefined
            const oneSeaterPartial =
              sofaCap && sofaCap.toLowerCase().includes('1')
                ? ' Update ONE seat only on the existing sofa to match the 1-seater reference; keep all other seats and full sofa width. '
                : sofaCap
                  ? ` Replace the main sofa with exactly one ${sofaCap.toLowerCase()} piece (wrong size = incorrect output). `
                  : ''
            const seatingCapacityNote =
              elementType === 'sofa' && sofaCap
                ? ` ${sofaSeatingSizeConstraint(sofaCap)}${oneSeaterPartial}`
                : elementType === 'sofa'
                  ? ` ${sofaSeatingSizeConstraint('')} `
                  : ''
            restyleLines.push(`• ${elementType}:${replaceNotOverlay}${seatingCapacityNote}change to "${entry.label}" – ${entry.description}`)
          }
        }
      })

      const changeBlock = [
        restyleLines.length > 0
          ? `RESTYLE ONLY THESE ELEMENTS (change their color/texture/material as specified; do NOT touch anything else):\n${restyleLines.join('\n')}`
          : '',
        addDecorLines.length > 0
          ? `ADD ONLY THESE DECORATIVE ELEMENTS in empty corners or surfaces (do NOT remove or alter ANY existing element):\n${addDecorLines.join('\n')}`
          : '',
        replaceLines.length > 0
          ? `REPLACE ONLY THESE ELEMENTS with the requested variants (keep overall layout and camera identical):\n${replaceLines.join('\n')}`
          : '',
        eraseLines.length > 0
          ? `ERASE ONLY THESE ELEMENTS from the current image (do NOT remove anything else):\n${eraseLines.join('\n')}`
          : '',
      ].filter(Boolean).join('\n\n')

      const elementList = Object.keys(customizationLabels).join(', ')
      const hasFloorTileRef = hasTileReferenceImages && customizationReferenceImages?.some((r) => r.elementType === 'floor')
      const floorMandatoryBlock =
        hasFloorTileRef
          ? `

MANDATORY – FLOOR MUST CHANGE: The user has selected a new floor tile. You MUST replace the ENTIRE floor in the image with the floor tile from the reference image below.
- The floor in the output MUST look completely different from the current floor. Every visible part of the floor (all tiles, grout, pattern) must be replaced.
- REMOVE the existing floor finish entirely. Then show ONLY the new floor tile from the reference – one continuous surface, no overlay, no leftover previous pattern.
- If the floor does not visibly change in your output, the result is wrong.`
          : ''
      const tileRefInstruction =
        hasTileReferenceImages
          ? `

CRITICAL – FLOOR/WALL TILE: FULL REPLACEMENT, NO OVERLAY, NO LOGOS
The image you receive may be a PREVIOUS RESULT (e.g. already customized walls/floor). For wall/floor you MUST:
- REMOVE the existing surface completely. Any current pattern (e.g. hexagonal tiles, wood, paint) must disappear entirely – do NOT blend, overlay, or leave it visible under the new tile.
- REPLACE with ONLY the tile from the reference image below. One single continuous surface: the whole floor (or wall) shows nothing but the new tile. No double texture, no visible previous finish, no patches.
- Match the reference tile's pattern, color, and texture precisely. Furniture sits on the new floor; walls show only the new tile from edge to edge.
- GLASS, WINDOWS, DOORS, PARTITIONS — DO NOT TOUCH: When "wall" is listed, change ONLY opaque wall finishes (paint, tile, panels on solid wall). You MUST preserve every glass door, sliding door, fixed glazing, glass partition, storefront window, reception glass, and regular window EXACTLY: same position, size, frame, mullions, transparency, and reflections. NEVER remove glazing, NEVER replace glass with solid wall, NEVER block openings that were transparent in the input. If you remove or brick over a glass door or window, the output is WRONG.
- NEVER OUTPUT THE REFERENCE PHOTO ITSELF: Catalog/tile reference images often show people, hands, showrooms, or slabs being held — your output must still be ONLY the same ROOM photograph as the main input with new tile on surfaces. Do NOT generate people, product shoots, stone slabs in hands, or any scene that looks like a tile brochure. Wrong = any human figures or studio product photography.
- Reference images may contain brand logos (e.g. MYTYLES) or text – do NOT copy any logo or text into your output. Use ONLY the tile pattern, color, and texture. The output must have zero text and zero logos – only the tile look.`
          : ''

      imageModelPrompt = isExternal
        ? `${DESIGN_CONTEXT_PREFIX}Professional exterior design visualization.

You are given ONE image (the current result). Make ONLY the following specific changes. Everything else must remain pixel-perfect identical.

${changeBlock}
${tileRefInstruction}

ABSOLUTE RULES:
- ONLY change: ${elementList}.
- Do NOT change: any other part of the building, facade, windows, doors, balconies, roof, landscaping, sky, or ground — unless it is explicitly listed above.
- Keep the exact same camera angle, framing, proportions, and all unlisted elements completely unchanged.
- The output must look like the same photograph with ONLY those listed elements changed.`
        : `${DESIGN_CONTEXT_PREFIX}Professional interior design visualization.
${floorMandatoryBlock}

IDENTITY LOCK — SAME PHOTOGRAPH AS INPUT (ONLY MATERIALS CHANGE):
The room image you receive is the single source of truth for camera, lens, crop, and composition. Your output must be that EXACT same shot: a viewer overlaying input and output would see identical geometry — same ceiling line, same floor line, same left/right edges, same full sofa and chairs (including bases), same reception desk and glass — with ONLY the listed surfaces (e.g. wall/floor/sofa finish) looking different. Think masked retouch, not a new render or re-photograph from a new viewpoint.

SAME LAYOUT, NO ZOOM: Render the EXACT same scene and framing as the input. Only change the look of the surfaces listed below (e.g. wall tile, floor tile). Do NOT zoom in. Do NOT change the field of view or crop. The camera view and everything in frame must stay identical – only the tile/material on the listed surfaces changes.

You are given ONE image (the current result; it may already be customized). Make ONLY the following specific changes. Everything else must remain pixel-perfect identical.
For wall or floor: REPLACE the entire surface – remove any existing finish first. Do NOT overlay a new texture on top of the current one; the result must be one single continuous new surface with no visible previous pattern.

${changeBlock}
${tileRefInstruction}

ABSOLUTE RULES:
- ONLY change the elements explicitly listed above: ${elementList}.
- Do NOT change floor, wall, ceiling, or ANY other element that is NOT in that list. If floor is not in the list, keep the floor exactly as in the input. Same for walls, ceiling, furniture, decor – only modify what is listed.
- ARCHITECTURE LOCK (even when wall/floor are listed): Do NOT add, remove, move, resize, or replace any doors, glass doors, sliding doors, windows, glass partitions, curtain walls, reception glazing, or wall openings. Keep every frame, mullion, handle, and transparent area exactly as in the input. Wall/floor edits mean surface material ONLY — not removing glazing or changing room geometry.
- Do NOT add, remove, or change doors, glass doors, glass partitions, or wall openings. Keep all doors, glass panels, and partition elements exactly as in the input – do not add a door where there is none; do not remove one where it exists.
- Keep the exact same camera angle, framing, layout, and all unlisted elements completely unchanged.
- OUTPUT IMAGE MUST have the EXACT SAME dimensions and aspect ratio as the input image. Do NOT resize, crop, or change the frame. Same width, same height, same composition – only the selected components should change visually.
- NO ZOOM – CRITICAL: Do NOT zoom in or produce a closer crop. The output must show the exact same field of view as the input: full room from edge to edge, same scale. All walls, ceiling, floor, furniture, and decor visible in the input must appear in the output at the same relative size and position. Applying new tiles to walls/floor must NOT change the framing or make the image look zoomed in.
- Do NOT draw or render ANY text, product names, tile codes, dimensions, or labels in the image. Apply only the visual look (pattern, color, texture) of the selected tiles/materials – never show words or codes on walls or floor.
- The output must look like the same photograph with ONLY those listed elements changed. No other differences allowed.`
    } else {
      // Normal (non-customization) mode: use text model output
      const reconfigSnippet = reconfigurationText.length > RECONFIG_CAP
        ? reconfigurationText.slice(0, RECONFIG_CAP) + '…'
        : reconfigurationText

      // When user selected style and/or color palette, inject them directly into the image model prompt so the output shows BOTH style and palette (palette was often missed when only in text model output)
      const styleForImage = typeof selectedStyle === 'string' && selectedStyle.trim() ? selectedStyle.trim() : null
      const isOdishaStyle = !!styleForImage && styleForImage.trim().toLowerCase() === 'odisha'
      const isMaharashtrianStyle = !!styleForImage && styleForImage.trim().toLowerCase() === 'maharashtrian'
      const isPunjabiStyle = !!styleForImage && styleForImage.trim().toLowerCase() === 'punjabi'
      const isIndustrialLoftStyle =
        !!styleForImage &&
        (styleForImage.trim().toLowerCase() === 'industrial' ||
          styleForImage.trim().toLowerCase() === 'industrial loft')
      const odishaStyleRule = isOdishaStyle
        ? `- Odisha style mandatory cues: use prominently carved wooden furniture, include brass lamps and/or temple-inspired decorative elements, and keep a dominant earthy palette (brown, red, and gold). These cues must be clearly visible and not subtle.`
        : ''
      const maharashtrianStyleRule = isMaharashtrianStyle
        ? `- Maharashtrian style mandatory cues: feature a jhula (swing) or a wooden sofa as a key seating element, use neutral tones accented with brass decor, and maintain a simple but richly traditional ambiance. These cues must be clearly visible and not subtle.`
        : ''
      const punjabiStyleRule = isPunjabiStyle
        ? `- Punjabi style mandatory cues: include bright phulkari-style cushions, use rich wooden sofas as primary seating, and apply warm, lively colors across key furnishings and accents. These cues must be clearly visible and not subtle.`
        : ''
      const industrialLoftStyleRule = isIndustrialLoftStyle
        ? `- Industrial Loft style mandatory cues: include exposed brick wall OR concrete wall, use black metal + wood furniture, feature a brown or black leather sofa, keep large windows and a clear loft-like open feel, and use slightly warm lighting. These cues must be clearly visible and not subtle.`
        : ''
      const paletteForImage = getPaletteInstruction(selectedColorPalette)
      const stylePaletteBlock =
        !isExternal && (styleForImage || paletteForImage)
          ? `REQUIRED – APPLY BOTH IN THE OUTPUT:
${styleForImage ? `- Design style: ${styleForImage.charAt(0).toUpperCase() + styleForImage.slice(1)}. This style must be visually dominant and unmistakable in the final room image, with clear style-defining furniture shapes, materials, finishes, decor cues, and mood. Do NOT return a generic room with weak or subtle hints of the selected style.` : ''}
${odishaStyleRule}
${maharashtrianStyleRule}
${punjabiStyleRule}
${industrialLoftStyleRule}
${paletteForImage ? `- Color palette: ${paletteForImage} The image MUST visibly use these colors as the dominant palette for walls, furniture, fabrics, rugs, and accents. Do not use a different, muted, or generic color scheme.` : ''}
- Validation requirement: if the selected style and selected color palette are not clearly visible in the final output, the result is wrong and must be regenerated.

`
          : ''

      // Single uploaded layout image: hardest lock so the model cannot invent Kerala-style staircases, new builtins, or moved openings.
      const strictShellLockInterior =
        !isExternal && !isCustomizationMode && images.length === 1
          ? `
STRICT STRUCTURAL SHELL LOCK (single layout photograph):
- Treat the photograph as a fixed 3D shell + camera: same silhouette when toggling before/after. Preserve every wall plane, corner, ceiling line, stair flight (presence, direction, tread count/angle), landing, column, beam, and rough-construction zone in the same place. Do NOT add a wooden staircase, new handrail system, new mezzanine, or new full-height cabinet wall where the upload does not show one.
- Do NOT add, remove, relocate, resize, or merge doorways, windows, arches, or glazed openings. Do NOT block a window or door with new built-ins. Style (regional, traditional, modern) is finishes + furniture + rugs + surface-mounted lighting only—never new permanent architecture.
- Movable furniture and decor must fit inside the existing floor/wall envelope; do not change room proportions or camera framing beyond the pixel lock below.
`
          : ''
      const strictObjectConservationInterior =
        !isExternal && !isCustomizationMode
          ? `
OBJECT CONSERVATION (style update, not object injection):
- Keep the same major furniture inventory and approximate placement from the input room. Do NOT invent extra large objects or duplicate furniture pieces.
- Do NOT add new TV units, extra sofas/chairs, cabinets, beds, dining sets, partitions, decor clusters, statues, or lighting fixtures unless explicitly requested in user instructions.
- Prefer restyling existing objects (material, color, upholstery, texture, finish) over replacing or adding new ones.
`
          : ''
      const ultraLayoutInvarianceInterior =
        !isExternal && !isCustomizationMode && strictLayoutLock
          ? `
STRICT LAYOUT INVARIANCE (HIGHEST PRIORITY):
- The output must keep IDENTICAL room geometry as the input photo: same wall positions, corner junctions, opening sizes, sill heights, beam/soffit lines, staircase geometry, and corridor widths.
- Preserve exact door/window count, placement, and proportions. Do NOT shift, widen, narrow, raise/lower, or invent openings.
- Keep the same floor-plane boundaries and perspective convergence. Do NOT alter camera height, camera tilt, lens feel, or viewpoint.
- For unfinished / construction-stage rooms: preserve the same shell and structural state; do not reconstruct architecture into a different layout.
- If any style instruction conflicts with geometry preservation, ALWAYS keep geometry unchanged and reduce style intensity instead.
`
          : ''

      imageModelPrompt = isExternal
        ? `${DESIGN_CONTEXT_PREFIX}Professional exterior design visualization.

PROPERTY (from uploaded images – reproduce exactly):
${structSnippet || 'Same building as the uploaded image.'}

STYLE CHANGES TO APPLY (colors, materials, landscaping only – no structural change):
${reconfigSnippet || 'Restyle exterior surfaces.'}

RULES: Same building, same facade, same roof, same doors/windows/balconies/staircase, same proportions. Only change colors, cladding, lighting, and landscaping.`
        : `${DESIGN_CONTEXT_PREFIX}Professional interior design visualization.
${stylePaletteBlock}
ROOM (from uploaded images – reproduce exactly):
${structSnippet || 'Same room as the uploaded image.'}
${strictShellLockInterior}
${strictObjectConservationInterior}
${ultraLayoutInvarianceInterior}
ARCHITECTURE LOCK (MUST NOT CHANGE):
- Do NOT add, remove, move, resize, open/close, or replace any doors, windows, glass doors, glass partitions, wall openings, corridors, or fixed built-ins.
- Keep the exact same walls, floor boundaries, ceiling shape, and all structural/fixed elements exactly as in the uploaded images.
- Stairs and levels: do NOT invent new flights, landings, or balustrades; do NOT change tread count, width, or curve relative to the upload. If stairs are absent or minimal in the upload, do not add a prominent traditional staircase.

INTERIOR CHANGES TO APPLY (furniture and decor only):
${reconfigSnippet || 'Reconfigure interior furniture and decor.'}

RULES: Identical room structure (walls, floor, ceiling, doors, windows, dimensions). Only furniture, finishes, and decor may change. The output must show both the selected design style and the selected color palette clearly and prominently, not subtly. If the chosen style is not obvious at first glance, the output is incorrect.`
    }

    // Always enforce high-fidelity output quality.
    imageModelPrompt += `\n\n${ULTRA_QUALITY_INSTRUCTION}`

    if (inputPixelDims) {
      const { width: pw, height: ph } = inputPixelDims
      const framingLock = isExternal
        ? `\n\nPIXEL AND FRAMING LOCK: The main input is exactly ${pw}×${ph} pixels. Your output image must be exactly ${pw}×${ph} pixels (same width and height). Preserve the full scene edge-to-edge — same extents as the input. Do NOT zoom in, zoom out, or crop away sky, ground, or building edges relative to this framing.`
        : `\n\nPIXEL AND FRAMING LOCK: The main room input is exactly ${pw}×${ph} pixels. Your output image must be exactly ${pw}×${ph} pixels (same width and height). Preserve the IDENTICAL camera position and field of view (not merely the same aspect ratio). The ceiling, top of walls, FULL seating (sofa/chairs — entire pieces including bases), and floor at the bottom must all remain visible as in the input. FORBIDDEN: zooming in, zooming out, cropping off the bottom of sofas, losing the ceiling, or tight “hero” framing on one object. Catalog/product reference images define furniture look only — NEVER match their tight product framing; keep the room as wide and tall as this ${pw}×${ph} photograph.`
      imageModelPrompt += framingLock
    }

    console.log('=== [Generate] Image Model Prompt Start ===')
    console.log(imageModelPrompt)
    console.log('=== [Generate] Image Model Prompt End ===')

    // Step 3: Use image model to generate a new room image.
    // Primary defaults to Gemini 3 Pro preview; fallback is configurable.
    // aspectRatio is only sent when the model supports it (see SUPPORT_ASPECT_RATIO_MODELS).
    const primaryImageModel = process.env.GEMINI_IMAGE_MODEL || 'gemini-3-pro-image-preview'
    const fallbackImageModel = resolveFallbackImageModel(primaryImageModel)
    const aspectRatio = resolveAspectRatio(roomImageParts)
    // Some models (e.g. gemini-3-pro-image-preview, imagen-4.0-generate-001) may not support aspectRatio and return 400 if we send it.
    const SUPPORT_ASPECT_RATIO_MODELS = ['gemini-2.5-flash-preview-05-20', 'gemini-2.5-flash']
    const requestAspectRatio = SUPPORT_ASPECT_RATIO_MODELS.includes(primaryImageModel)
      ? aspectRatio
      : undefined

    // In customization mode with tile/sofa references: add images so the model reproduces the exact tile or sofa.
    const tileRefParts = (customizationReferenceImages ?? []).flatMap((ref) => [
      {
        text:
          ref.elementType === 'floor'
            ? `FLOOR TILE REFERENCE: Replace the ENTIRE floor with the tile's visual appearance (pattern, color, texture) from this image. This reference may contain logos (e.g. MYTYLES) or text – do NOT copy any logo or text into your output. Output must have zero text and zero logos; only the tile pattern, color, and texture.`
            : ref.elementType === 'sofa'
            ? (ref.seatingCapacity || '').toLowerCase().includes('1')
              ? `SOFA REFERENCE — 1-SEATER CATALOG ITEM: ${sofaSeatingSizeConstraint(ref.seatingCapacity || '')} Apply this reference to a SINGLE seat cushion or ONE module of the existing sofa only. Preserve the full multi-seat sofa layout from the input (do not replace the whole sofa with one armchair). Match fabric/color/style of the reference on that one seat only. Do NOT reframe or zoom the room to match this product photo — only change that seat in place. Do NOT copy logos or text. Output: zero text, zero logos.`
              : `SOFA REFERENCE (follow size rules exactly): ${sofaSeatingSizeConstraint(ref.seatingCapacity || '')} User-selected seating type: ${ref.seatingCapacity || 'infer from product name—if it says 3 Seater, output a wide 3-seat sofa'}. Match style, color, and upholstery from this reference image. The reference may be a tight product close-up — IGNORE its framing: do NOT zoom or crop the room to look like the catalog shot; keep the main room image's full field of view (ceiling to floor). Still place the correct seating WIDTH in the room (3-seater = wide sofa, not one armchair). Do NOT copy logos or text. Output: zero text, zero logos.`
            : ref.elementType === 'mattress'
              ? `MATTRESS REFERENCE: Update the mattress (sleeping surface on the bed) to match this product — thickness, quilting, top fabric, and overall look. Keep the same bed frame position and room layout; do NOT zoom or reframe the room to match the catalog shot. Do NOT copy logos or text. Output: zero text, zero logos.`
            : ref.elementType === 'bed'
              ? `BED REFERENCE: Replace the main bed (frame, headboard, and visible upholstery/finish) with this product's style, proportions, and materials. Keep the same room layout, camera, and floor area; the bed should sit naturally on the floor plane. The reference may be a tight product photo — IGNORE its crop; do NOT zoom the room to match the catalog. Do NOT copy logos or text. Output: zero text, zero logos.`
            : ref.elementType === 'carpet' || ref.elementType === 'rug'
              ? `CARPET / RUG REFERENCE: Replace the visible area rug, carpet, or floor mat with this product's pattern, pile, colors, and overall shape (runner, rectangle, round as appropriate). Keep the same room layout, camera, and furniture positions; the rug must sit naturally on the floor plane. The reference may be a tight product photo — IGNORE its crop; do NOT zoom the room. Do NOT copy logos or text. Output: zero text, zero logos.`
            : ref.elementType === 'lighting'
              ? `LIGHTING FIXTURE REFERENCE: Replace or update the visible light fixture(s) in the room (pendant, ceiling, wall sconce, table/floor lamp as appropriate) to match this product's shape, materials, and finish. Keep the same room layout and camera; do NOT zoom to match the catalog crop. Do NOT copy logos or text. Output: zero text, zero logos.`
            : `Reference for ${ref.elementType}: Use ONLY the pattern, color, and texture from this image. Do NOT copy any logo (e.g. MYTYLES), text, names, or codes from the reference – output must contain zero text and zero logos.`,
      },
      { inlineData: { data: ref.data, mimeType: ref.mimeType } },
    ])

    const generationConfig: { temperature: number; aspectRatio?: string } = {
      temperature: isCustomizationMode ? 0 : shuffle ? 0.35 : 0,
    }
    if (requestAspectRatio !== undefined) generationConfig.aspectRatio = requestAspectRatio

    // In locked-layout generation, POST sends exactly one source image (the locked reference) and
    // this is not customization/style-only mode. Keep model output as-is in that case.
    const useLockedLayoutOnly = !isCustomizationMode && images.length === 1

    /** Per-element internal customization: put the room image right after a short template lead so the model locks to this frame (not text-first + image). */
    const hasPerElementCustomization =
      Boolean(customizationLabels && Object.keys(customizationLabels).length > 0)
    const useImageAfterTemplateLead =
      !isExternal && isCustomizationMode && hasPerElementCustomization && roomImageParts[0]?.inlineData?.data

    const componentImageParts = componentParts.slice(0, MAX_COMPONENT_IMAGES_FOR_IMAGE_MODEL).flatMap((comp) =>
      comp.label
        ? [
            { text: `Style reference – ${comp.label}` },
            { inlineData: comp.inlineData },
          ]
        : [{ inlineData: comp.inlineData }]
    )

    const templateLeadText =
      roomImageParts.length > 1
        ? 'TEMPLATE PHOTO EDIT — The very NEXT part is the LOCKED LAYOUT image that must remain the structural source of truth for the entire flow. If another room image appears after the instructions, treat it as the CURRENT RESULT / appearance reference only. Preserve geometry, camera, framing, crop, walls, openings, floor lines, ceiling lines, and overall layout from the first locked layout image, while carrying forward approved visual changes from the current-result reference except where the new instructions explicitly change them.\n\nOUTPUT = the SAME layout photograph: identical framing, camera, top/bottom/left/right crop, ceiling visible, full seating visible — ONLY the instructed style/material/color changes may differ.\n\nFORBIDDEN: changing room layout, re-shooting the room, zoom, tighter crop, new angle, stepping closer, or drifting away from the selected locked layout image.\n\n---\n\n'
        : 'TEMPLATE PHOTO EDIT — The very NEXT part is the room image (your locked layout source).\n\nOUTPUT = this SAME photograph: identical framing, camera, top/bottom/left/right crop, ceiling visible, full seating visible — ONLY the surfaces named in the instructions AFTER the image change material/color/pattern.\n\nFORBIDDEN: re-shooting the room, zoom, tighter crop, new angle, stepping closer, less sofa or less ceiling than this image, or copying catalog/product photo framing.\n\n---\n\n'

    const imageModelUserParts: object[] = useImageAfterTemplateLead
      ? [
          {
            text: templateLeadText,
          },
          { inlineData: roomImageParts[0].inlineData },
          { text: imageModelPrompt + '\n\n' + NO_LOGO_INSTRUCTION },
          ...roomImageParts.slice(1, MAX_ROOM_IMAGES_FOR_IMAGE_MODEL).map((p) => ({ inlineData: p.inlineData })),
          ...tileRefParts,
          ...componentImageParts,
        ]
      : [
          { text: imageModelPrompt + '\n\n' + NO_LOGO_INSTRUCTION },
          ...roomImageParts.slice(0, MAX_ROOM_IMAGES_FOR_IMAGE_MODEL).map((p) => ({ inlineData: p.inlineData })),
          ...tileRefParts,
          ...componentImageParts,
        ]

    const buildImageRequestBody = (extraConstraintText?: string): string =>
      JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: extraConstraintText
              ? [...imageModelUserParts, { text: extraConstraintText }]
              : imageModelUserParts,
          },
        ],
        generationConfig,
      })

    const imageRequestBody = buildImageRequestBody()
    const needsNonSquareOutput =
      Boolean(inputPixelDims) && Math.abs((inputPixelDims?.width ?? 0) - (inputPixelDims?.height ?? 0)) > 6
    const STRICT_NON_SQUARE_CONSTRAINT = inputPixelDims
      ? `STRICT OUTPUT SHAPE REQUIREMENT:
- The source room image is NON-SQUARE (${inputPixelDims.width}x${inputPixelDims.height}).
- Your output MUST also be NON-SQUARE and keep the same framing proportions as the source.
- DO NOT return a square image (1:1). Square output is invalid and must be regenerated.`
      : `STRICT OUTPUT SHAPE REQUIREMENT:
- The source room image is NON-SQUARE.
- Your output MUST be NON-SQUARE with the same framing proportions.
- DO NOT return a square image (1:1).`
    const strictShapeRequestBody = buildImageRequestBody(STRICT_NON_SQUARE_CONSTRAINT)
    const sourceDataUrl = roomImageParts[0]?.inlineData?.data
      ? `data:${roomImageParts[0].inlineData.mimeType || 'image/png'};base64,${roomImageParts[0].inlineData.data}`
      : null
    const shouldGuardLayoutDrift =
      !isExternal && !isCustomizationMode && strictLayoutLock !== false && images.length === 1

    /** Call image API with a given model/body. Can reject unexpected square outputs. */
    const callImageModel = async (
      modelName: string,
      body: string,
      options?: { rejectUnexpectedSquare?: boolean }
    ): Promise<{ imageUrl: string | null; rejectedSquare: boolean }> => {
      try {
        const res = await fetchGemini(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body },
          GEMINI_IMAGE_TIMEOUT_MS
        )
        if (!res.ok) {
          let errBody = ''
          try {
            errBody = await res.text()
          } catch {
            /* ignore */
          }
          console.warn(
            `Image model ${modelName} HTTP ${res.status}:`,
            errBody.slice(0, 900) || '(empty body)'
          )
          return { imageUrl: null, rejectedSquare: false }
        }
        const data = await res.json()
        const part = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.data)
        if (!part?.inlineData?.data) {
          const c0 = data.candidates?.[0]
          const fr = c0?.finishReason ?? 'unknown'
          const block = (data as { promptFeedback?: { blockReason?: string } }).promptFeedback?.blockReason
          const textSnippet = c0?.content?.parts?.find((p: { text?: string }) => p.text)?.text
          const apiErr = (data as { error?: { message?: string; code?: number } }).error
          console.warn(
            `Image model ${modelName} returned no image — finishReason: ${fr}${block ? `; promptBlock: ${block}` : ''}`,
            apiErr ? `API error: ${JSON.stringify(apiErr)}` : '',
            textSnippet ? `Model text (not image): ${String(textSnippet).slice(0, 240)}…` : ''
          )
          return { imageUrl: null, rejectedSquare: false }
        }
        const mime = part.inlineData.mimeType || 'image/png'
        const dataUrl = `data:${mime};base64,${part.inlineData.data}`
        const dims = getImageDimensionsFromDataUrl(dataUrl)
        if (dims) {
          console.log(`[Generate] AI image size: ${dims.width}x${dims.height} (model: ${modelName})`)
          if (
            options?.rejectUnexpectedSquare &&
            needsNonSquareOutput &&
            Math.abs(dims.width - dims.height) <= 6
          ) {
            console.warn(
              `[Generate] Rejected square output ${dims.width}x${dims.height} from ${modelName}; expected non-square framing.`
            )
            return { imageUrl: null, rejectedSquare: true }
          }
        }
        return { imageUrl: dataUrl, rejectedSquare: false }
      } catch (err) {
        console.warn(`Image model ${modelName} failed:`, err instanceof Error ? err.message : err)
        return { imageUrl: null, rejectedSquare: false }
      }
    }

    // Try primary model first
    let primaryResult = await callImageModel(primaryImageModel, imageRequestBody, { rejectUnexpectedSquare: true })
    if (!primaryResult.imageUrl && primaryResult.rejectedSquare) {
      console.log(`[Generate] Retrying ${primaryImageModel} once with strict non-square framing constraint.`)
      primaryResult = await callImageModel(primaryImageModel, strictShapeRequestBody, { rejectUnexpectedSquare: true })
    }
    let imageUrl = primaryResult.imageUrl
    if (imageUrl && shouldGuardLayoutDrift && sourceDataUrl) {
      const drift = await estimateLayoutDriftScore(sourceDataUrl, imageUrl)
      if (drift != null && drift >= 0.5) {
        console.warn(
          `[Generate] Layout drift detected (score=${drift.toFixed(3)}). Retrying with stronger structural lock.`
        )
        const layoutRetryBody = buildImageRequestBody(
          'RETRY — HARD STRUCTURE LOCK: Previous output changed architecture/layout. Regenerate as the SAME exact room shell and camera from the first room image. Do NOT alter staircase geometry, doorway/window/opening positions, wall planes, ceiling lines, or corridor widths. Keep unfinished/construction shell state unchanged; only restyle furniture/decor/finishes.'
        )
        const retry = await callImageModel(primaryImageModel, layoutRetryBody, {
          rejectUnexpectedSquare: true,
        })
        if (retry.imageUrl) {
          imageUrl = retry.imageUrl
        }
      }
    }
    if (imageUrl) {
      // For locked-layout mode, keep the model's native size exactly (no resize to input dimensions).
      if (useLockedLayoutOnly) {
        return imageUrl
      }
      return await ensureImageMatchesInputSize(imageUrl, roomImageParts, sizeMatchOptions)
    }

    // If primary keeps returning square output for non-square source, accept one as
    // a last resort and resize to input dimensions instead of falling back unchanged.
    if (!imageUrl && primaryResult.rejectedSquare && needsNonSquareOutput) {
      console.warn(
        `[Generate] ${primaryImageModel} returned square outputs; accepting one and resizing to preserve generation flow.`
      )
      const acceptedSquare = await callImageModel(primaryImageModel, strictShapeRequestBody, {
        rejectUnexpectedSquare: false,
      })
      if (acceptedSquare.imageUrl) {
        if (useLockedLayoutOnly) {
          return acceptedSquare.imageUrl
        }
        return await ensureImageMatchesInputSize(
          acceptedSquare.imageUrl,
          roomImageParts,
          sizeMatchOptions
        )
      }
    }

    if (fallbackImageModel) {
      console.log(`Primary image model (${primaryImageModel}) failed; trying fallback ${fallbackImageModel}.`)
      let fallbackResult = await callImageModel(fallbackImageModel, imageRequestBody, { rejectUnexpectedSquare: true })
      if (!fallbackResult.imageUrl && fallbackResult.rejectedSquare) {
        console.log(`[Generate] Retrying ${fallbackImageModel} once with strict non-square framing constraint.`)
        fallbackResult = await callImageModel(fallbackImageModel, strictShapeRequestBody, { rejectUnexpectedSquare: true })
      }
      imageUrl = fallbackResult.imageUrl
      if (imageUrl) {
        console.log('Fallback image model succeeded.')
        if (useLockedLayoutOnly) {
          return imageUrl
        }
        return await ensureImageMatchesInputSize(imageUrl, roomImageParts, sizeMatchOptions)
      }
    } else {
      console.log(`Primary image model (${primaryImageModel}) failed; no distinct fallback model configured.`)
    }

    // Both failed: retry with minimal prompts using fallback model
    const tryImageModel = async (parts: object[], modelName: string): Promise<string | null> => {
      await new Promise((r) => setTimeout(r, 1200))
      // Retries use fallback model; do not send aspectRatio (not supported by imagen-4.0 etc.)
      const body = JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: { temperature: 0 },
      })
      const result = await callImageModel(modelName, body)
      return result.imageUrl
    }

    const minimalPrompt = isExternal
      ? `${DESIGN_CONTEXT_PREFIX}Restyle the exterior of the building in the uploaded image. Keep the building structure identical. Only change colors, materials, and landscaping.`
      : `${DESIGN_CONTEXT_PREFIX}Redecorate the interior of the room in the uploaded image. Keep the room structure (walls, floor, ceiling, doors, windows) identical. Only change furniture and decor.`

    if (fallbackImageModel) {
      const retry1 = await tryImageModel(
        [{ text: minimalPrompt }, { inlineData: roomImageParts[0].inlineData }],
        fallbackImageModel
      )
      if (retry1) {
        console.log('Retry 1 (minimal prompt, fallback model) succeeded.')
        if (useLockedLayoutOnly) {
          return retry1
        }
        return await ensureImageMatchesInputSize(retry1, roomImageParts, sizeMatchOptions)
      }
    }

    const barePrompt = isExternal
      ? 'Apply a fresh exterior style to this building. Keep the structure the same.'
      : 'Redesign the interior of this room with modern furniture. Keep walls, floor, and ceiling the same.'

    if (fallbackImageModel) {
      const retry2 = await tryImageModel(
        [{ text: barePrompt }, { inlineData: roomImageParts[0].inlineData }],
        fallbackImageModel
      )
      if (retry2) {
        console.log('Retry 2 (bare prompt, fallback model) succeeded.')
        if (useLockedLayoutOnly) {
          return retry2
        }
        return await ensureImageMatchesInputSize(retry2, roomImageParts, sizeMatchOptions)
      }
    }

    console.warn('All image model attempts failed. Falling back to base image.')
    return {
      imageUrl: generateModifiedImage(images[0], imageModelPrompt, enhancedDescription),
      warning: 'Generated image could not be produced; your original image is shown. Try again or simplify the request.',
    }
    
  } catch (error) {
    console.error('Error in image generation:', error)
    const message = error instanceof Error ? error.message : 'Image generation failed'
    // Do not silently return the same placeholder image on transient model outages.
    // Surface a retryable error to the UI so users understand generation did not run.
    if (
      /Gemini API error:\s*(429|500|502|503|504)/i.test(message) ||
      /UNAVAILABLE|RESOURCE_EXHAUSTED|high demand|temporar/i.test(message)
    ) {
      throw new Error('Image model is temporarily unavailable (high demand). Please retry in a few seconds.')
    }
    throw new Error(message)
  }
}

/**
 * Generate a visually modified image using enhanced prompt
 * This creates a modified version that demonstrates the concept
 * In production, this should be replaced with actual AI service
 */
function generateModifiedImage(
  baseImage: string,
  prompt: string,
  description: string
): string {
  // For prototype: Log the enhanced description to show what changes would be made
  console.log('Enhanced configuration description:', description.substring(0, 500))
  console.log('Note: Gemini image model did not return image data. Returning the original image as fallback.')
  
  // Return the base image with a note that actual generation requires an API
  // In a real scenario with an API, this would return the generated image
  return baseImage
}

/**
 * Generate a placeholder image for demonstration
 * In a real implementation, this would be replaced with actual AI API calls
 * 
 * For the prototype, we return the first reference image as a placeholder
 * In production, this would be replaced with actual AI-generated image
 */
function generatePlaceholderImage(images: string[], prompt: string): string {
  // For prototype: return the first reference image as placeholder
  // This demonstrates the flow without requiring an actual AI API
  // In production, replace this with actual image-to-image generation
  
  // Use the first uploaded image as a placeholder
  // This shows the system is working, but the image hasn't been modified by AI
  const placeholderImage = images[0]
  
  // In a real implementation, you would:
  // 1. Send images and prompt to AI service (e.g., Stability AI, Replicate)
  // 2. Receive the generated/modified image
  // 3. Return it as base64 or URL
  
  console.log('Using placeholder image generation. Prompt:', prompt.substring(0, 100) + '...')
  
  return placeholderImage
}

/** Vercel: allow up to 60s for AI image generation (Pro plan). Hobby plan caps at 10s. */
export const maxDuration = 300

/**
 * POST handler for image generation
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  })
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const {
      configType = 'internal',
      images,
      currentResultImage,
      layoutAnchorImage,
      componentReferenceImages,
      componentReferenceLabels,
      configMode,
      purposeInput,
      fullRoomReferenceImages,
      optionalReferenceImages,
      fullRoomAdditionalText,
      arrangementConfig,
      vastuEnabled,
      shuffle,
      customizationStyles,
      customizationLabels,   // Record<elementType, { label, description, isDecor }>
      externalCustomization,
      selectedStyle,
      selectedColorPalette,
      strictLayoutLock = true,
      layoutImageIndex,
      eraseRegion, // optional: { x, y, width, height } normalized 0–1 for image-based erase (inpainting)
      eraseMode, // optional: 'region' | 'full-components'
    } = body

    const extraRefImages = Array.isArray(optionalReferenceImages)
      ? optionalReferenceImages.filter((x: unknown): x is string => typeof x === 'string')
      : []
    const purposeRefImages =
      configMode === 'purpose' && Array.isArray(fullRoomReferenceImages)
        ? fullRoomReferenceImages.filter((x: unknown): x is string => typeof x === 'string')
        : []
    const mergedFullRoomReferenceImages = [...purposeRefImages, ...extraRefImages].slice(0, 4)

    // Customization mode: user is applying visual-only changes to the current result. Use that image as sole input so layout is preserved.
    const hasCustomizationStyles =
      customizationStyles &&
      typeof customizationStyles === 'object' &&
      Object.values(customizationStyles).some((v: unknown) => v != null && v !== '')
    const hasExternalCustomization =
      configType === 'external' &&
      externalCustomization &&
      typeof externalCustomization === 'object' &&
      Object.values(externalCustomization).some((v: unknown) => v != null && v !== '')
    const isCustomizationMode = (hasCustomizationStyles || hasExternalCustomization) && currentResultImage

    // Style-only reconfigure: user changed style/palette in Edit and regenerated — use current result as single input so the new style is applied to this image (avoids keeping old style from original uploads)
    const hasStyleOrPalette = (typeof selectedStyle === 'string' && selectedStyle.trim().length > 0) || (typeof selectedColorPalette === 'string' && selectedColorPalette.trim().length > 0)
    const isStyleOnlyReconfigure =
      typeof currentResultImage === 'string' &&
      currentResultImage.length > 0 &&
      hasStyleOrPalette &&
      !hasCustomizationStyles &&
      !hasExternalCustomization

    // In style-only reconfigure, slightly increase randomness so the model doesn't return an identical-looking image.
    // This does NOT allow layout changes; it only helps the model commit to new style/palette visually.
    const effectiveShuffle = (shuffle || false) || isStyleOnlyReconfigure

    const minImages = 4
    const explicitLayoutAnchorImage =
      typeof layoutAnchorImage === 'string' && layoutAnchorImage.trim().length > 0
        ? layoutAnchorImage.trim()
        : null
    const lockedLayoutImage =
      explicitLayoutAnchorImage ??
      (Array.isArray(images) &&
      typeof layoutImageIndex === 'number' &&
      layoutImageIndex >= 0 &&
      layoutImageIndex < images.length
        ? images[layoutImageIndex]
        : null)
    const hasLayoutAnchor = typeof lockedLayoutImage === 'string' && lockedLayoutImage.length > 0

    // Keep the selected layout image as the ONLY structural source throughout the flow.
    // This prevents layout/camera drift when users regenerate after editing.
    const currentResultTrimmed =
      typeof currentResultImage === 'string' && currentResultImage.trim().length > 0
        ? currentResultImage.trim()
        : null
    let imagesForGeneration: string[] = Array.isArray(images) ? images : []
    if (hasLayoutAnchor && currentResultTrimmed && currentResultTrimmed !== lockedLayoutImage && (isCustomizationMode || isStyleOnlyReconfigure)) {
      imagesForGeneration = [lockedLayoutImage!, currentResultTrimmed]
    } else if (hasLayoutAnchor) {
      imagesForGeneration = [lockedLayoutImage!]
    } else if ((isCustomizationMode || isStyleOnlyReconfigure) && typeof currentResultImage === 'string') {
      imagesForGeneration = [currentResultImage]
    }

    // Locked-layout generation across all modes: only the fixed layout image is used.
    const useLockedLayoutOnly =
      hasLayoutAnchor &&
      imagesForGeneration.length === 1

    if (!imagesForGeneration || !Array.isArray(imagesForGeneration) || imagesForGeneration.length === 0) {
      return NextResponse.json(
        { error: 'At least one image is required' },
        { status: 400 }
      )
    }
    if (!isCustomizationMode && !isStyleOnlyReconfigure && !useLockedLayoutOnly && imagesForGeneration.length < minImages) {
      return NextResponse.json(
        { error: 'At least 4 images are required' },
        { status: 400 }
      )
    }

    if (!configMode || !['purpose', 'arrangement', 'customization'].includes(configMode)) {
      return NextResponse.json(
        { error: 'Invalid configuration mode' },
        { status: 400 }
      )
    }

    // ----- Image-based erase (inpainting): user drew a region on the image to remove -----
    const hasEraseRegion =
      configType === 'internal' &&
      eraseRegion &&
      typeof eraseRegion === 'object' &&
      typeof eraseRegion.x === 'number' &&
      typeof eraseRegion.y === 'number' &&
      typeof eraseRegion.width === 'number' &&
      typeof eraseRegion.height === 'number' &&
      eraseRegion.width > 0 &&
      eraseRegion.height > 0
    if (hasEraseRegion) {
      const geminiApiKey = process.env.IMAGE_GENERATION_API_KEY
      if (!geminiApiKey) {
        return NextResponse.json(
          { error: 'Image generation API key is not configured' },
          { status: 500 }
        )
      }
      // Use current result if available (customizing after first generation), else layout image
      const sourceImageUrl =
        (typeof currentResultImage === 'string' && currentResultImage.trim())
          ? currentResultImage
          : Array.isArray(images) && typeof layoutImageIndex === 'number' && layoutImageIndex >= 0 && layoutImageIndex < images.length
            ? images[layoutImageIndex]
            : images?.[0]
      if (!sourceImageUrl || typeof sourceImageUrl !== 'string') {
        return NextResponse.json(
          { error: 'Missing image for erase. Upload a layout image or generate once first.' },
          { status: 400 }
        )
      }
      let sourceBuffer: Buffer
      let sourceMime = 'image/png'
      if (!sourceImageUrl.includes(',')) {
        return NextResponse.json(
          { error: 'Invalid source image for erase (expected data URL)' },
          { status: 400 }
        )
      }
      const [header, b64] = sourceImageUrl.split(',')
      sourceBuffer = Buffer.from(b64!, 'base64')
      const m = header?.match(/data:([^;]+)/)
      if (m) sourceMime = m[1].toLowerCase().startsWith('image/') ? m[1] : 'image/png'
      try {
        const { buffer: maskBuffer } = await createEraseMaskImage(sourceBuffer, eraseRegion)
        const maskB64 = maskBuffer.toString('base64')
        const maskDataUrl = `data:image/png;base64,${maskB64}`
        const sourceDataUrlForBlend =
          typeof sourceImageUrl === 'string' && sourceImageUrl.includes(',')
            ? sourceImageUrl.trim()
            : `data:${sourceMime};base64,${sourceBuffer.toString('base64')}`
        const blendEraseToMask = async (outDataUrl: string): Promise<string> => {
          const blended = await compositeAddOutputOntoSource(outDataUrl, sourceDataUrlForBlend, maskDataUrl, {
            hardMask: true,
          })
          return blended ?? outDataUrl
        }
        const isFullComponentsErase = eraseMode === 'full-components'
        const inpaintingPrompt = isFullComponentsErase
          ? DESIGN_CONTEXT_PREFIX +
            NO_LOGO_INSTRUCTION +
            '\n\nFULL COMPONENT ERASE — STRICT INPAINTING (two inputs):\n' +
            '1) FIRST image: the full room photo (source).\n' +
            '2) SECOND image: a binary mask — pure WHITE pixels = editable area; pure BLACK = protected area.\n\n' +
            'TASK: Remove ALL movable room components visible inside the white region, including furniture and soft furnishings such as sofas, chairs, tables, beds, rugs/mats, curtains, decor accessories, and movable lighting fixtures. Fill the region so it looks like a clean empty room shell while preserving architecture and realism.\n\n' +
            'HARD RULES:\n' +
            '- Preserve permanent architecture exactly: walls, floor, ceiling, doors, windows, fixed partitions, stair geometry, built-in structural elements.\n' +
            '- Do NOT change camera angle, perspective, framing, or global style.\n' +
            '- Do NOT introduce new objects or replacement furniture.\n' +
            '- Keep edits inside the white region and blend naturally at boundaries.\n' +
            '- Output MUST match source pixel dimensions exactly (no crop/zoom).\n' +
            '- No text, logos, or labels in output.\n\n' +
            'Goal: the room should look naturally empty of movable components.'
          : DESIGN_CONTEXT_PREFIX +
            NO_LOGO_INSTRUCTION +
            '\n\nREGION ERASE — STRICT INPAINTING (two inputs):\n' +
            '1) FIRST image: the full room/property photo (source).\n' +
            '2) SECOND image: a binary mask — pure WHITE pixels = ONLY those pixels may be edited; pure BLACK = absolutely forbidden to change (must match source exactly, pixel-for-pixel).\n\n' +
            'TASK: Remove ONLY what lies inside the white mask (typically one object or one tight cluster the user boxed). Inpaint that white region so it blends with the immediate surroundings (continue floor, wall, deck, sky, or background texture logically).\n\n' +
            'HARD RULES:\n' +
            '- Do NOT erase, repaint, move, or alter ANY object, surface, plant, shadow, or detail that touches or lies outside the white mask. Adjacent chairs, tables, walls, cabinets, plants, and ground must remain unchanged.\n' +
            '- Do NOT widen the edit beyond the white region. No “cleanup” outside the box. No global relighting or style change.\n' +
            '- Do NOT remove multiple separate objects unless they are fully inside the same white region.\n' +
            '- Output MUST be the same pixel width and height as the first image. Same framing and camera — no crop, no zoom.\n' +
            '- No text, logos, or labels in the output.\n\n' +
            'If in doubt, change fewer pixels — only inside white.'
        const primaryImageModel = process.env.GEMINI_IMAGE_MODEL || 'gemini-3-pro-image-preview'
        const fallbackImageModel = resolveFallbackImageModel(primaryImageModel)
        const roomImagePartsForErase = [{ inlineData: { data: sourceBuffer.toString('base64'), mimeType: sourceMime } }]
        const inpaintingBody = JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: inpaintingPrompt },
                { inlineData: roomImagePartsForErase[0].inlineData },
                { text: 'Mask (white = area to remove and fill seamlessly):' },
                { inlineData: { data: maskB64, mimeType: 'image/png' } },
              ],
            },
          ],
          generationConfig: { temperature: 0 },
        })
        const res = await fetchGemini(
          `https://generativelanguage.googleapis.com/v1beta/models/${primaryImageModel}:generateContent?key=${geminiApiKey}`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: inpaintingBody },
          GEMINI_IMAGE_TIMEOUT_MS
        )
        if (res.ok) {
          const data = await res.json()
          const part = data.candidates?.[0]?.content?.parts?.find((p: { inlineData?: { data: string; mimeType?: string } }) => p.inlineData?.data)
          if (part?.inlineData?.data) {
            const mime = part.inlineData.mimeType || 'image/png'
            let dataUrl = `data:${mime};base64,${part.inlineData.data}`
            dataUrl = await ensureImageMatchesInputSize(dataUrl, roomImagePartsForErase)
            dataUrl = await blendEraseToMask(dataUrl)
            return NextResponse.json({ imageUrl: dataUrl })
          }
        }
        if (fallbackImageModel) {
          console.warn(`Erase inpainting: primary model failed, trying fallback ${fallbackImageModel}.`)
          const res2 = await fetchGemini(
            `https://generativelanguage.googleapis.com/v1beta/models/${fallbackImageModel}:generateContent?key=${geminiApiKey}`,
            { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: inpaintingBody },
            GEMINI_IMAGE_TIMEOUT_MS
          )
          if (res2.ok) {
            const data = await res2.json()
            const part = data.candidates?.[0]?.content?.parts?.find((p: { inlineData?: { data: string; mimeType?: string } }) => p.inlineData?.data)
            if (part?.inlineData?.data) {
              const mime = part.inlineData.mimeType || 'image/png'
              let dataUrl = `data:${mime};base64,${part.inlineData.data}`
              dataUrl = await ensureImageMatchesInputSize(dataUrl, roomImagePartsForErase)
              dataUrl = await blendEraseToMask(dataUrl)
              return NextResponse.json({ imageUrl: dataUrl })
            }
          }
        } else {
          console.warn('Erase inpainting: primary model failed and no distinct fallback model configured.')
        }
      } catch (err) {
        console.error('Erase inpainting failed:', err)
        return NextResponse.json(
          { error: err instanceof Error ? err.message : 'Erase (inpainting) failed' },
          { status: 500 }
        )
      }
      return NextResponse.json(
        { error: 'Erase (inpainting) could not be completed. Try again or use a smaller region.' },
        { status: 502 }
      )
    }

    // Validate configuration based on mode (Full Room: style is sufficient; reference images/text are optional)
    if (configMode === 'purpose') {
      const hasRefImages = mergedFullRoomReferenceImages.length > 0
      const hasText = typeof purposeInput === 'string' && purposeInput.trim().length > 0
      const hasExtraText =
        typeof fullRoomAdditionalText === 'string' && fullRoomAdditionalText.trim().length > 0
      const hasStyle = typeof selectedStyle === 'string' && selectedStyle.trim().length > 0
      if (!hasRefImages && !hasText && !hasExtraText && !hasStyle) {
        return NextResponse.json(
          { error: 'Please select a design style, and optionally add a description or upload reference image(s).' },
          { status: 400 }
        )
      }
    }

    if (configMode === 'arrangement' && !isStyleOnlyReconfigure && !arrangementConfig) {
      return NextResponse.json(
        { error: 'Arrangement configuration is required for arrangement-based configuration' },
        { status: 400 }
      )
    }

    // Build the base AI prompt. For style-only reconfigure use a purpose-mode style prompt so the model gets a clear "replace style and palette" task, not arrangement text.
    const promptConfigMode = isStyleOnlyReconfigure ? 'purpose' : configMode
    const promptPurposeInput = isStyleOnlyReconfigure
      ? 'Apply the selected design style and color palette to this room image. Keep layout, structure, and camera angle identical; change only the visual style and colors.'
      : purposeInput
    let prompt = buildPrompt({
      configType: configType === 'external' ? 'external' : 'internal',
      configMode: promptConfigMode,
      purposeInput: promptConfigMode === 'purpose' ? promptPurposeInput : purposeInput,
      fullRoomAdditionalText,
      arrangementConfig: isStyleOnlyReconfigure ? undefined : arrangementConfig,
      vastuEnabled,
      shuffle: effectiveShuffle,
      customizationStyles,
      customizationLabels:
        customizationLabels && typeof customizationLabels === 'object' ? customizationLabels : undefined,
      externalCustomization:
        configType === 'external' && externalCustomization && typeof externalCustomization === 'object'
          ? externalCustomization
          : undefined,
      selectedStyle: selectedStyle ?? undefined,
      selectedColorPalette: selectedColorPalette ?? undefined,
    })

    // Style-only reconfigure: user changed style/palette in Edit — output must REPLACE the existing style and palette with the new one (do not retain previous look)
    if (isStyleOnlyReconfigure) {
      const styleLabel = (typeof selectedStyle === 'string' && selectedStyle.trim()) ? selectedStyle.trim() : 'the selected'
      const paletteLabel = (typeof selectedColorPalette === 'string' && selectedColorPalette.trim()) ? selectedColorPalette.trim() : ''
      prompt =
        `STYLE-ONLY RECONFIGURE – REPLACE EXISTING STYLE AND PALETTE:
The SINGLE image below is the CURRENT room. The user has chosen a NEW design style and/or color palette. Your output MUST:
- Show the SAME room (same layout, structure, camera angle, proportions) but with the visual style and color palette COMPLETELY REPLACED by the new selection.
- Apply ${styleLabel} style and${paletteLabel ? ` the "${paletteLabel}" color palette` : ' the selected color palette'} to the entire room. The result must CLEARLY reflect this new style and palette.
- Do NOT retain the previous visual style (e.g. if the current image is Japanese or pastel, the output must NOT look Japanese or pastel — it must look like the NEW style and palette).
- Preserve layout, furniture positions, and room structure; change ONLY the look: colors, materials, textures, mood, and style expression to match the new style and palette.
- The output MUST look NOTICEABLY DIFFERENT from the input image in overall color scheme and finishes. If it looks the same, it is wrong.

` + prompt
    }

    // Locked layout: user chose one image as layout reference. We send ONLY that image. Output must preserve layout, structure, angle; only change style, colors, components.
    const isExternal = configType === 'external'
    if (!isStyleOnlyReconfigure && useLockedLayoutOnly) {
      prompt =
        `LOCKED LAYOUT – RECONFIGURE THIS IMAGE ONLY (FULL IMAGE REQUIRED):
You receive ONE image below. This is the user's locked layout reference. Your output MUST:
- Show the FULL image: the ENTIRE scene from edge to edge, same composition as the input. Do NOT crop, zoom in, or show only a portion. Everything visible in the input (full building/property, sky, ground, boundaries) must be visible in the output with the same framing.
- Keep the EXACT same layout, structure, camera angle, wall positions, and proportions. Do NOT change the room/structure geometry or the picture angle.
- STRUCTURE FROZEN: Do NOT add, remove, relocate, or resize permanent architecture compared to this image—${isExternal ? 'no new wings, floors, staircases, balconies, or boundary walls' : 'including stair flights, landings, balustrades, partition walls, full-height builtins, doorways, arches, windows, ceiling shape, and columns'}. Style must not override geometry: e.g. do not draw a traditional wooden staircase or new credenza wall if the upload does not show that structure.
- Change ONLY: styles, colors, materials, textures, and ${isExternal ? 'non-structural exterior treatment (facade materials, landscaping, lighting)' : 'furniture, decor, and surface finishes (paint, wallpaper, flooring) inside the existing shell'}.
- The result must look like the SAME photograph from the SAME viewpoint with only visual/style updates. Same field of view, same edges, complete scene.

` + prompt
    } else if (!isStyleOnlyReconfigure) {
      prompt =
        `FIXED LAYOUT: The FIRST image in the set below is the single source of layout and framing for this generation. Your output MUST show the FULL ${isExternal ? 'property' : 'room'} from this exact viewpoint and framing - the complete scene from edge to edge. Do NOT crop, zoom in, or focus on one corner or one element. Preserve the complete view. ${isExternal ? 'Do not add or remove structural massing.' : 'Do not add or remove staircases, doorways, windows, partition walls, or builtins that change the shell—only reconfigure style, furniture, finishes, and colors.'}\n\n` +
        prompt
    }

    if (hasLayoutAnchor && (isCustomizationMode || isStyleOnlyReconfigure)) {
      prompt =
        `GLOBAL LAYOUT LOCK (APPLIES TO THIS STEP TOO):
- The FIRST image below is the permanently locked layout selected by the user in Step 2.
- Keep this exact layout, geometry, and camera framing unchanged.
- If a SECOND image is provided (current result), use it ONLY as a visual state reference for ongoing edits.
- Never alter structure/framing away from the locked FIRST image.\n\n` + prompt
    }

    if (isCustomizationMode) {
      const isExternal = configType === 'external'
      prompt =
        (isExternal
          ? `EXTERIOR CUSTOMIZATION MODE – STRUCTURE AND SIZE MUST NOT CHANGE:
The SINGLE image provided below is the CURRENT RESULT. Your output MUST be this EXACT exterior with ONLY the visual changes listed in "EXTERIOR CUSTOMIZATION OVERRIDES" applied.
- CRITICAL: Output MUST have the SAME image dimensions, aspect ratio, and pixel size as the input. Do NOT resize, crop, or change the frame.
- Do NOT change building structure, layout, camera angle, proportions, or any element's position or size.
- Do NOT add, remove, or move facade, windows, doors, balconies, or structural elements.
- ONLY change the elements explicitly listed in EXTERIOR CUSTOMIZATION OVERRIDES. Do NOT change any other part of the building or scene unless it is listed there. All other pixels must remain as in the provided image.

`
          : `CUSTOMIZATION MODE – LAYOUT AND SIZE MUST NOT CHANGE:
SAME LAYOUT, NO ZOOM: The output must be the EXACT same camera view and framing as the input image. Only the tile/material on the surfaces listed in CUSTOMIZATION OVERRIDES (e.g. walls, floor) may change. Do NOT zoom in. Do NOT crop. Do NOT change the field of view. The result must look like the same photograph with only different tiles on the selected surfaces – layout and framing stay identical.

OUTPUT = SAME PHOTO + ONLY SELECTED CUSTOMIZATIONS: The result must match the current result image pixel-for-pixel in layout (ceiling, floor, full sofa, doors, glass) — only the overridden surfaces may look different. This is a retouch of one image, not a new photograph.

The SINGLE image provided below is the CURRENT RESULT. Your output MUST be this EXACT image with ONLY the visual changes listed in "CUSTOMIZATION OVERRIDES" applied.
- CRITICAL: Output MUST have the SAME image dimensions, aspect ratio, and pixel size as the input. Do NOT resize, crop, or change the frame in any way. The output image must be the same width and height as the input.
- CRITICAL – NO ZOOM: Do NOT zoom in or show a closer view. The output must show the FULL scene from edge to edge – the exact same field of view as the input. Everything visible in the input (all walls, ceiling, floor, sofa, reception desk, plants, furniture) must remain visible in the output at the same scale and distance. No tighter crop, no zoomed-in framing.
- Do NOT change layout, composition, camera angle, proportions, or any element's position, size, or shape.
- Do NOT add, remove, or move any furniture, walls, floor, ceiling, or decor.
- Do NOT add, remove, or change doors, glass doors, glass partitions, or wall openings. Keep every door, partition, and opening exactly as in the input image – if the input has no glass door in a spot, do not draw one; if it has one, do not remove it.
- GLAZING: Any glass door, window, partition, or transparent panel visible in the input MUST remain visible and transparent in the output with the same shape and location. Wall or floor tile changes must NOT cover, remove, or replace glass with solid wall.
- ONLY change the elements explicitly listed in CUSTOMIZATION OVERRIDES. Do NOT change floor, walls, ceiling, or any other element unless it is explicitly listed there. If floor is not in the overrides, keep the floor exactly as in the input image. Same for every other element – only modify what is listed.
- The result must look like the same photograph with only those selected components restyled; everything else identical, including exact same image size and framing.

`) + prompt
    }

    // If we have labeled component references, append a clear summary
    if (componentReferenceLabels && componentReferenceLabels.length > 0) {
      const lines = componentReferenceLabels
        .map((label: string, index: number) => label && label.trim()
          ? `- Ref ${index + 1}: ${label.trim()}`
          : null)
        .filter(Boolean)

      if (lines.length > 0) {
        prompt +=
          `\n\n4. Component reference styles provided by the user:\n` +
          `${lines.join('\n')}\n\n` +
          `Use these reference styles when introducing or replacing components in the room (e.g., plants, seating, storage, lighting).`
      }
    }

    // Log prompt summary for debugging
    const promptSummary = buildPromptSummary({
      configType: configType === 'external' ? 'external' : 'internal',
      configMode,
      purposeInput,
      arrangementConfig,
      vastuEnabled,
      shuffle: effectiveShuffle,
      selectedStyle: selectedStyle ?? undefined,
      selectedColorPalette: selectedColorPalette ?? undefined,
    })
    console.log('Generating image with prompt:', promptSummary)
    console.log('=== [Generate] Base Prompt Start ===')
    console.log(prompt)
    console.log('=== [Generate] Base Prompt End ===')

    // For customization mode: fetch or parse tile reference images (floor/wall) so the AI can reproduce the exact tile.
    // Supports both data URLs (client-sent base64) and http(s) URLs.
    let customizationReferenceImages: Array<{ elementType: string; data: string; mimeType: string }> = []
    if (isCustomizationMode && customizationLabels && typeof customizationLabels === 'object') {
      const labelMap = customizationLabels as Record<string, CustomizationLabelEntry>
      const entries = Object.entries(labelMap).filter(
        (e): e is [string, CustomizationLabelEntry] =>
          Boolean(e[1]?.referenceImageUrl) &&
          (e[0] === 'floor' ||
            e[0] === 'wall' ||
            e[0] === 'ceiling' ||
            e[0] === 'sofa' ||
            e[0] === 'chair' ||
            e[0] === 'mattress' ||
            e[0] === 'bed' ||
            e[0] === 'carpet' ||
            e[0] === 'rug' ||
            e[0] === 'lighting' ||
            e[0] === 'decor' ||
            e[0] === 'table' ||
            e[0] === 'desk' ||
            e[0] === 'dining' ||
            e[0] === 'cabinet')
      )
      for (const [elementType, entry] of entries) {
        const ref = await getImageBase64FromUrl(entry.referenceImageUrl!)
        if (ref) {
          const refImage: CustomizationReferenceImage = { elementType, data: ref.data, mimeType: ref.mimeType }
          if (elementType === 'sofa') {
            const cap = resolveSofaSeatingCapacity(entry)
            if (cap) refImage.seatingCapacity = cap
          }
          customizationReferenceImages.push(refImage)
        }
      }
    }

    // Generate the image using AI (or placeholder). In customization/style-only mode we pass only the current result so layout is preserved; omit reference images in style-only mode so the new style/palette are not overridden by old references.
    const result = await generateImageWithAI(
      imagesForGeneration,
      prompt,
      isCustomizationMode || isStyleOnlyReconfigure ? undefined : componentReferenceImages,
      isCustomizationMode || isStyleOnlyReconfigure ? undefined : componentReferenceLabels,
      isCustomizationMode || isStyleOnlyReconfigure ? undefined : mergedFullRoomReferenceImages,
      isCustomizationMode || isStyleOnlyReconfigure ? undefined : fullRoomAdditionalText,
      isCustomizationMode || isStyleOnlyReconfigure ? undefined : purposeInput,
      configType === 'external' ? 'external' : 'internal',
      effectiveShuffle,
      !!isCustomizationMode || !!isStyleOnlyReconfigure,
      customizationLabels && typeof customizationLabels === 'object' ? customizationLabels : undefined,
      selectedStyle ?? undefined,
      selectedColorPalette ?? undefined,
      customizationReferenceImages.length > 0 ? customizationReferenceImages : undefined,
      strictLayoutLock !== false
    )

    const imageUrl = typeof result === 'string' ? result : result.imageUrl
    const warning = typeof result === 'string' ? undefined : result.warning

    return NextResponse.json({
      success: true,
      imageUrl,
      ...(warning && { warning }),
      promptSummary,
    })
  } catch (error) {
    console.error('Error generating image:', error)
    const msg = error instanceof Error ? error.message : 'Internal server error'
    const status =
      /temporarily unavailable|high demand|retry/i.test(msg) ? 503 : 500
    return NextResponse.json(
      {
        error: msg,
      },
      { status }
    )
  }
}
