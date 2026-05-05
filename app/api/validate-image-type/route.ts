import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route: /api/validate-image-type
 *
 * AI analyzes uploaded images. Internal config requires interior (room) images only;
 * external config requires external (building) images only. The client allows proceeding
 * to the next step ONLY when this API returns valid: true. No other path to proceed.
 *
 * Body: { images: string[] (data URLs), expectedType: 'internal' | 'external' }
 * Returns: {
 *   valid: boolean,
 *   detectedType: 'internal' | 'external',
 *   message: string,
 *   invalidImageIndices?: number[]
 * }
 */

const INTERNAL_FAIL_MESSAGE =
  'Please upload clear images taken from inside an enclosed space (room, shell, or unit under construction). Exteriors, documents, and screenshots are not valid for this mode.'

const EXTERNAL_FAIL_MESSAGE =
  'Please upload clear images of a building exterior (front view, facade, or outdoor structure).'

const VERIFY_RETRY_MESSAGE =
  "We couldn't verify your images right now. Please try again in a moment."

const GEMINI_TEXT_TIMEOUT_MS = 20_000

const CLASSIFY_PROMPT_INTERNAL = `You will receive ONE image.

Answer INTERNAL if the photo is taken from INSIDE an enclosed building space, including ALL of the following (they count as interior):
- Finished or furnished rooms (living, bedroom, office, kitchen, bath, etc.)
- Empty, unfurnished, or bare rooms (no sofa, bed, or decor required)
- Semi-constructed, under-renovation, or shell/fit-out spaces: exposed concrete, unfinished plaster, bare blockwork, construction debris inside a room, open window from inside looking slightly out but the camera is clearly indoors
- Corridors, lobbies, stairwells, parking INSIDE a building

Answer EXTERNAL only if the image is clearly NOT an indoor room frame, for example:
- Building facade, compound, gate, driveway, outdoor parking, sky, garden as the main subject from outside
- A house or building under construction photographed FROM OUTSIDE (yard, street, compound): exterior concrete shell, scaffolding around the building, roofline seen from outdoors, construction site viewed while standing outside the structure
- Screenshots of apps, dashboards, charts, or browser/UI
- Documents, scans, or mostly text/graphics
- Selfies or object close-ups with no visible room shell (walls/floor/ceiling) at all

Important: Lack of furniture, "unfinished" walls, or construction-in-progress INSIDE a room does NOT make it EXTERNAL. If you see interior walls, slab floor, or ceiling from INSIDE a structure, that is INTERNAL.

But if the photographer is clearly OUTSIDE looking at the building (sky, open ground, compound), that is EXTERNAL even if the building is unfinished.

When sky, horizon, or open yard/compound fills much of the frame and you are not clearly inside a walled room, answer EXTERNAL.

Reply with exactly one word on a single line: INTERNAL or EXTERNAL.
Do not add any other text, explanation, or punctuation.`

const CLASSIFY_PROMPT_EXTERNAL = `You will receive ONE image.

Answer EXTERNAL only if this image clearly shows outdoor / building-exterior context (facade, elevation, compound, gate, driveway, parking, outdoor landscaping) or is clearly about the outside of a building.

Answer INTERNAL if this image is an indoor room (walls, ceiling, furniture, living/office/bedroom/kitchen interior) or document/screenshot/UI with no exterior context.

When in doubt, answer INTERNAL.

Reply with exactly one word on a single line: INTERNAL or EXTERNAL.
Do not add any other text, explanation, or punctuation.`

/**
 * Second gate for INTERNAL mode: first model pass often mislabels outdoor construction as indoor.
 * Fail closed: OUTDOOR or ambiguous → treat as invalid for interior workflow.
 */
const STRICT_INTERIOR_SCENE_PROMPT = `You will receive ONE photograph.

Answer OUTDOOR if the camera is clearly OUTSIDE a building or in an open site, for example:
- House/building under construction viewed from the yard, street, compound, or sidewalk (exterior walls, scaffolding, roof edge from outside, construction site walk-around)
- Facade, elevation, gate, driveway, garden or sky as the main scene
- Any view where the photographer is not standing inside an enclosed room/shell with a floor slab underfoot

Answer INDOOR only if the camera is clearly INSIDE an enclosed building space (finished room, bare room, corridor, lobby, indoor stairwell, or interior construction shell with clear indoor framing). Hotel lobbies, reception areas, and furnished common areas count as INDOOR.

When unsure, answer INDOOR (prefer allowing real interior photos over blocking them).

Reply with exactly one word on a single line: OUTDOOR or INDOOR.
Do not add any other text.`

function normalizeMimeType(mimeType: string): string {
  const supported = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (supported.includes(mimeType)) return mimeType
  return 'image/jpeg'
}

