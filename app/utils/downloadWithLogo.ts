/**
 * Display (`applyWatermarkToImage`): diagonal "TatvaOps" text only — no corner logo in the UI.
 * Download (`downloadImageWithLogo`): same pixels plus bottom-right logo (`/tatva-ops-logo.png` or SVG/text fallback).
 * Official PNG uses a black background — removed via makeBlackTransparent before compositing.
 */

const LOGO_PATH_PNG = '/tatva-ops-logo.png'
const LOGO_PATH_SVG = '/tatva-ops-logo.svg'
const WATERMARK_TEXT = 'TatvaOps'
const WATERMARK_OPACITY = 0.32
const WATERMARK_ANGLE_DEG = -35
const WATERMARK_FONT_SIZE_RATIO = 0.06
const WATERMARK_SPACING_X_RATIO = 0.68
const WATERMARK_SPACING_Y_RATIO = 0.58
/** Horizontal wordmark + icon — allow wider footprint, limit height so it stays a corner badge */
const LOGO_MAX_WIDTH_RATIO = 0.38
const LOGO_MAX_HEIGHT_RATIO = 0.1
const LOGO_MIN_SIZE = 64
const PADDING_RATIO = 0.028
/** Knock out near-black studio background on the official logo asset */
const BLACK_THRESHOLD = 52

function logoUrlCandidates(): string[] {
  if (typeof window === 'undefined') return []
  const o = window.location.origin
  return [`${o}${LOGO_PATH_PNG}`, `${o}${LOGO_PATH_SVG}`]
}

