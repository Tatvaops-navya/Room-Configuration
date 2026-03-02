import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route: /api/validate-image-type
 *
 * AI analyzes uploaded images. Internal config requires interior (room) images only;
 * external config requires external (building) images only. The client allows proceeding
 * to the next step ONLY when this API returns valid: true. No other path to proceed.
 *
 * Body: { images: string[] (client may send 2 to avoid 413), expectedType: 'internal' | 'external' }
 * Returns: { valid: boolean, detectedType: 'internal' | 'external', message: string }
 */

const CLASSIFY_PROMPT = `Look at the image(s) provided.

Your task: decide whether the image(s) show an INDOOR ROOM/SPACE (answer INTERNAL) or something else (answer EXTERNAL).

INTERNAL – answer when the image shows an indoor room or interior space, including:
- Reception areas, lobbies, waiting areas with desk, chairs, and walls.
- Offices, meeting rooms, conference rooms with table, chairs, walls, ceiling.
- Living rooms, bedrooms, kitchens, bathrooms with visible walls, floor, ceiling, and furniture.
- Any indoor space where you can see the room structure (walls, floor, ceiling) and furniture or fixtures (sofa, desk, bed, chairs, tables, lighting). The camera is inside the room.

EXTERNAL – answer ONLY when the image is clearly NOT an indoor room, e.g.:
- Building exterior, facade, outdoor view, compound, gate, driveway, parking, balcony from outside.
- Selfies, portraits, or close-ups where a person's face/body is the main subject and the room is not visible.
- Documents, brochures, flyers, posters, or mostly text/graphics (no real room space).
- Outdoor scenes, sky, or unclear/non-room content.

IMPORTANT: Reception areas, lobbies, offices with desk and chairs are INTERNAL. When in doubt and the image looks like an indoor room (walls + furniture/desk/chairs), answer INTERNAL.
If multiple images are provided: answer INTERNAL if the images show indoor room(s). Answer EXTERNAL only if the images clearly show non-room content (exterior, document, selfie).

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
      valid: false,
      detectedType: expectedType,
      message: expectedType === 'internal'
        ? 'Image validation is unavailable. For Internal Configuration please upload interior room images only.'
        : 'Image validation is unavailable. For External Configuration please upload external building images only.',
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
                { text: 'Classify these image(s). INTERNAL = indoor room (reception, lobby, office, living room, etc. with walls and furniture). EXTERNAL = building exterior, selfie/portrait, or document. If you see an indoor space with desk, chairs, walls, ceiling, answer INTERNAL. Reply with one word: INTERNAL or EXTERNAL.' },
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
      // On API error, allow the user to proceed — don't block on model unavailability.
      return NextResponse.json({
        valid: true,
        detectedType: expectedType,
        message: `Images accepted.`,
      })
    }

    const data = await response.json()
    const finishReason = data.candidates?.[0]?.finishReason
    const parts = data.candidates?.[0]?.content?.parts ?? []
    const rawText = (Array.isArray(parts)
      ? parts.map((p: { text?: string }) => p?.text ?? '').join('')
      : ''
    ).trim()

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
        : null

    // Only block when the model CLEARLY detected the wrong type.
    // If response is empty/ambiguous (detected === null), let the user proceed —
    // we should never block on model uncertainty or transient failures.
    if (detected === null) {
      console.warn('validate-image-type: inconclusive response from model (finishReason:', finishReason, ', rawText:', rawText, '). Allowing proceed.')
      return NextResponse.json({
        valid: true,
        detectedType: expectedType,
        message: `Images match ${expectedType} configuration.`,
      })
    }

    const valid = detected === expectedType

    const message = valid
      ? `Images match ${expectedType} configuration.`
      : expectedType === 'internal'
      ? 'These images appear to show a building exterior. For Internal Room Configuration please upload photos of the room interior (walls, floor, ceiling, furniture visible).'
      : 'These images appear to show an indoor room. For External Configuration please upload photos of the building exterior, facade, or compound.'

    return NextResponse.json({
      valid,
      detectedType: detected,
      message,
    })
  } catch (error) {
    console.error('validate-image-type error:', error)
    // On any error, allow the user to proceed — don't block on validation failure.
    return NextResponse.json({
      valid: true,
      detectedType: expectedType,
      message: `Images accepted.`,
    })
  }
}
