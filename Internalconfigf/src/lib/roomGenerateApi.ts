import { buildApiUrl, getApiBaseUrlHelpText } from './apiUrl'

/** Convert blob: URLs from uploads to data URLs for POST /api/generate (Next app expects data:image/...;base64,...). */
export async function blobUrlToDataUrl(blobUrl: string): Promise<string> {
  const res = await fetch(blobUrl)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(new Error('Failed to read image'))
    r.readAsDataURL(blob)
  })
}

/** Map Figma/RoomConfigStudio palette labels → ids used by `app/utils/promptBuilder` / `/api/generate`. */
export function paletteDisplayNameToApiId(name: string | null | undefined): string | undefined {
  if (!name?.trim()) return undefined
  const map: Record<string, string> = {
    'Surprise Me': 'surprise_me',
    'High-Contrast Neutrals': 'high_contrast_neutrals',
    'Forest-Inspired': 'forest_inspired',
    Romance: 'romance',
    'Ocean Breeze': 'ocean_breeze',
    'Sunset Warmth': 'sunset_warmth',
    'Earth Tones': 'earth_tones',
    Monochrome: 'monochrome',
    'Jewel Tones': 'jewel_tones',
    'Pastel Dreams': 'pastel_dreams',
    Industrial: 'industrial',
    'Coastal Serenity': 'coastal_serenity',
    'Autumn Harvest': 'autumn_harvest',
    'Lavender Mist': 'lavender_mist',
  }
  return map[name.trim()] ?? undefined
}

export type RoomWizardSession = {
  imagesDataUrl: string[]
  /** Mirrors room-configuration backend config modes. */
  configMode: 'purpose' | 'arrangement'
  /**
   * Custom Room Components path: user skipped Figma style + palette steps.
   * First `/api/generate` call omits selectedStyle / selectedColorPalette so the backend does not impose a regional style.
   */
  omitWizardStyleAndPalette?: boolean
  /** Optional style reference images (data URLs) from preferences step. */
  optionalReferenceImages?: string[]
  /** Optional component reference images (data URLs) for arrangement mode. */
  componentReferenceImages?: string[]
  /** Labels for component reference images (same order as componentReferenceImages). */
  componentReferenceLabels?: string[]
  /** Arrangement payload shape used by app/utils/promptBuilder.ts */
  arrangementConfig?: {
    existingComponentsNote: string
    removedComponentsNote?: string
    newComponentsNote: string
    arrangementPreferencesText: string
  }
  layoutIndex: number
  style: string
  paletteName: string | null
  configType: 'internal' | 'external'
  /** Optional user notes about the room or site; sent as `fullRoomAdditionalText` to `/api/generate`. */
  roomContext?: string
  /** Optional notes from Reference & Preferences step (style direction, materials, culture, etc.). */
  additionalNotes?: string
}

function buildFullRoomAdditionalText(session: RoomWizardSession): string | undefined {
  const a = session.roomContext?.trim()
  const b = session.additionalNotes?.trim()
  if (a && b) {
    return `Room / site context:\n${a}\n\nReconfiguration preferences (apply together with the selected design style and color palette):\n${b}`
  }
  if (b) {
    return `Reconfiguration preferences (apply together with the selected design style and color palette):\n${b}`
  }
  if (a) return a
  return undefined
}

export type GenerateResponse = { imageUrl?: string; error?: string; warning?: string }

/** Matches `/api/generate` customization label entries (see `app/page.tsx` resolvedCustomizationLabels). */
export type CustomizationLabelEntry = {
  label: string
  description: string
  isDecor: boolean
  action?: 'edit' | 'add' | 'replace' | 'erase'
  referenceImageUrl?: string
}

/** Map Edit panel category labels → element keys expected by `app/api/generate` and prompt builder. */
export function mapEditCategoryToApiElement(category: string): string {
  const m: Record<string, string> = {
    Wall: 'wall',
    Floor: 'floor',
    Carpet: 'carpet',
    Ceiling: 'ceiling',
    Glass: 'glass-partition',
    Partition: 'glass-partition',
    Sofa: 'sofa',
    Bed: 'bed',
    Mattress: 'mattress',
    Chair: 'chair',
    Desk: 'desk',
    Table: 'table',
    Dining: 'dining',
    Cabinet: 'cabinet',
    Door: 'door',
    Window: 'window',
    Decor: 'decor',
    Lighting: 'lighting',
  }
  return m[category] ?? category.toLowerCase().replace(/\s+/g, '-')
}

