/**
 * SAM (Segment Anything Model) API proxy.
 * Receives image + point/box; returns mask data URL.
 * Configure SEGMENTATION_API_KEY and SEGMENTATION_API_URL in .env.local
 */

import { NextRequest, NextResponse } from 'next/server'

const API_KEY = process.env.SEGMENTATION_API_KEY ?? ''
const API_URL = (process.env.SEGMENTATION_API_URL ?? '').replace(/\/$/, '')

export async function POST(request: NextRequest) {
  if (!API_KEY || !API_URL) {
    return NextResponse.json(
      { error: 'Segmentation not configured. Set SEGMENTATION_API_KEY and SEGMENTATION_API_URL.' },
      { status: 503 }
    )
  }
  try {
    const body = await request.json()
    const { image, pointX, pointY, box } = body as {
      image: string
      pointX: number
      pointY: number
      box?: [number, number, number, number]
    }
    if (typeof image !== 'string' || typeof pointX !== 'number' || typeof pointY !== 'number') {
      return NextResponse.json(
        { error: 'Payload requires { image, pointX, pointY }' },
        { status: 400 }
      )
    }
    const payload: Record<string, unknown> = {
      image,
      point: [Math.round(pointX), Math.round(pointY)],
    }
    if (Array.isArray(box) && box.length === 4) {
      payload.box = box
      payload.input_box = box
    }
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json(
        { error: err || `Segmentation API error: ${res.status}` },
        { status: res.status }
      )
    }
    const data = (await res.json()) as Record<string, unknown>
    const maskUrl = data.mask ?? data.output ?? data.url
    if (!maskUrl) return NextResponse.json({ error: 'No mask in API response' }, { status: 502 })
    const mask = typeof maskUrl === 'string' ? maskUrl : (maskUrl as string[])[0]
    return NextResponse.json({ mask })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Segmentation failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