async function fetchGeminiText(
  geminiModel: string,
  geminiApiKey: string,
  body: string
): Promise<Response | null> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_TEXT_TIMEOUT_MS)
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: controller.signal,
      }
    )
    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    // Keep logs concise for intermittent network issues in dev.
    console.warn('validate-image-type Gemini call failed:', message)
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function POST(request: NextRequest) {
  let body: { images?: unknown; expectedType?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body. Expected JSON with "images" and "expectedType".' },
      { status: 400 }
    )
  }

  const { images, expectedType } = body
  if (!images || !Array.isArray(images) || images.length < 1) {
    return NextResponse.json(
      { error: 'At least one image is required' },
      { status: 400 }
    )
  }
  if (expectedType !== 'internal' && expectedType !== 'external') {
    return NextResponse.json(
      { error: 'expectedType must be "internal" or "external"' },
      { status: 400 }
    )
  }

  const geminiApiKey = process.env.IMAGE_GENERATION_API_KEY
  if (!geminiApiKey) {
    return NextResponse.json({
      valid: false,
      detectedType: expectedType,
      message: VERIFY_RETRY_MESSAGE,
      invalidImageIndices: images.map((_, idx) => idx),
    })
  }

  const imageParts = images.map((img: string) => {
    let mimeType = 'image/jpeg'
    let base64Data = img
    if (typeof img === 'string' && img.includes(',')) {
      const [header, data] = img.split(',')
      base64Data = data
      const mimeMatch = header.match(/data:([^;]+)/)
      if (mimeMatch) mimeType = normalizeMimeType(mimeMatch[1])
    }
    return { inlineData: { data: base64Data, mimeType } }
  })

  const geminiModel = process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash'

  try {
    const classifySingle = async (
      imgPart: { inlineData: { data: string; mimeType: string } }
    ): Promise<'internal' | 'external' | null> => {
      const response = await fetchGeminiText(
        geminiModel,
        geminiApiKey,
        JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text:
                    expectedType === 'internal'
                      ? 'Validate one image for INTERNAL mode. Reply only INTERNAL or EXTERNAL.'
                      : 'Validate one image for EXTERNAL mode. Reply only INTERNAL or EXTERNAL.',
                },
                imgPart,
                {
                  text:
                    expectedType === 'internal' ? CLASSIFY_PROMPT_INTERNAL : CLASSIFY_PROMPT_EXTERNAL,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 16,
          },
        })
      )

      if (!response) return null
      if (!response.ok) return null
      const data = await response.json()
      const parts = data.candidates?.[0]?.content?.parts ?? []
      const rawText = (Array.isArray(parts)
        ? parts.map((p: { text?: string }) => p?.text ?? '').join('')
        : ''
      ).trim().toUpperCase()
      if (/\bINTERNAL\b/.test(rawText) && !/\bEXTERNAL\b/.test(rawText)) return 'internal'
      if (/\bEXTERNAL\b/.test(rawText) && !/\bINTERNAL\b/.test(rawText)) return 'external'
      return null
    }

    /** Mandatory second gate for interior uploads — catches outdoor/construction shots mislabeled INTERNAL. */
    const strictInteriorOutdoorCheck = async (
      imgPart: { inlineData: { data: string; mimeType: string } }
    ): Promise<'outdoor' | 'indoor' | null> => {
      const response = await fetchGeminiText(
        geminiModel,
        geminiApiKey,
        JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: 'You MUST reply with exactly one word: OUTDOOR or INDOOR.',
                },
                imgPart,
                {
                  text: STRICT_INTERIOR_SCENE_PROMPT,
                },
              ],
            },
          ],
          generationConfig: { temperature: 0, maxOutputTokens: 16 },
        })
      )
      if (!response) return null
      if (!response.ok) return null
      const data = await response.json()
      const parts = data.candidates?.[0]?.content?.parts ?? []
      const rawText = (Array.isArray(parts)
        ? parts.map((p: { text?: string }) => p?.text ?? '').join('')
        : ''
      ).trim().toUpperCase()
      const hasOutdoor = /\bOUTDOOR\b/.test(rawText)
      const hasIndoor = /\bINDOOR\b/.test(rawText)
      if (hasOutdoor && hasIndoor) return 'outdoor'
      if (hasOutdoor && !hasIndoor) return 'outdoor'
      if (hasIndoor && !hasOutdoor) return 'indoor'
      return null
    }

    const results = await Promise.all(imageParts.map((img) => classifySingle(img)))
    const invalidImageIndices: number[] = []

    for (let idx = 0; idx < results.length; idx++) {
      const detected = results[idx]
      const imgPart = imageParts[idx]

      if (expectedType === 'internal') {
        // Hard reject: primary pass is confident this is not an indoor room type.
        if (detected === 'external') {
          invalidImageIndices.push(idx)
          continue
        }
        // For primary internal OR null (ambiguous): only reject if strict pass is
        // explicitly OUTDOOR. null/indoor from strict must not block valid lobbies, etc.
        const strict = await strictInteriorOutdoorCheck(imgPart)
        if (strict === 'outdoor') {
          invalidImageIndices.push(idx)
        }
        continue
      }

      if (expectedType === 'external') {
        if (detected === null) {
          invalidImageIndices.push(idx)
          continue
        }
        if (detected === 'internal') {
          invalidImageIndices.push(idx)
          continue
        }
      }
    }

    const valid = invalidImageIndices.length === 0
    return NextResponse.json({
      valid,
      detectedType: expectedType,
      message: valid
        ? `Images match ${expectedType} configuration.`
        : expectedType === 'internal'
        ? INTERNAL_FAIL_MESSAGE
        : EXTERNAL_FAIL_MESSAGE,
      invalidImageIndices,
    })
  } catch (error) {
    console.error('validate-image-type error:', error)
    return NextResponse.json({
      valid: false,
      detectedType: expectedType,
      message: VERIFY_RETRY_MESSAGE,
      invalidImageIndices: images.map((_, idx) => idx),
    })
  }
}
