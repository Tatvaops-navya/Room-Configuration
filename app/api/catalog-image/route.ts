import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

const MAX_BYTES = 8 * 1024 * 1024

/** Hosts that often block browser hotlinking; same-origin proxy fixes preset thumbnails in Internalconfigf (Vite on :5173). */
const ALLOWED_HOSTNAMES = new Set(['cdn.swadeshonline.com'])

function normalizeContentType(header: string | null, url: string): string {
  const ct = (header || '').toLowerCase().split(';')[0].trim()
  if (ct.startsWith('image/')) return ct
  const u = url.toLowerCase()
  if (u.endsWith('.png')) return 'image/png'
  if (u.endsWith('.webp')) return 'image/webp'
  if (u.endsWith('.gif')) return 'image/gif'
  return 'image/jpeg'
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('url')?.trim() || ''
  if (!raw) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 })
  }
  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 })
  }
  if (parsed.protocol !== 'https:') {
    return NextResponse.json({ error: 'Only https catalog URLs are allowed' }, { status: 400 })
  }
  if (!ALLOWED_HOSTNAMES.has(parsed.hostname.toLowerCase())) {
    return NextResponse.json({ error: 'Host not allowed for catalog proxy' }, { status: 403 })
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      method: 'GET',
      cache: 'no-store',
      redirect: 'follow',
      headers: {
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })
    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream image failed (${upstream.status})` },
        { status: 502 }
      )
    }
    const buf = await upstream.arrayBuffer()
    if (buf.byteLength <= 0 || buf.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: 'Invalid image size' }, { status: 502 })
    }
    const contentType = normalizeContentType(upstream.headers.get('content-type'), parsed.toString())
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Fetch failed' },
      { status: 500 }
    )
  }
}
