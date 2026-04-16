import { NextRequest, NextResponse } from 'next/server'
import RunwayML from '@runwayml/sdk'
import sharp from 'sharp'
import { uploadTourFrameAndGetSignedUrl } from '@/app/lib/server/runwayTourImageUrl'

export const maxDuration = 300

/**
 * Motion-only prompt: Gen-4 uses the image as the first frame; text should describe camera movement.
 * Max 1000 UTF-16 code units per Runway API.
 */
const RUNWAY_TOUR_MOTION_PROMPT =
  'Eye-level architectural walkthrough: one smooth horizontal sweep across the entire visible room — start toward one side of the frame and travel all the way to the other so the far wall, back of the room, side walls, corners, ceiling line, and floor depth all get screen time. Do not linger on a single wall or one direction; the motion should feel like taking in the whole space (roughly 180–270 degrees of turn within the scene) at a moderate steady pace — not sluggish, not a whip pan. Keep horizon level. Do not add people, text, logos, or new objects; only camera pan/rotation, preserving the same room as the first frame.'

const GEN4_RATIOS = [
  '1280:720',
  '720:1280',
  '1104:832',
  '832:1104',
  '960:960',
  '1584:672',
] as const

type Gen4Ratio = (typeof GEN4_RATIOS)[number]

function parseDuration(): number {
  const raw = process.env.RUNWAY_VIDEO_DURATION?.trim()
  if (raw === '5') return 5
  return 10
}

function parseRatio(): Gen4Ratio {
  const raw = process.env.RUNWAY_VIDEO_RATIO?.trim()
  if (raw && (GEN4_RATIOS as readonly string[]).includes(raw)) {
    return raw as Gen4Ratio
  }
  return '1280:720'
}

function parseSeed(): number | undefined {
  const raw = process.env.RUNWAY_VIDEO_SEED?.trim()
  if (!raw) return undefined
  const n = Number(raw)
  return Number.isFinite(n) ? n : undefined
}

async function normalizeTourImage(dataUrl: string): Promise<Buffer> {
  if (!dataUrl.startsWith('data:')) throw new Error('Invalid data URL')
  const comma = dataUrl.indexOf(',')
  if (comma < 0) throw new Error('Invalid data URL')
  const header = dataUrl.slice(0, comma)
  const b64 = dataUrl.slice(comma + 1).replace(/\s/g, '')
  const mimeMatch = /^data:([^;]+);base64$/i.exec(header)
  if (!mimeMatch) throw new Error('Invalid data URL')
  const raw = Buffer.from(b64, 'base64')
  if (raw.length > 19 * 1024 * 1024) {
    throw new Error('Image is too large (max ~19 MB before processing)')
  }
  return sharp(raw)
    .rotate()
    .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 90 })
    .toBuffer()
}

function getRunwayClient(): RunwayML {
  const apiKey = process.env.RUNWAYML_API_SECRET?.trim()
  if (!apiKey) {
    throw new Error('RUNWAYML_API_SECRET is not set')
  }
  return new RunwayML({ apiKey })
}

export async function POST(req: NextRequest) {
  if (!process.env.RUNWAYML_API_SECRET?.trim()) {
    return NextResponse.json({ error: 'Server missing RUNWAYML_API_SECRET' }, { status: 503 })
  }

  let body: { imageDataUrl?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const imageDataUrl = body.imageDataUrl
  if (typeof imageDataUrl !== 'string' || !imageDataUrl.startsWith('data:')) {
    return NextResponse.json({ error: 'imageDataUrl required (base64 data URL)' }, { status: 400 })
  }

  let jpeg: Buffer
  try {
    jpeg = await normalizeTourImage(imageDataUrl)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Image processing failed'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  let signedUrl: string
  try {
    signedUrl = await uploadTourFrameAndGetSignedUrl(jpeg)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Could not host image for Runway'
    const status = msg.includes('not set') || msg.includes('Missing') ? 503 : 502
    return NextResponse.json({ error: msg }, { status })
  }

  try {
    const client = getRunwayClient()
    const ratio = parseRatio()
    const duration = parseDuration()
    const seed = parseSeed()

    const created = await client.imageToVideo.create({
      model: 'gen4_turbo',
      promptImage: [{ uri: signedUrl, position: 'first' }],
      ratio,
      duration,
      promptText: RUNWAY_TOUR_MOTION_PROMPT,
      ...(seed !== undefined ? { seed } : {}),
    })

    return NextResponse.json({ operationName: created.id })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Runway image-to-video failed'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}

export async function GET(req: NextRequest) {
  if (!process.env.RUNWAYML_API_SECRET?.trim()) {
    return NextResponse.json({ error: 'Server missing RUNWAYML_API_SECRET' }, { status: 503 })
  }

  const taskId = req.nextUrl.searchParams.get('op')
  if (!taskId) {
    return NextResponse.json({ error: 'Missing op query parameter (Runway task id)' }, { status: 400 })
  }

  try {
    const client = getRunwayClient()
    const task = await client.tasks.retrieve(taskId)

    if (task.status === 'SUCCEEDED') {
      const url = task.output[0]
      if (!url || typeof url !== 'string') {
        return NextResponse.json({ error: 'No output URL in completed task' }, { status: 502 })
      }
      const videoRes = await fetch(url, { redirect: 'follow' })
      if (!videoRes.ok) {
        return NextResponse.json({ error: `Video download failed (${videoRes.status})` }, { status: 502 })
      }
      const buf = Buffer.from(await videoRes.arrayBuffer())
      return new NextResponse(buf, {
        status: 200,
        headers: {
          'Content-Type': 'video/mp4',
          'Cache-Control': 'private, max-age=600',
        },
      })
    }

    if (task.status === 'FAILED') {
      return NextResponse.json(
        { error: task.failure || 'Runway generation failed', code: task.failureCode },
        { status: 502 }
      )
    }

    if (task.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Runway task was cancelled' }, { status: 502 })
    }

    return NextResponse.json({ pending: true }, { status: 202 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Runway task lookup failed'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