/** Style grid key when the user picked a Supabase catalog row (not a generic “Modern” preset). */
const CATALOG_PRODUCT_STYLE_KEY_RE =
  /^(mytyles-\d+|(?:sofa|chair|bed|mattress|carpet|lighting|table|dining|desk|decor|cabinet)_\d+)$/i

export function isCatalogProductStyleKey(key: string | null | undefined): boolean {
  const k = key?.trim()
  if (!k) return false
  return CATALOG_PRODUCT_STYLE_KEY_RE.test(k)
}

/**
 * Extra prompt text for add / replace / edit when a catalog product (or tile) is selected with a reference image.
 * Pushes the model away from inventing companion objects or “similar” substitutes.
 */
export const EXACT_CATALOG_OBJECT_INSTRUCTION =
  'Exact catalog selection: reproduce only the single specific product or surface shown in the reference — same silhouette, part count, materials, and colors. Do not add any extra furniture, decor, plants, people, lighting, side tables, duplicate pieces, or staging props. Do not substitute a different model or a creative variation. The masked result must contain only this one faithful item (or one coherent tiled field for wall/floor swatches), integrated into the scene — nothing more.'

export async function postCustomizationGenerate(opts: {
  configType: 'internal' | 'external'
  currentResultImage: string
  customizationStyles: Record<string, string>
  customizationLabels: Record<string, CustomizationLabelEntry>
  selectedStyle?: string
  selectedColorPaletteId?: string
}): Promise<GenerateResponse> {
  const cur = opts.currentResultImage?.trim()
  if (!cur) {
    return { error: 'No room image to customize. Generate once first or ensure a layout image is available.' }
  }
  const hasStyle = Object.values(opts.customizationStyles).some((v) => v != null && String(v).trim() !== '')
  if (!hasStyle) {
    return { error: 'Nothing selected to apply.' }
  }

  let res: Response
  try {
    res = await fetch(buildApiUrl('/api/generate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        configType: opts.configType,
        configMode: 'customization',
        images: [cur],
        layoutImageIndex: 0,
        currentResultImage: cur,
        customizationStyles: opts.customizationStyles,
        customizationLabels: opts.customizationLabels,
        vastuEnabled: false,
        ...(opts.selectedStyle?.trim() ? { selectedStyle: opts.selectedStyle.trim() } : {}),
        ...(opts.selectedColorPaletteId?.trim() ? { selectedColorPalette: opts.selectedColorPaletteId.trim() } : {}),
      }),
    })
  } catch (e) {
    const isNet =
      e instanceof TypeError &&
      (String(e.message).includes('fetch') ||
        String(e.message).includes('Failed to fetch') ||
        String(e.message).includes('NetworkError'))
    return {
      error: isNet
        ? `Could not reach the room-configuration API. Start the Next.js app locally or set VITE_API_BASE_URL to your deployed backend. Current target: ${getApiBaseUrlHelpText()}.`
        : e instanceof Error
          ? e.message
          : 'Request failed.',
    }
  }
  const text = await res.text()
  let data: GenerateResponse
  try {
    data = JSON.parse(text) as GenerateResponse
  } catch {
    return { error: res.ok ? 'Invalid JSON from server' : text || res.statusText }
  }
  if (!res.ok) {
    return { error: data.error || text || `Request failed (${res.status})` }
  }
  return data
}

/** Normalized rectangle (0–1) for `/api/generate` `eraseRegion` — same as `app/components/EraseRegionSelector`. */
export type EraseRegionNormalized = { x: number; y: number; width: number; height: number }

const GLOBAL_CATEGORIES = ['wall', 'floor', 'ceiling'] as const

function isGlobalSurfaceCategory(category?: string | null): boolean {
  if (!category) return false
  return (GLOBAL_CATEGORIES as readonly string[]).includes(category)
}

function dilateNormalizedRect(
  box: EraseRegionNormalized,
  grow: number
): EraseRegionNormalized {
  const x = Math.max(0, box.x - box.width * grow)
  const y = Math.max(0, box.y - box.height * grow)
  const r = Math.min(1, box.x + box.width * (1 + grow))
  const b = Math.min(1, box.y + box.height * (1 + grow))
  return {
    x,
    y,
    width: Math.max(0.01, r - x),
    height: Math.max(0.01, b - y),
  }
}

