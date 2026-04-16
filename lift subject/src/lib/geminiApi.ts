/**
 * Google Gemini API for image editing and generation.
 * Used by Preset (material apply), AI (prompt-based edit), and Replace (AI-generated replacement).
 *
 * Configure via .env: VITE_IMAGE_GENERATION_API_KEY, VITE_GEMINI_IMAGE_MODEL
 */

const API_KEY = import.meta.env.VITE_IMAGE_GENERATION_API_KEY ?? ''
const IMAGE_MODEL = import.meta.env.VITE_GEMINI_IMAGE_MODEL ?? import.meta.env.VITE_GEMINI_TEXT_MODEL ?? 'gemini-1.5-flash'
const BASE = 'https://generativelanguage.googleapis.com/v1beta'

export function isGeminiConfigured(): boolean {
  return Boolean(API_KEY)
}

function getModel(): string {
  return IMAGE_MODEL || 'gemini-1.5-flash'
}

/** Extract base64 and mime from a data URL. */
function dataUrlToParts(dataUrl: string): { mimeType: string; data: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) throw new Error('Invalid data URL')
  return { mimeType: match[1].trim(), data: match[2] }
}

/**
 * Build a strong style-edit prompt so the model actually changes the design.
 * User request is applied visibly (e.g. "1970s style" → bold retro colors/shapes).
 */
export function buildStyleEditPrompt(userPrompt: string, intensity: number): string {
  const strong = intensity >= 70
    ? 'Apply this style STRONGLY and very visibly. The result must clearly look like the requested style (e.g. 1970s = bold colors, geometric patterns, period-typical shapes; modern = clean lines, minimal, contemporary materials). Do not return a nearly identical image; transform the design meaningfully.'
    : 'Apply this style clearly so the result is recognizable as the requested style. Make visible changes to colors, materials, or form as appropriate.'
  return `You are redesigning this piece of furniture/object for an interior scene. The user wants: "${userPrompt}".

${strong}

Keep the same type of object (e.g. chair stays a chair) and similar size so it fits the scene. Change its appearance, color, material, pattern, or shape details to match the request. Output only the redesigned object on a transparent or neutral background, same framing as the input.

Critical: Output ONLY the raw image of the object. Do not add any text, labels, brackets, boxes, outlines, arrows, annotations, or UI elements. The image must be clean and suitable for compositing into a photo.`
}

/**
 * Generate multiple distinct style variations (e.g. 3 options) so the user can choose.
 * Each call uses a different emphasis to get diverse results.
 */
const VARIATION_ANGLES = [
  'Focus on color palette and pattern: make this variation distinct in its colors and surface pattern.',
  'Focus on form and shape: make this variation distinct in its silhouette, curves, or structure.',
  'Focus on material and texture: make this variation distinct in its material look (fabric, leather, wood, etc.).',
]

export async function geminiEditImageStyleVariations(
  imageDataUrl: string,
  userPrompt: string,
  intensity: number,
  onProgress?: (current: number, total: number, label: string) => void
): Promise<string[]> {
  const basePrompt = buildStyleEditPrompt(userPrompt, intensity)
  const results: string[] = []
  for (let i = 0; i < 3; i++) {
    onProgress?.(i + 1, 3, `Generating variation ${i + 1}...`)
    const prompt = `${basePrompt}\n\nVariation ${i + 1}: ${VARIATION_ANGLES[i]}`
    const dataUrl = await geminiEditImage(imageDataUrl, prompt)
    results.push(dataUrl)
  }
  return results
}

/**
 * Edit an image with a text prompt (image + text → image).
 * Used for Preset (material description) and AI (user prompt).
 */
