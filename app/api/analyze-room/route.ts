import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route: /api/analyze-room
 *
 * Analyzes uploaded room images with a detailed visual analysis prompt and returns
 * a structured report plus a JSON list of components for the Keep/Remove flow.
 *
 * Expected request body: { images: string[] }  (base64 room image strings)
 * Returns: { components: { id: string, label: string }[], fullReport?: string }
 */

const ROOM_ANALYSIS_PROMPT = `You are an AI visual analysis system specialized in indoor space understanding.

The user has uploaded one or more images of a room.
Your task is to analyze the image(s) carefully and identify all visible components, furniture, and interior elements present in the space.

STRICT RULES:
- Do NOT redesign the room.
- Do NOT suggest improvements.
- Do NOT assume objects that are not clearly visible.
- Do NOT infer room purpose unless it is visually obvious.
- Detect only what can be seen in the image(s).

ANALYSIS OBJECTIVE:
Create a complete inventory of all visible items inside the room based purely on visual evidence.

DETECTION SCOPE:

1. Furniture & Movable Components  
Identify items such as (but not limited to):
- sofas
- chairs
- tables
- desks
- beds
- wardrobes
- cabinets
- shelves
- TV units
- side tables
- reception counters
- movable partitions

2. Fixed & Structural Elements  
Identify visible fixed elements including:
- walls
- doors
- windows
- glass panels
- partitions
- columns or pillars
- built-in units

3. Lighting Elements  
Identify all visible lighting features:
- ceiling lights
- recessed lights
- panel lights
- LED strip lights
- decorative lights

4. Ceiling & Flooring  
Identify:
- false ceiling or ceiling design
- ceiling panels
- floor type (tile, wood, marble, etc.)

5. Interior & Decorative Elements  
Identify visible interior features such as:
- wall panels
- textures
- curtains or blinds
- artwork or frames
- notice boards
- decorative surfaces

OUTPUT FORMAT:

Present the detected items in a structured list using the following format:

A. Furniture & Movable Items  
- Item name  
- Approximate quantity  
- Material (if visible)  
- Color  
- Location in room (left / right / center / near wall)

B. Fixed & Structural Elements  
- Element name  
- Material (if visible)  
- Position

C. Lighting Elements  
- Type of lighting  
- Placement  
- Light tone (warm / cool / neutral if visible)

D. Interior & Decorative Elements  
- Description  
- Location

IMPORTANT:
- If any detail is unclear, mention "not clearly visible".
- Quantities may be approximate.
- Use clear bullet points.
- Do not include opinions or suggestions.
- The output must strictly reflect what is visible in the uploaded image(s).

Your role is only to observe, analyze, and list all components present in the room.

---

After your structured analysis (sections A through D above), you MUST add the following so the configuration tool can show a component list:

On a new line write exactly: COMPONENTS_JSON
Then on the next line output ONLY a valid JSON array of objects. Each object must have exactly two fields:
- "id": a short slug in lowercase with hyphens (e.g. "sofa", "reception-desk", "ceiling-lights")
- "label": a short human-readable name (e.g. "Sofa", "Reception desk", "Ceiling lights")

Include one entry for each detected furniture item, movable component, and key fixed element (reception counter, built-in unit, etc.) and lighting/ceiling/floor if relevant. Example:
[{"id":"sofa","label":"Sofa"},{"id":"reception-desk","label":"Reception desk"},{"id":"chairs","label":"Chairs"},{"id":"ceiling-lights","label":"Ceiling lights"}]`

function normalizeMimeType(mimeType: string): string {
  const supported = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (supported.includes(mimeType)) return mimeType
  return 'image/jpeg'
}