function matchesCategoryGeometry(
  category: string,
  bx: number,
  by: number,
  bw: number,
  bh: number,
  iw: number,
  ih: number
): boolean {
  const xr = bw / Math.max(1, iw)
  const yr = bh / Math.max(1, ih)
  if (category === 'wall') {
    // Vertical plane: tall-ish and usually not only a floor strip.
    return yr >= 0.25 && by <= ih * 0.88
  }
  if (category === 'floor') {
    // Floor tends to occupy lower half and often touches bottom boundary.
    const touchesBottom = by + bh >= ih - 4
    return yr >= 0.2 && by >= ih * 0.2 && (touchesBottom || yr >= 0.35)
  }
  if (category === 'ceiling') {
    // Ceiling tends to upper area and often touches top boundary.
    const touchesTop = by <= 3
    return yr >= 0.1 && by + bh <= ih * 0.7 && (touchesTop || by <= ih * 0.25)
  }
  return xr > 0 && yr > 0
}

async function detectExpandedSurfaceBox(
  imageDataUrl: string,
  box: EraseRegionNormalized,
  category: string
): Promise<EraseRegionNormalized | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const maxSide = 320
        const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight))
        const w = Math.max(8, Math.round(img.naturalWidth * scale))
        const h = Math.max(8, Math.round(img.naturalHeight * scale))
        const c = document.createElement('canvas')
        c.width = w
        c.height = h
        const ctx = c.getContext('2d', { willReadFrequently: true })
        if (!ctx) return resolve(null)
        ctx.drawImage(img, 0, 0, w, h)
        const id = ctx.getImageData(0, 0, w, h)
        const d = id.data

        // Seed from user selection center.
        const sx = Math.min(w - 1, Math.max(0, Math.round((box.x + box.width / 2) * w)))
        const sy = Math.min(h - 1, Math.max(0, Math.round((box.y + box.height / 2) * h)))
        const si = (sy * w + sx) * 4
        const sr = d[si]
        const sg = d[si + 1]
        const sb = d[si + 2]

        const lumaAt = (x: number, y: number) => {
          const i = (y * w + x) * 4
          return 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
        }

        const gradAt = (x: number, y: number) => {
          const x1 = Math.max(0, x - 1)
          const x2 = Math.min(w - 1, x + 1)
          const y1 = Math.max(0, y - 1)
          const y2 = Math.min(h - 1, y + 1)
          const gx = Math.abs(lumaAt(x2, y) - lumaAt(x1, y))
          const gy = Math.abs(lumaAt(x, y2) - lumaAt(x, y1))
          return gx + gy
        }

        const colorThreshold = 58
        const edgeThreshold = 52
        const visited = new Uint8Array(w * h)
        const qx = new Int16Array(w * h)
        const qy = new Int16Array(w * h)
        let qh = 0
        let qt = 0
        const push = (x: number, y: number) => {
          const p = y * w + x
          if (visited[p]) return
          visited[p] = 1
          qx[qt] = x
          qy[qt] = y
          qt++
        }

        const colorDist = (r: number, g: number, b: number) =>
          Math.abs(r - sr) + Math.abs(g - sg) + Math.abs(b - sb)

        push(sx, sy)
        let minX = sx
        let maxX = sx
        let minY = sy
        let maxY = sy
        let count = 0
        while (qh < qt) {
          const x = qx[qh]
          const y = qy[qh]
          qh++
          const i = (y * w + x) * 4
          const r = d[i]
          const g = d[i + 1]
          const b = d[i + 2]
          if (colorDist(r, g, b) > colorThreshold) continue
          if (gradAt(x, y) > edgeThreshold) continue
          count++
          if (x < minX) minX = x
          if (x > maxX) maxX = x
          if (y < minY) minY = y
          if (y > maxY) maxY = y
          if (x > 0) push(x - 1, y)
          if (x < w - 1) push(x + 1, y)
          if (y > 0) push(x, y - 1)
          if (y < h - 1) push(x, y + 1)
        }

        const bw = Math.max(1, maxX - minX + 1)
        const bh = Math.max(1, maxY - minY + 1)
        const areaRatio = count / Math.max(1, w * h)
        if (areaRatio < 0.02) return resolve(null)
        if (!matchesCategoryGeometry(category, minX, minY, bw, bh, w, h)) return resolve(null)
        const norm: EraseRegionNormalized = {
          x: minX / w,
          y: minY / h,
          width: bw / w,
          height: bh / h,
        }
        resolve(norm)
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = imageDataUrl
  })
}