function loadImage(src: string, crossOrigin: 'anonymous' | '' | null = null): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (crossOrigin != null) img.crossOrigin = crossOrigin
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image`))
    img.src = src
  })
}

async function fetchAsObjectUrl(url: string): Promise<string> {
  const res = await fetch(url, { mode: 'cors' })
  if (!res.ok) throw new Error('Fetch failed')
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}

function makeBlackTransparent(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const imageData = ctx.getImageData(0, 0, w, h)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    if (r <= BLACK_THRESHOLD && g <= BLACK_THRESHOLD && b <= BLACK_THRESHOLD) {
      data[i + 3] = 0
    }
  }
  ctx.putImageData(imageData, 0, 0)
}

function drawWatermarkPattern(ctx: CanvasRenderingContext2D, imgW: number, imgH: number): void {
  const minDim = Math.min(imgW, imgH)
  const fontSize = Math.max(28, minDim * WATERMARK_FONT_SIZE_RATIO)
  const stepX = minDim * WATERMARK_SPACING_X_RATIO
  const stepY = minDim * WATERMARK_SPACING_Y_RATIO
  const angleRad = (WATERMARK_ANGLE_DEG * Math.PI) / 180

  ctx.save()
  ctx.font = `600 ${fontSize}px sans-serif`
  ctx.fillStyle = `rgba(255, 255, 255, ${WATERMARK_OPACITY})`
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)'
  ctx.lineWidth = Math.max(1, fontSize * 0.05)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const margin = Math.max(stepX, stepY)
  let row = 0
  for (let cy = -margin; cy < imgH + margin; cy += stepY) {
    const offsetX = (row % 2) * (stepX * 0.5)
    for (let cx = -margin + offsetX; cx < imgW + margin; cx += stepX) {
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(angleRad)
      ctx.strokeText(WATERMARK_TEXT, 0, 0)
      ctx.fillText(WATERMARK_TEXT, 0, 0)
      ctx.restore()
    }
    row++
  }
  ctx.restore()
}

/** Bottom-right "tatva:Ops" when PNG/SVG do not load (matches app header colors). */
function drawCornerWordmarkFallback(ctx: CanvasRenderingContext2D, imgW: number, imgH: number): void {
  const padding = Math.max(10, Math.min(imgW, imgH) * PADDING_RATIO)
  const fontSize = Math.max(16, Math.min(imgW, imgH) * 0.038)
  const y = imgH - padding
  const t1 = 'tatva'
  const t2 = ':Ops'
  ctx.save()
  ctx.textBaseline = 'bottom'
  ctx.textAlign = 'right'
  ctx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`
  const w2 = ctx.measureText(t2).width
  ctx.font = `700 ${fontSize}px system-ui, -apple-system, sans-serif`
  const w1 = ctx.measureText(t1).width
  const xRight = imgW - padding
  let x = xRight
  ctx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`
  ctx.lineWidth = Math.max(2.5, fontSize * 0.14)
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.fillStyle = '#f1f5f9'
  ctx.strokeText(t2, x, y)
  ctx.fillText(t2, x, y)
  x -= w2
  ctx.font = `700 ${fontSize}px system-ui, -apple-system, sans-serif`
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.72)'
  ctx.fillStyle = '#ec4899'
  ctx.strokeText(t1, x, y)
  ctx.fillText(t1, x, y)
  ctx.restore()
}

async function drawCornerLogoOnContext(
  ctx: CanvasRenderingContext2D,
  imgW: number,
  imgH: number
): Promise<void> {
  const padding = Math.max(8, Math.min(imgW, imgH) * PADDING_RATIO)
  const maxLogoW = Math.max(LOGO_MIN_SIZE, imgW * LOGO_MAX_WIDTH_RATIO)
  const maxLogoH = Math.max(LOGO_MIN_SIZE, imgH * LOGO_MAX_HEIGHT_RATIO)

  for (const logoUrl of logoUrlCandidates()) {
    try {
      const logoImg = await loadImage(logoUrl, 'anonymous')
      let logoW = logoImg.naturalWidth
      let logoH = logoImg.naturalHeight
      if (logoW <= 0 || logoH <= 0) continue
      const scale = Math.min(maxLogoW / logoW, maxLogoH / logoH, 1)
      logoW = Math.round(logoW * scale)
      logoH = Math.round(logoH * scale)
      if (logoW < 20 || logoH < 20) continue
      const x = imgW - logoW - padding
      const y = imgH - logoH - padding
      const off = document.createElement('canvas')
      off.width = logoW
      off.height = logoH
      const offCtx = off.getContext('2d')
      if (offCtx) {
        offCtx.drawImage(logoImg, 0, 0, logoW, logoH)
        makeBlackTransparent(offCtx, logoW, logoH)
        ctx.drawImage(off, x, y, logoW, logoH)
      } else {
        ctx.drawImage(logoImg, x, y, logoW, logoH)
      }
      return
    } catch {
      continue
    }
  }
  drawCornerWordmarkFallback(ctx, imgW, imgH)
}

/**
 * Diagonal pattern only for on-screen previews (corner logo is added on download only).
 */
export async function applyWatermarkToImage(imageUrl: string): Promise<string> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return imageUrl

  let mainObjectUrl: string | null = null
  try {
    let mainSrc = imageUrl
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      mainObjectUrl = await fetchAsObjectUrl(imageUrl)
      mainSrc = mainObjectUrl
    }
    const mainImg = await loadImage(mainSrc, mainSrc.startsWith('data:') ? null : 'anonymous')
    const imgW = mainImg.naturalWidth
    const imgH = mainImg.naturalHeight
    canvas.width = imgW
    canvas.height = imgH
    ctx.drawImage(mainImg, 0, 0)
    drawWatermarkPattern(ctx, imgW, imgH)
    const dataUrl = canvas.toDataURL('image/png', 0.92)
    if (mainObjectUrl) URL.revokeObjectURL(mainObjectUrl)
    return dataUrl
  } catch (e) {
    if (mainObjectUrl) URL.revokeObjectURL(mainObjectUrl)
    console.error('applyWatermarkToImage failed', e)
    return imageUrl
  }
}

/**
 * Saves PNG with bottom-right TatvaOps logo (on top of the preview — usually diagonal text already baked in).
 */
export async function downloadImageWithLogo(
  imageUrl: string,
  filename: string = `room-configuration-${Date.now()}.png`
): Promise<void> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    fallbackDownload(imageUrl, filename)
    return
  }

  let mainObjectUrl: string | null = null
  try {
    let mainSrc = imageUrl
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      mainObjectUrl = await fetchAsObjectUrl(imageUrl)
      mainSrc = mainObjectUrl
    }
    const mainImg = await loadImage(mainSrc, mainSrc.startsWith('data:') ? null : 'anonymous')
    const imgW = mainImg.naturalWidth
    const imgH = mainImg.naturalHeight
    canvas.width = imgW
    canvas.height = imgH
    ctx.drawImage(mainImg, 0, 0)
    await drawCornerLogoOnContext(ctx, imgW, imgH)

    canvas.toBlob(
      (blob) => {
        if (mainObjectUrl) URL.revokeObjectURL(mainObjectUrl)
        if (!blob) {
          fallbackDownload(imageUrl, filename)
          return
        }
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      },
      'image/png',
      0.95
    )
  } catch (e) {
    if (mainObjectUrl) URL.revokeObjectURL(mainObjectUrl)
    console.error(e)
    fallbackDownload(imageUrl, filename)
  }
}

function fallbackDownload(imageUrl: string, filename: string): void {
  try {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (e) {
    console.error(e)
    throw e
  }
}