export async function POST(request: NextRequest) {
  let body: { images?: unknown }
  try {
    body = await request.json()
  } catch (e) {
    return NextResponse.json(
      { error: 'Invalid request body. Expected JSON with an "images" array.' },
      { status: 400 }
    )
  }
  try {
    const { images } = body

    if (!images || !Array.isArray(images) || images.length < 1) {
      return NextResponse.json(
        { error: 'At least one room image is required' },
        { status: 400 }
      )
    }

    const geminiApiKey = process.env.IMAGE_GENERATION_API_KEY
    if (!geminiApiKey) {
      return NextResponse.json({
        components: [
          { id: 'sofa', label: 'Sofa' },
          { id: 'meeting-table', label: 'Meeting table' },
          { id: 'tv-unit', label: 'TV unit' },
          { id: 'chairs', label: 'Chairs' },
          { id: 'storage-cabinet', label: 'Storage cabinet' },
        ],
      })
    }

    const roomImageParts = images.slice(0, 4).map((img: string) => {
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

    const geminiModel = process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash'

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: 'The following image(s) show a room. Analyze them according to the instructions and list all visible components.' },
                ...roomImageParts,
                { text: ROOM_ANALYSIS_PROMPT },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4096,
          },
        }),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error('Gemini analyze-room error:', errText)
      return NextResponse.json(
        { error: 'Room analysis failed. Please try again.' },
        { status: 502 }
      )
    }

    const data = await response.json()
    // Gemini can return multiple parts; concatenate all text
    const parts = data.candidates?.[0]?.content?.parts ?? []
    const rawText = (Array.isArray(parts)
      ? parts.map((p: { text?: string }) => p?.text ?? '').join('')
      : (data.candidates?.[0]?.content?.parts?.[0]?.text ?? '')
    ).trim()

    // Split: full report (sections A–D) and COMPONENTS_JSON line
    const componentsJsonMarker = 'COMPONENTS_JSON'
    const markerIndex = rawText.indexOf(componentsJsonMarker)
    let fullReport: string | undefined
    let jsonSection = rawText
    if (markerIndex !== -1) {
      fullReport = rawText.slice(0, markerIndex).trim()
      const afterMarker = rawText.slice(markerIndex + componentsJsonMarker.length).trim()
      // Next line(s) after marker typically contain the JSON array
      jsonSection = afterMarker
    }

    // Extract JSON array (from jsonSection or whole response)
    const extractJsonArray = (str: string): string | null => {
      if (!str || typeof str !== 'string') return null
      let cleaned = str
      const codeBlockMatch = cleaned.match(/```\s*json?\s*\n?([\s\S]*?)```/i)
      if (codeBlockMatch) {
        cleaned = codeBlockMatch[1].trim()
      } else {
        cleaned = cleaned.replace(/^\s*```\s*json?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()
      }
      const firstBracket = cleaned.indexOf('[')
      const lastBracket = cleaned.lastIndexOf(']')
      if (firstBracket !== -1 && lastBracket > firstBracket) {
        cleaned = cleaned.slice(firstBracket, lastBracket + 1)
        if (cleaned.startsWith('[') && cleaned.endsWith(']')) return cleaned
      }
      return null
    }

    let parsed: { id: string; label: string }[] | null = null
    const jsonStr = extractJsonArray(jsonSection) ?? extractJsonArray(rawText)
    if (jsonStr && jsonStr.startsWith('[') && jsonStr.endsWith(']')) {
      try {
        const result = JSON.parse(jsonStr)
        if (Array.isArray(result)) parsed = result
      } catch (parseErr) {
        console.warn('analyze-room: JSON.parse failed.', parseErr)
        parsed = null
      }
    }

    const fallbackComponents: { id: string; label: string }[] = [
      { id: 'sofa', label: 'Sofa' },
      { id: 'meeting-table', label: 'Meeting table' },
      { id: 'tv-unit', label: 'TV unit' },
      { id: 'chairs', label: 'Chairs' },
      { id: 'storage-cabinet', label: 'Storage cabinet' },
    ]

    if (!parsed || parsed.length === 0) {
      console.warn('analyze-room: Could not parse components from response, using fallback. Raw length:', rawText.length)
      return NextResponse.json({
        components: fallbackComponents,
        ...(fullReport ? { fullReport } : {}),
      })
    }

    const components = parsed
      .filter((c) => c && typeof c.id === 'string' && typeof c.label === 'string')
      .map((c) => ({ id: String(c.id).trim(), label: String(c.label).trim() }))
      .filter((c) => c.id.length > 0 && c.label.length > 0)

    return NextResponse.json({
      components: components.length > 0 ? components : fallbackComponents,
      ...(fullReport ? { fullReport } : {}),
    })
  } catch (error) {
    console.error('analyze-room error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Room analysis failed' },
      { status: 500 }
    )
  }
}