export async function expandMaskBasedOnCategory(
  selectionMask: EraseRegionNormalized,
  image: string,
  category: string
): Promise<EraseRegionNormalized> {
  if (!isGlobalSurfaceCategory(category)) return selectionMask
  // First pass: direct segmentation.
  const detected = await detectExpandedSurfaceBox(image, selectionMask, category)
  if (detected) return detected
  // Fallback: dilate and retry segmentation.
  const grown = dilateNormalizedRect(selectionMask, 0.22)
  const retry = await detectExpandedSurfaceBox(image, grown, category)
  if (retry) return retry
  // Final fallback: slightly grown selection to reduce tiny-patch edits.
  return dilateNormalizedRect(selectionMask, 0.12)
}

export type CreateMaskOptions = {
  featherPx?: number
  autoFeatherForAdd?: boolean
  category?: string
  expandGlobalSurface?: boolean
}

/**
 * Mask PNG data URL: white = region to inpaint, black = keep.
 * Same logic as `app/lib/room-editor/maskUtils.ts` (add mode uses narrow soft edges when `autoFeatherForAdd`).
 */
export async function createMaskFromBoundingBox(
  imageDataUrl: string,
  boundingBox: EraseRegionNormalized,
  options?: CreateMaskOptions
): Promise<string | null> {
  const effectiveBox =
    options?.expandGlobalSurface && isGlobalSurfaceCategory(options?.category)
      ? await expandMaskBasedOnCategory(
          boundingBox,
          imageDataUrl,
          String(options?.category)
        )
      : boundingBox
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const w = img.naturalWidth
      const h = img.naturalHeight
      const x0 = Math.round(effectiveBox.x * w)
      const y0 = Math.round(effectiveBox.y * h)
      const rw = Math.max(1, Math.round(effectiveBox.width * w))
      const rh = Math.max(1, Math.round(effectiveBox.height * h))

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
      ctx.fillRect(Math.min(x0, w - 1), Math.min(y0, h - 1), Math.min(rw, w - x0), Math.min(rh, h - y0))

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
        resolve(canvas.toDataURL('image/png', 0.95))
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = imageDataUrl
  })
}

/** Masked inpaint add — same as `app/lib/room-editor/roomEditorApi.ts` → `POST /api/add`. */
export async function postRoomAdd(opts: {
  imageDataUrl: string
  maskDataUrl: string
  prompt: string
  /** Optional catalog / material image (data URL) so the model can match the selected product. */
  referenceImageDataUrl?: string | null
}): Promise<GenerateResponse> {
  const prompt = opts.prompt.trim()
  if (!prompt) {
    return { error: 'Describe what to add in the masked area.' }
  }
  const ref = opts.referenceImageDataUrl?.trim()
  const referenceImage =
    ref && ref.includes(',') && ref.length > 32 ? ref : undefined
  let res: Response
  try {
    res = await fetch(buildApiUrl('/api/add'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: opts.imageDataUrl,
        mask: opts.maskDataUrl,
        prompt,
        ...(referenceImage ? { referenceImage } : {}),
      }),
    })
  } catch (e) {
    const isNet =
      e instanceof TypeError &&
      (String(e.message).includes('fetch') ||
        String(e.message).includes('Failed to fetch') ||
        String(e.message).includes('NetworkError'))
    return {
      error: isNet
        ? `Could not reach the room-configuration API. Start the Next.js app locally or set VITE_API_BASE_URL to your deployed backend. Current target: ${getApiBaseUrlHelpText()}.`
        : e instanceof Error
          ? e.message
          : 'Request failed.',
    }
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string; success?: boolean; imageUrl?: string }
  if (!res.ok) {
    return { error: data.error || res.statusText || `Request failed (${res.status})` }
  }
  if (data.success && typeof data.imageUrl === 'string') {
    return { imageUrl: data.imageUrl }
  }
  return { error: data.error || 'Invalid response from server' }
}

