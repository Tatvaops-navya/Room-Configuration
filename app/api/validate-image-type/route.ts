import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route: /api/validate-image-type
 *
 * Classifies uploaded image(s) as INTERNAL (room interior) or EXTERNAL (building facade/compound).
 * Used to warn when user selects Internal config but uploads external images, or vice versa.
 *
 * Body: { images: string[], expectedType: 'internal' | 'external' }
 * Returns: { valid: boolean, detectedType: 'internal' | 'external', message: string }
 */

const CLASSIFY_PROMPT = `Look at the image(s) provided.

Your task: decide whether the image(s) show:

INTERNAL:
- Camera is clearly inside a finished room/interior.
- You mainly see interior walls, ceiling, floor, and indoor furniture (sofas, desks, beds, chairs, storage, etc.).
- Outside world (sky, trees, full building facade) is NOT the main subject. Windows may be visible, but the focus is the inside of the room.

EXTERNAL:
- Camera is outside the building or in an open compound.
- You mainly see the building facade, exterior walls, multi-story building from outside, unfinished structure, balconies from outside, compound wall, gate, driveway, parking, staircase from outside, or large open sky/ground around the building.
- Any photo where the main subject is the outside of a building (front, side, or back elevation) is EXTERNAL.
- Even if the building is under construction, if you see it from outside, treat it as EXTERNAL.

STRICT RULE:
- If you are uncertain or the image shows both, choose EXTERNAL (facade/property) by default.
- When the main view is the exterior of a building (house, villa, apartment from outside), always answer EXTERNAL.

Reply with exactly one word on a single line: INTERNAL or EXTERNAL.
Do not add any other text, explanation, or punctuation.`

function normalizeMimeType(mimeType: string): string {
  const supported = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (supported.includes(mimeType)) return mimeType
  return 'image/jpeg'
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
      valid: true,
      detectedType: expectedType,
      message: 'Validation skipped (no API key).',
    })
  }

  const imageParts = images.slice(0, 2).map((img: string) => {
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
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: 'Classify the following image(s) as INTERNAL (indoor room) or EXTERNAL (building exterior).' },
                ...imageParts,
                { text: CLASSIFY_PROMPT },
              ],
            },
          ],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 32,
          },
        }),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error('validate-image-type Gemini error:', errText)
      return NextResponse.json({
        valid: true,
        detectedType: expectedType,
        message: 'Validation could not be completed.',
      })
    }

    const data = await response.json()
    const parts = data.candidates?.[0]?.content?.parts ?? []
    const rawText = (Array.isArray(parts)
      ? parts.map((p: { text?: string }) => p?.text ?? '').join('')
      : ''
    ).trim()

    // Detect INTERNAL or EXTERNAL anywhere in the response (model may add preamble)
    const textUpper = rawText.toUpperCase()
    const hasExternal = /\bEXTERNAL\b/.test(textUpper)
    const hasInternal = /\bINTERNAL\b/.test(textUpper)
    const detected =
      hasExternal && !hasInternal
        ? 'external'
        : hasInternal && !hasExternal
        ? 'internal'
        : hasExternal
        ? 'external'
        : hasInternal
        ? 'internal'
        : (expectedType as 'internal' | 'external')
    const valid = detected === expectedType

    const message = valid
      ? `Images match ${expectedType} configuration.`
      : expectedType === 'internal'
      ? 'These images appear to be external (building/facade). For Internal Room Configuration please upload photos of the room interior.'
      : 'These images appear to be internal (room interior). For External Configuration please upload photos of the building exterior, facade, or compound.'

    return NextResponse.json({
      valid,
      detectedType: detected,
      message,
    })
  } catch (error) {
    console.error('validate-image-type error:', error)
    return NextResponse.json({
      valid: true,
      detectedType: expectedType,
      message: 'Validation could not be completed.',
    })
  }
}
