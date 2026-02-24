import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route: /api/analyze-external
 *
 * Analyzes uploaded external house images (facade, side/back, compound) and returns
 * a structured report plus a JSON list of detected external components.
 *
 * Expected request body: { images: string[] }
 * Returns: { components: { id: string, label: string }[], fullReport?: string }
 */

const EXTERNAL_ANALYSIS_PROMPT = `You are an AI visual analysis system specialized in external building and property understanding.

The user has uploaded one or more images of a house or building exterior (front elevation, side/back views, compound or open area).
Your task is to analyze the image(s) carefully and identify all visible external structure and elements.

STRICT RULES:
- Do NOT redesign or suggest improvements.
- Do NOT assume elements that are not clearly visible.
- Detect only what can be seen in the image(s).

ANALYSIS OBJECTIVE:
Create a complete inventory of visible external elements based purely on visual evidence.

DETECTION SCOPE:

1. Facade & Main Structure
- Main building facade
- Roof type
- Exterior walls / cladding
- Entry door

2. Gates & Boundaries
- Main gate
- Compound wall
- Fencing
- Boundary elements

3. Balconies & Openings
- Balconies
- Terraces
- Windows (exterior view)
- Openings

4. Parking & Driveway
- Parking area
- Driveway
- Carport / garage

5. Open Spaces & Landscaping
- Open compound area
- Lawn / garden
- Pathways
- Visible landscaping

OUTPUT FORMAT:

Present the detected items in a structured list (A through D or E as relevant). Use clear bullet points.
If any detail is unclear, mention "not clearly visible".

---

After your structured analysis, you MUST add the following so the configuration tool can show a component list:

On a new line write exactly: COMPONENTS_JSON
Then on the next line output ONLY a valid JSON array of objects. Each object must have exactly two fields:
- "id": a short slug in lowercase with hyphens (e.g. "facade", "main-gate", "compound-wall", "balconies", "parking-area")
- "label": a short human-readable name (e.g. "Facade", "Main gate", "Compound wall", "Balconies", "Parking area")

Include one entry for each detected external element (facade, gate, compound wall, balconies, parking, open spaces, etc.).
Example: [{"id":"facade","label":"Facade"},{"id":"main-gate","label":"Main gate"},{"id":"compound-wall","label":"Compound wall"},{"id":"balconies","label":"Balconies"},{"id":"parking-area","label":"Parking area"}]`

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
        { error: 'At least one external image is required' },
        { status: 400 }
      )
    }

    const geminiApiKey = process.env.IMAGE_GENERATION_API_KEY
    if (!geminiApiKey) {
      return NextResponse.json({
        components: [
          { id: 'facade', label: 'Facade' },
          { id: 'main-gate', label: 'Main gate' },
          { id: 'compound-wall', label: 'Compound wall' },
          { id: 'balconies', label: 'Balconies' },
          { id: 'parking-area', label: 'Parking area' },
        ],
      })
    }

    const imageParts = images.slice(0, 4).map((img: string) => {
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
                { text: 'The following image(s) show a house or building exterior. Analyze them and list all visible external structure and elements.' },
                ...imageParts,
                { text: EXTERNAL_ANALYSIS_PROMPT },
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
      console.error('Gemini analyze-external error:', errText)
      return NextResponse.json(
        { error: 'External analysis failed. Please try again.' },
        { status: 502 }
      )
    }

    const data = await response.json()
    const parts = data.candidates?.[0]?.content?.parts ?? []
    const rawText = (Array.isArray(parts)
      ? parts.map((p: { text?: string }) => p?.text ?? '').join('')
      : (data.candidates?.[0]?.content?.parts?.[0]?.text ?? '')
    ).trim()

    const componentsJsonMarker = 'COMPONENTS_JSON'
    const markerIndex = rawText.indexOf(componentsJsonMarker)
    let fullReport: string | undefined
    let jsonSection = rawText
    if (markerIndex !== -1) {
      fullReport = rawText.slice(0, markerIndex).trim()
      const afterMarker = rawText.slice(markerIndex + componentsJsonMarker.length).trim()
      jsonSection = afterMarker
    }

    function extractJsonArray(str: string): string | null {
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
        console.warn('analyze-external: JSON.parse failed.', parseErr)
        parsed = null
      }
    }

    const fallbackComponents: { id: string; label: string }[] = [
      { id: 'facade', label: 'Facade' },
      { id: 'main-gate', label: 'Main gate' },
      { id: 'compound-wall', label: 'Compound wall' },
      { id: 'balconies', label: 'Balconies' },
      { id: 'parking-area', label: 'Parking area' },
    ]

    if (!parsed || parsed.length === 0) {
      console.warn('analyze-external: Could not parse components, using fallback.')
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
    console.error('analyze-external error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'External analysis failed' },
      { status: 500 }
    )
  }
}
