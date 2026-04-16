/**
 * SAM (Segment Anything Model) API for pixel-level object masks.
 * Receives the FULL original image; bounding box is used only as a prompt.
 * The API must return a mask with the exact same resolution as the input image.
 *
 * Set VITE_SEGMENTATION_API_KEY and VITE_SEGMENTATION_API_URL in .env.
 */

import type { Region } from '../types'

const API_KEY = import.meta.env.VITE_SEGMENTATION_API_KEY ?? ''
const API_URL = (import.meta.env.VITE_SEGMENTATION_API_URL ?? '').replace(/\/$/, '')

export function isSamConfigured(): boolean {
  return Boolean(API_KEY && API_URL)
}

/**
 * Get object mask from SAM using the FULL original image.
 * Point and box are in original image coordinates. The API must return a mask
 * with the same width/height as the input image (no cropping or resizing).
 *
 * @param fullImageDataUrl - Full-size original image (not a crop).
 * @param pointX - Click X in original image coordinates.
 * @param pointY - Click Y in original image coordinates.
 * @param boxInImage - Bounding box in original image coordinates (used only as prompt).
 */
export async function getMaskFromSam(
  fullImageDataUrl: string,
  pointX: number,
  pointY: number,
  boxInImage?: Region
): Promise<string> {
  if (!API_KEY || !API_URL) throw new Error('SAM not configured')

  const payload: Record<string, unknown> = {
    image: fullImageDataUrl,
    point: [Math.round(pointX), Math.round(pointY)],
  }
  if (boxInImage) {
    payload.box = [
      boxInImage.x,
      boxInImage.y,
      boxInImage.x + boxInImage.width,
      boxInImage.y + boxInImage.height,
    ]
    payload.input_box = payload.box
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Segmentation API error: ${res.status}`)
  const data = (await res.json()) as Record<string, unknown>
  const maskUrl = data.mask ?? data.output ?? data.url
  if (!maskUrl) throw new Error('No mask in API response')
  return typeof maskUrl === 'string' ? maskUrl : (maskUrl as string[])[0]
}
