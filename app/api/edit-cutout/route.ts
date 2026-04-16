/**
 * Edit a cutout image with AI. Returns the edited cutout.
 * Used for Lift Subject flow: edit cutout → composite onto base image.
 */

import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 300

const parsedCutoutTimeout = Number(process.env.GEMINI_IMAGE_TIMEOUT_MS)
const GEMINI_TIMEOUT_MS =
  Number.isFinite(parsedCutoutTimeout) && parsedCutoutTimeout >= 60_000 && parsedCutoutTimeout <= 600_000
    ? parsedCutoutTimeout
    : 300_000
const NO_LOGO =
  'CRITICAL – NO TEXT, LOGOS, OR NAMES IN OUTPUT: The generated image must contain ZERO text, logos, and brand names.\n\n'

function parseDataUrl(dataUrl: string): { data: string; mimeType: string } | null {
  if (!dataUrl?.includes(',')) return null
  const [header, b64] = dataUrl.split(',')
  if (!b64) return null
  const m = header?.match(/data:([^;]+)/)
  const mimeType = m?.[1]?.toLowerCase().startsWith('image/') ? m[1] : 'image/png'
  return { data: b64, mimeType }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cutout, prompt } = body as { cutout?: string; prompt?: string }
    if (typeof cutout !== 'string') {
      return NextResponse.json(
        { error: 'Payload requires { cutout: dataUrl, prompt?: string }' },
        { status: 400 }
      )
    }

    const parts = parseDataUrl(cutout)
    if (!parts) {
      return NextResponse.json({ error: 'Invalid cutout data URL' }, { status: 400 })
    }

    const apiKey = process.env.IMAGE_GENERATION_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Image generation API key is not configured' },
        { status: 500 }
      )
    }

    const userPrompt =
      prompt ||
      'Improve this object to match the room style. Keep the same pose and proportions.'
    const basePrompt = `${NO_LOGO}You are given an image of a furniture or object cutout (transparent background). Modify it according to the user's instructions. Preserve the exact same dimensions and transparent background. Output only the modified object, no text or labels.\n\nUser instructions: ${userPrompt}`

    const fetchBody = JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { text: basePrompt },
            { inlineData: { data: parts.data, mimeType: parts.mimeType } },
          ],
        },
      ],
      generationConfig: { temperature: 0 },
    })

    const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-3-pro-image-preview'
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS)
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: fetchBody,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      const errText = await res.text()
      return NextResponse.json(
        { error: errText || res.statusText },
        { status: res.status }
      )
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
      return NextResponse.json(
        { error: 'Image model did not return image data' },
        { status: 502 }
      )
    }

    const mime = part.inlineData.mimeType || 'image/png'
    const imageUrl = `data:${mime};base64,${part.inlineData.data}`
    return NextResponse.json({ success: true, imageUrl })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Edit cutout failed' },
      { status: 500 }
    )
  }
}
