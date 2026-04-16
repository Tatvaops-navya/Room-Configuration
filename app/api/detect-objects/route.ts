/**
 * Grounding DINO / object detection API proxy.
 * Receives image + text prompt; returns bounding boxes.
 * Configure GROUNDING_DINO_API_KEY and GROUNDING_DINO_API_URL in .env.local
 */

import { NextRequest, NextResponse } from 'next/server'

const API_KEY = process.env.GROUNDING_DINO_API_KEY ?? ''
const API_URL = (process.env.GROUNDING_DINO_API_URL ?? '').replace(/\/$/, '')

const DEFAULT_PROMPT =
  'sofa . chair . coffee table . desk . wall . floor . door . glass partition . reception desk'

export async function POST(request: NextRequest) {
  if (!API_KEY || !API_URL) {
    return NextResponse.json(
      { error: 'Object detection not configured. Set GROUNDING_DINO_API_KEY and GROUNDING_DINO_API_URL.' },
      { status: 503 }
    )
  }
  try {
    const body = await request.json()
    const { image, prompt } = body as { image: string; prompt?: string }
    if (typeof image !== 'string') {
      return NextResponse.json({ error: 'Payload requires { image }' }, { status: 400 })
    }
    const textPrompt = typeof prompt === 'string' && prompt.trim() ? prompt.trim() : DEFAULT_PROMPT
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image,
        text_prompt: textPrompt,
        prompt: textPrompt,
        caption: textPrompt,
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json(
        { error: err || `Detection API error: ${res.status}` },
        { status: res.status }
      )
    }
    const data = (await res.json()) as Record<string, unknown>
    const raw = data.boxes ?? data.detections ?? data.output
    if (!raw || !Array.isArray(raw)) return NextResponse.json({ boxes: [] })
    const boxes: Array<{ x: number; y: number; width: number; height: number }> = []
    for (const b of raw) {
      if (Array.isArray(b)) {
        const [x1, y1, x2, y2] = b.map(Number)
        if (Number.isFinite(x1) && Number.isFinite(y1) && Number.isFinite(x2) && Number.isFinite(y2)) {
          boxes.push({
            x: Math.max(0, Math.floor(x1)),
            y: Math.max(0, Math.floor(y1)),
            width: Math.max(1, Math.floor(x2 - x1)),
            height: Math.max(1, Math.floor(y2 - y1)),
          })
        }
      } else if (b && typeof b === 'object' && 'x' in b) {
        const r = b as { x: number; y: number; width: number; height: number }
        boxes.push({
          x: Math.max(0, Math.floor(Number(r.x))),
          y: Math.max(0, Math.floor(Number(r.y))),
          width: Math.max(1, Math.floor(Number(r.width ?? 1))),
          height: Math.max(1, Math.floor(Number(r.height ?? 1))),
        })
      }
    }
    return NextResponse.json({ boxes })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Detection failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