export async function geminiEditImage(imageDataUrl: string, prompt: string): Promise<string> {
  if (!API_KEY) throw new Error('Gemini not configured. Set VITE_IMAGE_GENERATION_API_KEY in .env')

  const { mimeType, data } = dataUrlToParts(imageDataUrl)
  const model = getModel()
  const url = `${BASE}/models/${model}:generateContent?key=${API_KEY}`

  const noAnnotationSuffix = '\n\nOutput ONLY the image. No text, labels, brackets, outlines, or annotations in the image.'
  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType, data } },
          { text: prompt + noAnnotationSuffix },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      // Do not set responseMimeType: 'image/png' — this API only allows text/plain, application/json, etc.
      // Image data is returned in response parts as inlineData.
    },
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API error (${res.status}): ${err}`)
  }

  const json = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ inlineData?: { mimeType?: string; data?: string }; text?: string }> }
    }>
    error?: { message?: string }
  }

  if (json.error?.message) throw new Error(json.error.message)

  const parts = json.candidates?.[0]?.content?.parts ?? []
  const imagePart = parts.find((p) => p.inlineData?.data)
  if (!imagePart?.inlineData?.data) {
    const textPart = parts.find((p) => p.text)?.text
    throw new Error(textPart || 'No image in Gemini response')
  }

  const { mimeType: outMime, data: outData } = imagePart.inlineData
  return `data:${outMime || 'image/png'};base64,${outData}`
}

/**
 * Generate an image from text only (text → image).
 * Used for Replace panel "AI" tab when user describes a replacement.
 */
export async function geminiGenerateImage(prompt: string): Promise<string> {
  if (!API_KEY) throw new Error('Gemini not configured. Set VITE_IMAGE_GENERATION_API_KEY in .env')

  const model = getModel()
  const url = `${BASE}/models/${model}:generateContent?key=${API_KEY}`

  const cleanPrompt = prompt + '\n\nOutput ONLY the image. No text, labels, brackets, outlines, or annotations in the image.'
  const body = {
    contents: [{ role: 'user', parts: [{ text: cleanPrompt }] }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      // Omit responseMimeType — API only allows text/plain, application/json, etc.; image comes in parts.
    },
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API error (${res.status}): ${err}`)
  }

  const json = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ inlineData?: { mimeType?: string; data?: string }; text?: string }> }
    }>
    error?: { message?: string }
  }

  if (json.error?.message) throw new Error(json.error.message)

  const parts = json.candidates?.[0]?.content?.parts ?? []
  const imagePart = parts.find((p) => p.inlineData?.data)
  if (!imagePart?.inlineData?.data) {
    const textPart = parts.find((p) => p.text)?.text
    throw new Error(textPart || 'No image in Gemini response')
  }

  const { mimeType: outMime, data: outData } = imagePart.inlineData
  return `data:${outMime || 'image/png'};base64,${outData}`
}

/** Bounding box from Gemini detection (x, y = top-left; width, height in pixels). */
export interface GeminiBox {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Use Gemini vision to find an object in the image from a text description.
 * Returns bounding boxes in pixel coordinates. Use when Grounding DINO is not configured.
 * Requires VITE_IMAGE_GENERATION_API_KEY (Gemini key).
 */
export async function geminiDetectObject(
  imageDataUrl: string,
  textPrompt: string,
  imageWidth: number,
  imageHeight: number
): Promise<GeminiBox[]> {
  if (!API_KEY) throw new Error('Gemini not configured. Set VITE_IMAGE_GENERATION_API_KEY in .env')

  const { mimeType, data } = dataUrlToParts(imageDataUrl)
  const textModel = import.meta.env.VITE_GEMINI_TEXT_MODEL || 'gemini-1.5-flash'
  const url = `${BASE}/models/${textModel}:generateContent?key=${API_KEY}`

  const prompt = `You are an object detection assistant. This room image is ${imageWidth} x ${imageHeight} pixels. Find the object described by: "${textPrompt}".

IMPORTANT: For each object, return a bounding box that contains the ENTIRE object from edge to edge—the full visible extent (e.g. whole sofa including both arms and full seat, whole table including legs). Do NOT return a box that cuts off part of the object; the box must fully enclose it.

Return ONLY a JSON object with one key "boxes", an array of objects. Each object: "x" (left edge in pixels), "y" (top edge in pixels), "width" (pixels), "height" (pixels). Use pixel coordinates. One box per object found. If nothing matches, return {"boxes":[]}. No other text, no markdown.`

  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType, data } },
          { text: prompt },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ['TEXT'],
      temperature: 0.1,
    },
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API error (${res.status}): ${err}`)
  }

  const json = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    error?: { message?: string }
  }

  if (json.error?.message) throw new Error(json.error.message)

  const textPart = json.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text?.trim()
  if (!textPart) return []

  const cleaned = textPart.replace(/^```(?:json)?\s*|\s*```$/g, '').trim()
  let parsed: { boxes?: GeminiBox[] }
  try {
    parsed = JSON.parse(cleaned) as { boxes?: GeminiBox[] }
  } catch {
    return []
  }

  const boxes = parsed?.boxes
  if (!Array.isArray(boxes) || boxes.length === 0) return []

  const regions: GeminiBox[] = []
  for (const b of boxes) {
    let x = Number(b?.x) ?? 0
    let y = Number(b?.y) ?? 0
    let w = Number(b?.width) ?? 0
    let h = Number(b?.height) ?? 0
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(w) || !Number.isFinite(h)) continue
    // Many vision models return normalized 0-1 coordinates; convert to pixels.
    const likelyNormalized = (w <= 1 && h <= 1 && w > 0 && h > 0) || (x <= 1 && y <= 1 && x >= 0 && y >= 0)
    if (likelyNormalized) {
      if (x <= 1 && x >= 0) x = x * imageWidth
      if (y <= 1 && y >= 0) y = y * imageHeight
      if (w <= 1 && w > 0) w = w * imageWidth
      if (h <= 1 && h > 0) h = h * imageHeight
    }
    x = Math.max(0, Math.min(imageWidth - 1, Math.floor(x)))
    y = Math.max(0, Math.min(imageHeight - 1, Math.floor(y)))
    w = Math.max(1, Math.min(imageWidth - x, Math.floor(w)))
    h = Math.max(1, Math.min(imageHeight - y, Math.floor(h)))
    if (w > 0 && h > 0) {
      regions.push({ x, y, width: w, height: h })
    }
  }
  return regions
}
