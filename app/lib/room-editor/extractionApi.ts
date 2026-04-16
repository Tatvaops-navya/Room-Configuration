/**
 * Client-side extraction: call SAM API, build cutout.
 * Used for click/hover/auto selection modes.
 */

import {
  applyMaskToFullImage,
  cropToDataUrl,
  bboxFromMaskDataUrl,
  type RegionPx,
} from './cutoutUtils'

export interface ExtractResult {
  cutoutDataUrl: string
  maskDataUrl: string
  regionPx: RegionPx
  /** Normalized bbox for display */
  boundingBox: { x: number; y: number; width: number; height: number }
}

/** Normalize to 0–1 for store. */
function regionToNormalized(r: RegionPx, w: number, h: number) {
  return {
    x: r.x / w,
    y: r.y / h,
    width: r.width / w,
    height: r.height / h,
  }
}

/**
 * Extract object at click point using SAM.
 * Returns cutout + mask + region for compositing.
 */
export async function extractAtPoint(
  imageDataUrl: string,
  pointX: number,
  pointY: number,
  imageWidth: number,
  imageHeight: number
): Promise<ExtractResult> {
  const res = await fetch('/api/segment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: imageDataUrl,
      pointX: Math.round(pointX),
      pointY: Math.round(pointY),
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Segmentation failed')
  const maskDataUrl = (data as { mask?: string }).mask
  if (!maskDataUrl) throw new Error('No mask in response')
  const regionPx = await bboxFromMaskDataUrl(maskDataUrl, imageWidth, imageHeight, 4)
  const fullSizeCutout = await applyMaskToFullImage(imageDataUrl, maskDataUrl)
  const croppedCutout = await cropToDataUrl(fullSizeCutout, regionPx)
  const boundingBox = regionToNormalized(regionPx, imageWidth, imageHeight)
  return { cutoutDataUrl: croppedCutout, maskDataUrl, regionPx, boundingBox }
}

/**
 * Extract object from rectangular region (e.g. from DINO box or user-drawn rect).
 */
export async function extractFromRegion(
  imageDataUrl: string,
  regionPx: RegionPx,
  imageWidth: number,
  imageHeight: number
): Promise<ExtractResult> {
  const centerX = regionPx.x + regionPx.width / 2
  const centerY = regionPx.y + regionPx.height / 2
  const box = [
    regionPx.x,
    regionPx.y,
    regionPx.x + regionPx.width,
    regionPx.y + regionPx.height,
  ] as [number, number, number, number]
  const res = await fetch('/api/segment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: imageDataUrl,
      pointX: Math.round(centerX),
      pointY: Math.round(centerY),
      box,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Segmentation failed')
  const maskDataUrl = (data as { mask?: string }).mask
  if (!maskDataUrl) throw new Error('No mask in response')
  const maskRegionPx = await bboxFromMaskDataUrl(maskDataUrl, imageWidth, imageHeight, 4)
  const fullSizeCutout = await applyMaskToFullImage(imageDataUrl, maskDataUrl)
  const croppedCutout = await cropToDataUrl(fullSizeCutout, maskRegionPx)
  const boundingBox = regionToNormalized(maskRegionPx, imageWidth, imageHeight)
  return {
    cutoutDataUrl: croppedCutout,
    maskDataUrl,
    regionPx: maskRegionPx,
    boundingBox,
  }
}
