import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

const MAX_IMAGE_BYTES = 12 * 1024 * 1024

function normalizeImageMimeType(contentType: string | null, url: string): string {
  const ct = (contentType || '').toLowerCase().split(';')[0].trim()
  if (ct.startsWith('image/')) return ct
  const lowerUrl = url.toLowerCase()
  if (lowerUrl.endsWith('.webp')) return 'image/webp'
  if (lowerUrl.endsWith('.png')) return 'image/png'
  if (lowerUrl.endsWith('.gif')) return 'image/gif'
  return 'image/jpeg'
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get('url')?.trim() || ''
  if (!rawUrl) {
    return NextResponse.json({ error: 'Missing "url" query parameter.' }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    return NextResponse.json({ error: 'Invalid URL.' }, { status: 400 })
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return NextResponse.json({ error: 'Only http/https URLs are supported.' }, { status: 400 })
  }

  try {
    const response = await fetch(parsed.toString(), {
      method: 'GET',
      cache: 'no-store',
      redirect: 'follow',
    })
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch source image (${response.status}).` },
        { status: 502 }
      )
    }

    const arrayBuffer = await response.arrayBuffer()
    const bytes = arrayBuffer.byteLength
    if (bytes <= 0) {
      return NextResponse.json({ error: 'Empty image response.' }, { status: 502 })
    }
    if (bytes > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: 'Image is too large to convert. Please use a smaller image.' },
        { status: 413 }
      )
    }

    const mimeType = normalizeImageMimeType(response.headers.get('content-type'), parsed.toString())
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    return NextResponse.json({ dataUrl: `data:${mimeType};base64,${base64}` })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Image fetch failed.' },
      { status: 500 }
    )
  }
}