/**
 * Same phrase as `app/lib/room-editor/replacePrompt.ts` / `runRoomEditorPreview` when mode === 'replace'.
 * Gemini route still adds full inpaint instructions; this is the user "Replace with:" line.
 */
export function buildReplaceWithPhrase(description?: string | null, presetId?: string | null): string {
  const t = description?.trim() || presetId?.trim() || 'similar object'
  return `Replace with: ${t}`
}

/** Masked inpaint replace — same as `app/lib/room-editor/roomEditorApi.ts` → `POST /api/replace`. */
export async function postRoomReplace(opts: {
  imageDataUrl: string
  maskDataUrl: string
  prompt?: string
  /** Optional catalog / material image (data URL) so replace matches the selected product exactly. */
  referenceImageDataUrl?: string | null
}): Promise<GenerateResponse> {
  const body: Record<string, string> = {
    image: opts.imageDataUrl,
    mask: opts.maskDataUrl,
  }
  const p = opts.prompt?.trim()
  if (p) body.prompt = p
  const ref = opts.referenceImageDataUrl?.trim()
  if (ref && ref.includes(',') && ref.length > 32) {
    body.referenceImage = ref
  }
  let res: Response
  try {
    res = await fetch(buildApiUrl('/api/replace'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (e) {
    const isNet =
      e instanceof TypeError &&
      (String(e.message).includes('fetch') ||
        String(e.message).includes('Failed to fetch') ||
        String(e.message).includes('NetworkError'))
    return {
      error: isNet
        ? `Could not reach the room-configuration API. Start the Next.js app locally or set VITE_API_BASE_URL to your deployed backend. Current target: ${getApiBaseUrlHelpText()}.`
        : e instanceof Error
          ? e.message
          : 'Request failed.',
    }
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string; success?: boolean; imageUrl?: string }
  if (!res.ok) {
    return { error: data.error || res.statusText || `Request failed (${res.status})` }
  }
  if (data.success && typeof data.imageUrl === 'string') {
    return { imageUrl: data.imageUrl }
  }
  return { error: data.error || 'Invalid response from server' }
}

/**
 * Convert a selection drawn as % of the image panel (0–100) to normalized erase coords for `object-fit: contain`
 * (matches how the room preview `<img>` is shown in Internalconfigf).
 */
export function capturePercentRectToEraseRegion(
  panelW: number,
  panelH: number,
  naturalW: number,
  naturalH: number,
  rectPct: { x: number; y: number; w: number; h: number }
): EraseRegionNormalized | null {
  if (!naturalW || !naturalH || !panelW || !panelH) return null
  const scale = Math.min(panelW / naturalW, panelH / naturalH)
  const renderedW = naturalW * scale
  const renderedH = naturalH * scale
  const offsetX = (panelW - renderedW) / 2
  const offsetY = (panelH - renderedH) / 2
  const left = (rectPct.x / 100) * panelW
  const top = (rectPct.y / 100) * panelH
  const pw = (rectPct.w / 100) * panelW
  const ph = (rectPct.h / 100) * panelH
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
  let x1 = (left - offsetX) / renderedW
  let y1 = (top - offsetY) / renderedH
  let x2 = (left + pw - offsetX) / renderedW
  let y2 = (top + ph - offsetY) / renderedH
  x1 = clamp(x1, 0, 1)
  y1 = clamp(y1, 0, 1)
  x2 = clamp(x2, 0, 1)
  y2 = clamp(y2, 0, 1)
  const width = x2 - x1
  const height = y2 - y1
  if (width < 0.015 || height < 0.015) return null
  return { x: x1, y: y1, width, height }
}

/** Room erase API expects a data URL; wizard + Gemini responses already use data URLs. */
export async function ensureGenerateImageDataUrl(src: string): Promise<string | { error: string }> {
  const s = src.trim()
  if (!s) return { error: 'No image.' }
  if (s.includes(',')) return s
  if (s.startsWith('blob:')) {
    try {
      return await blobUrlToDataUrl(s)
    } catch {
      return { error: 'Failed to read image.' }
    }
  }
  if (s.startsWith('http://') || s.startsWith('https://')) {
    try {
      const res = await fetch(s)
      if (!res.ok) return { error: 'Could not load image. Try again after the room image loads.' }
      const blob = await res.blob()
      return await new Promise<string>((resolve, reject) => {
        const r = new FileReader()
        r.onload = () => resolve(r.result as string)
        r.onerror = () => reject(new Error('read failed'))
        r.readAsDataURL(blob)
      })
    } catch {
      return {
        error:
          'Could not convert image to data URL. Erase needs a wizard upload or an AI-generated result (data URL).',
      }
    }
  }
  return { error: 'Invalid image for erase.' }
}

/** Region inpainting erase — same contract as main app `handleGenerate` + `app/api/generate` erase branch. */
export async function postRoomErase(opts: {
  configType: 'internal' | 'external'
  sourceImageDataUrl: string
  eraseRegion: EraseRegionNormalized
  eraseMode?: 'region' | 'full-components'
}): Promise<GenerateResponse> {
  const source = opts.sourceImageDataUrl.trim()
  if (!source.includes(',')) {
    return { error: 'Erase requires a data URL (uploaded layout or generated image).' }
  }
  const er = opts.eraseRegion
  if (!(er.width > 0 && er.height > 0)) {
    return { error: 'Invalid erase region.' }
  }
  let res: Response
  try {
    res = await fetch(buildApiUrl('/api/generate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        configType: opts.configType,
        configMode: 'customization',
        images: [source],
        layoutImageIndex: 0,
        currentResultImage: source,
        eraseRegion: er,
        eraseMode: opts.eraseMode ?? 'region',
        vastuEnabled: false,
      }),
    })
  } catch (e) {
    const isNet =
      e instanceof TypeError &&
      (String(e.message).includes('fetch') ||
        String(e.message).includes('Failed to fetch') ||
        String(e.message).includes('NetworkError'))
    return {
      error: isNet
        ? `Could not reach the room-configuration API. Start the Next.js app locally or set VITE_API_BASE_URL to your deployed backend. Current target: ${getApiBaseUrlHelpText()}.`
        : e instanceof Error
          ? e.message
          : 'Request failed.',
    }
  }
  const text = await res.text()
  let data: GenerateResponse
  try {
    data = JSON.parse(text) as GenerateResponse
  } catch {
    return { error: res.ok ? 'Invalid JSON from server' : text || res.statusText }
  }
  if (!res.ok) {
    return { error: data.error || text || `Request failed (${res.status})` }
  }
  return data
}

export type PostRoomGenerateOptions = {
  /** After first generation: send last result so the API applies new style/palette to it (locked layout / style-only path). */
  currentResultImage?: string | null
  shuffle?: boolean
}

export async function postRoomGenerate(
  session: RoomWizardSession,
  selectedStyle: string,
  paletteDisplayName: string | null,
  options?: PostRoomGenerateOptions
): Promise<GenerateResponse> {
  const { imagesDataUrl, layoutIndex, configType, configMode } = session
  if (!imagesDataUrl.length) {
    return { error: 'No images to generate from.' }
  }
  const idx = Math.max(0, Math.min(layoutIndex, imagesDataUrl.length - 1))
  const paletteId = paletteDisplayNameToApiId(paletteDisplayName)
  const cur = options?.currentResultImage?.trim()
  const useCurrent = !!cur

  // Matches app/api/generate: valid layoutImageIndex enables locked single-layout mode (no min 3/4).
  if (idx < 0 || idx >= imagesDataUrl.length) {
    return { error: 'Invalid layout image index.' }
  }

  // Match Next UI payload shape as closely as possible:
  // send all uploaded images and the selected layout anchor index.
  const imagesPayload = imagesDataUrl
  const layoutIndexPayload = idx
  const fullRoomAdditionalText = buildFullRoomAdditionalText(session)
  const normalizedPurposeInput = session.roomContext?.trim()
  const fallbackPurposeInput =
    'Re-render this exact space in the selected interior style and color palette. Keep layout, architecture, furniture positions, and camera viewpoint unchanged; update only finishes, colors, materials, and lighting mood to match the style.'
  const purposeInput = normalizedPurposeInput || fallbackPurposeInput
  const effectiveMode: 'purpose' | 'arrangement' = configMode === 'arrangement' ? 'arrangement' : 'purpose'
  const arrangementConfig =
    effectiveMode === 'arrangement'
      ? session.arrangementConfig ?? {
          existingComponentsNote:
            'Preserve major existing components and spatial anchors from the selected layout image unless the user asks otherwise.',
          removedComponentsNote: '',
          newComponentsNote:
            'Add and reposition components as needed for a practical, balanced, and complete room layout.',
          arrangementPreferencesText:
            session.additionalNotes?.trim() ||
            session.roomContext?.trim() ||
            'Create a functional arrangement with clear circulation and balanced spacing.',
        }
      : undefined
  const componentReferenceImages =
    effectiveMode === 'arrangement'
      ? session.componentReferenceImages ?? session.optionalReferenceImages
      : undefined
  const componentReferenceLabels =
    effectiveMode === 'arrangement'
      ? session.componentReferenceLabels ??
        (componentReferenceImages?.map((_, i) => `Reference component ${i + 1}`) ?? [])
      : undefined

  const omitStylePalette =
    session.omitWizardStyleAndPalette === true && effectiveMode === 'arrangement'
  const styleTrimmed = typeof selectedStyle === 'string' ? selectedStyle.trim() : ''
  const paletteForBody = omitStylePalette ? undefined : paletteId ?? undefined

  let res: Response
  try {
    res = await fetch(buildApiUrl('/api/generate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        configType,
        images: imagesPayload,
        configMode: effectiveMode,
        layoutImageIndex: layoutIndexPayload,
        purposeInput: effectiveMode === 'purpose' ? purposeInput : undefined,
        arrangementConfig,
        ...(omitStylePalette || !styleTrimmed ? {} : { selectedStyle: styleTrimmed }),
        ...(paletteForBody ? { selectedColorPalette: paletteForBody } : {}),
        vastuEnabled: false,
        ...(componentReferenceImages && componentReferenceImages.length > 0
          ? { componentReferenceImages }
          : {}),
        ...(componentReferenceLabels && componentReferenceLabels.length > 0
          ? { componentReferenceLabels }
          : {}),
        ...(useCurrent ? { currentResultImage: cur } : {}),
        ...(options?.shuffle ? { shuffle: true } : {}),
        ...(fullRoomAdditionalText ? { fullRoomAdditionalText } : {}),
        ...(Array.isArray(session.optionalReferenceImages) && session.optionalReferenceImages.length > 0
          ? { fullRoomReferenceImages: session.optionalReferenceImages }
          : {}),
        ...(Array.isArray(session.optionalReferenceImages) && session.optionalReferenceImages.length > 0
          ? { optionalReferenceImages: session.optionalReferenceImages }
          : {}),
      }),
    })
  } catch (e) {
    const isNet =
      e instanceof TypeError &&
      (String(e.message).includes('fetch') || String(e.message).includes('Failed to fetch') || String(e.message).includes('NetworkError'))
    return {
      error: isNet
        ? `Could not reach the room-configuration API. Start the Next.js app locally or set VITE_API_BASE_URL to your deployed backend. Current target: ${getApiBaseUrlHelpText()}.`
        : e instanceof Error
          ? e.message
          : 'Request failed.',
    }
  }
  const text = await res.text()
  let data: GenerateResponse
  try {
    data = JSON.parse(text) as GenerateResponse
  } catch {
    return { error: res.ok ? 'Invalid JSON from server' : text || res.statusText }
  }
  if (!res.ok) {
    return { error: data.error || text || `Request failed (${res.status})` }
  }
  return data
}

/** Raw completion from RoomConfigStudio (blob: URLs). Parent converts with `blobUrlToDataUrl`. */
export type RoomWizardCompletePayload = {
  blobUrls: string[]
  /** Selected configuration mode after layout selection. */
  configMode: 'purpose' | 'arrangement'
  /** True when user chose Custom Room Components and skipped style + palette in the wizard. */
  omitWizardStyleAndPalette?: boolean
  /** Optional arrangement payload for component-based generation mode. */
  arrangementConfig?: {
    existingComponentsNote: string
    removedComponentsNote?: string
    newComponentsNote: string
    arrangementPreferencesText: string
  }
  /** Optional style reference images selected in preferences step (blob URLs). */
  referenceImageBlobUrls?: string[]
  layoutIndex: number
  style: string
  paletteName: string | null
  configType: 'internal' | 'external'
  /** Optional context from the upload step (room or exterior). */
  roomContext?: string
  /** Optional notes from Reference Images & Preferences (e.g. cultural style, materials). */
  additionalNotes?: string
}
