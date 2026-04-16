import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/detect-components
 *
 * Analyzes a room render (e.g. generated output) for room type + visible furniture slugs.
 * Clients use this to order/prioritize object categories in the customization UI.
 *
 * Body: { image: string } (data URL or base64)
 * Returns: { roomType: string | null, components: string[] }
 *   roomType: e.g. bedroom, living_room, kitchen, dining_room, office, bathroom, other
 *   components: lowercase slugs, e.g. ["bed","nightstand","lamp"]
 */

const DETECTION_PROMPT = `You are analyzing a single photograph of an interior space (room).

TASK (two parts — both required):
1) Classify the PRIMARY room type as exactly one of these lowercase snake_case values:
   bedroom, living_room, kitchen, dining_room, office, bathroom, study, entryway_hall, other

2) List the main furniture and fixtures that are clearly visible. Use lowercase slugs with hyphens for multi-word items.

CRITICAL RULES FOR BEDS:
- If the image shows a bed, platform bed, bed frame with mattress/bedding, or the main sleeping furniture of a bedroom, you MUST include the slug "bed" in the components array. Do not omit "bed" because pillows or duvets dominate the view — the bed frame/platform still counts.
- If the room type is "bedroom", you MUST include "bed" in components unless there is absolutely no sleeping furniture visible (e.g. empty room under renovation).

CRITICAL RULES FOR RUGS, CARPETS, AND FLOOR COVERINGS:
- If the floor has a visible area rug, carpet, runner, dhurrie, bath mat, or large textile floor covering (not bare tile/wood only), you MUST include at least one of: "rug", "carpet", or "area-rug" in the components array (prefer "rug" for a single obvious rug).
- Large patterned or textured floor mats under furniture count — include "rug" or "carpet".

OTHER COMPONENT RULES:
- Include: sofa, chair, table, coffee-table, dining-table, side-table, desk, wardrobe, cabinet, tv-unit, lamp, nightstand, mirror, rug, carpet, area-rug, runner, dhurrie, etc. as appropriate.
- Do NOT include: wall, floor, ceiling, glass-partition, decor (the app adds these separately).
- One entry per type (e.g. one "chair" even if multiple chairs).
- Deduplicate.

OUTPUT FORMAT — return ONLY valid JSON, no markdown, no explanation:
{"roomType":"bedroom","components":["bed","nightstand","lamp","rug"]}

Example for a living room:
{"roomType":"living_room","components":["sofa","coffee-table","lamp","tv-unit"]}`

function normalizeMimeType(mimeType: string): string {
  const supported = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (supported.includes(mimeType)) return mimeType
  return 'image/jpeg'
}

function normalizeSlug(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, '-').replace(/_/g, '-')
}

function parseComponentsFromResponse(text: string): string[] {
  const trimmed = text.trim()
  const jsonMatch = trimmed.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return []
  try {
    const arr = JSON.parse(jsonMatch[0]) as unknown
    if (!Array.isArray(arr)) return []
    return arr
      .filter((item): item is string => typeof item === 'string')
      .map((s) => normalizeSlug(s))
      .filter(Boolean)
  } catch {
    return []
  }
}

function parseSceneFromResponse(text: string): { roomType: string | null; components: string[] } {
  const trimmed = text.trim()
  const objectMatch = trimmed.match(/\{[\s\S]*\}/)
  if (objectMatch) {
    try {
      const o = JSON.parse(objectMatch[0]) as Record<string, unknown>
      const roomTypeRaw = o.roomType
      const roomType =
        typeof roomTypeRaw === 'string' && roomTypeRaw.trim() ? normalizeSlug(roomTypeRaw) : null
      const compRaw = o.components
      let components: string[] = []
      if (Array.isArray(compRaw)) {
        components = compRaw
          .filter((item): item is string => typeof item === 'string')
          .map((s) => normalizeSlug(s))
          .filter(Boolean)
      }
      const dedup = Array.from(new Set(components))
      const rt = roomType ?? ''
      if ((rt.includes('bedroom') || rt === 'bed-room') && !dedup.includes('bed')) {
        dedup.unshift('bed')
      }
      return { roomType: roomType ?? null, components: dedup }
    } catch {
      /* fall through */
    }
  }
  const components = parseComponentsFromResponse(text)
  return { roomType: null, components }
}

export async function POST(request: NextRequest) {
  let body: { image?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body. Expected JSON with an "image" string.' },
      { status: 400 }
    )
  }

  const image = body?.image
  if (!image || typeof image !== 'string') {
    return NextResponse.json(
      { error: 'Missing or invalid "image" in request body.' },
      { status: 400 }
    )
  }

  let mimeType = 'image/jpeg'
  let base64Data = image
  if (image.includes(',')) {
    const [header, data] = image.split(',')
    base64Data = data
    const mimeMatch = header.match(/data:([^;]+)/)
    if (mimeMatch) mimeType = normalizeMimeType(mimeMatch[1])
  }

  const geminiApiKey = process.env.IMAGE_GENERATION_API_KEY
  if (!geminiApiKey) {
    return NextResponse.json({
      roomType: null,
      components: [],
    })
  }

  try {
    const model = process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash'
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: DETECTION_PROMPT },
                { inlineData: { mimeType, data: base64Data } },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024,
          },
        }),
      }
    )

    if (!res.ok) {
      const err = await res.text()
      console.error('Gemini detect-components error:', res.status, err)
      return NextResponse.json(
        { error: 'Component detection failed', roomType: null, components: [] },
        { status: 502 }
      )
    }

    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const { roomType, components } = parseSceneFromResponse(text)
    return NextResponse.json({ roomType, components })
  } catch (e) {
    console.error('detect-components error:', e)
    return NextResponse.json(
      { error: 'Component detection failed', roomType: null, components: [] },
      { status: 500 }
    )
  }
}
