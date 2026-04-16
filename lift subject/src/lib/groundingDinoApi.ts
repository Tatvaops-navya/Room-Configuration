/**
 * Grounding DINO API for text-conditioned object detection.
 * Returns bounding boxes for use with SAM (Segment Anything Model).
 * Pipeline: image + text → Grounding DINO → boxes → SAM → mask.
 *
 * Set VITE_GROUNDING_DINO_API_KEY and VITE_GROUNDING_DINO_API_URL in .env.
 * Example: Replicate "lucataco/grounding-dino" or similar endpoint.
 */

import type { Region } from '../types'

const API_KEY = import.meta.env.VITE_GROUNDING_DINO_API_KEY ?? ''
const API_URL = (import.meta.env.VITE_GROUNDING_DINO_API_URL ?? '').replace(/\/$/, '')

export function isGroundingDinoConfigured(): boolean {
  return Boolean(API_KEY && API_URL)
}

/**
 * Default prompt for interior scenes: detect common furniture/objects.
 * Use when no specific type is selected.
 */
export const DEFAULT_DETECTION_PROMPT =
  'sofa . chair . table . lamp . furniture . couch . desk . bed . cabinet'

/**
 * Detect objects in the image using a text prompt (Grounding DINO).
 * Returns bounding boxes in image pixel coordinates [x, y, width, height].
 *
 * Expected API request: POST { image: dataUrl, text_prompt: string }
 * Expected API response: { boxes: [[x1,y1,x2,y2], ...] } (xyxy) or
 *   { boxes: [{ x, y, width, height }, ...] }
 */
export async function detectObjects(
  imageDataUrl: string,
  textPrompt: string
): Promise<Region[]> {
  if (!API_KEY || !API_URL) throw new Error('Grounding DINO not configured')

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: imageDataUrl,
      text_prompt: textPrompt,
      // Common alternative param names
      prompt: textPrompt,
      caption: textPrompt,
    }),
  })

  if (!res.ok) throw new Error(`Grounding DINO API error: ${res.status}`)
  const data = (await res.json()) as Record<string, unknown>

  const raw = data.boxes ?? data.detections ?? data.output
  if (!raw || !Array.isArray(raw) || raw.length === 0) return []

  const regions: Region[] = []
  for (const b of raw) {
    if (Array.isArray(b)) {
      // [x1, y1, x2, y2] (xyxy)
      const [x1, y1, x2, y2] = b.map(Number)
      if (Number.isFinite(x1) && Number.isFinite(y1) && Number.isFinite(x2) && Number.isFinite(y2)) {
        regions.push({
          x: Math.max(0, Math.floor(x1)),
          y: Math.max(0, Math.floor(y1)),
          width: Math.max(1, Math.floor(x2 - x1)),
          height: Math.max(1, Math.floor(y2 - y1)),
        })
      }
    } else if (b && typeof b === 'object' && 'x' in b && 'y' in b && 'width' in b && 'height' in b) {
      regions.push({
        x: Math.max(0, Math.floor(Number((b as Region).x))),
        y: Math.max(0, Math.floor(Number((b as Region).y))),
        width: Math.max(1, Math.floor(Number((b as Region).width))),
        height: Math.max(1, Math.floor(Number((b as Region).height))),
      })
    }
  }
  return regions
}

/**
 * Find the best box that contains the click point (prefer smaller / tighter box).
 */
export function boxContainingPoint(
  boxes: Region[],
  pointX: number,
  pointY: number
): Region | null {
  const containing = boxes.filter(
    (b) =>
      pointX >= b.x &&
      pointX <= b.x + b.width &&
      pointY >= b.y &&
      pointY <= b.y + b.height
  )
  if (containing.length === 0) return null
  // Prefer smallest area (tightest box)
  containing.sort((a, b) => a.width * a.height - b.width * b.height)
  return containing[0]
}
