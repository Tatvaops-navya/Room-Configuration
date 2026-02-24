/**
 * Composites the company logo onto the generated image at the bottom-right corner
 * and triggers download. If the logo fails to load, downloads the image without the logo.
 */

const LOGO_PATH = '/tatva-ops-logo.png'
const LOGO_MAX_WIDTH_RATIO = 0.22  // logo width up to 22% of image width
const LOGO_MAX_HEIGHT_RATIO = 0.14 // logo height up to 14% of image height
const LOGO_MIN_SIZE = 80            // minimum logo width/height in px so it stays visible
const PADDING_RATIO = 0.025        // padding from edge = 2.5% of smaller dimension
const BLACK_THRESHOLD = 45         // pixels with r,g,b below this become transparent (remove black bg)

function getLogoUrl(): string {
  if (typeof window === 'undefined') return LOGO_PATH
  return `${window.location.origin}${LOGO_PATH}`
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

/** Fetch image as blob and return object URL so canvas is not tainted by cross-origin. */
async function fetchAsObjectUrl(url: string): Promise<string> {
  const res = await fetch(url, { mode: 'cors' })
  if (!res.ok) throw new Error('Fetch failed')
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}

/** Make dark/black pixels in the canvas transparent so logo has no black background. */
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

    const logoUrl = getLogoUrl()
    try {
      const logoImg = await loadImage(logoUrl, 'anonymous')
      const padding = Math.max(8, Math.min(imgW, imgH) * PADDING_RATIO)
      const maxLogoW = Math.max(LOGO_MIN_SIZE, imgW * LOGO_MAX_WIDTH_RATIO)
      const maxLogoH = Math.max(LOGO_MIN_SIZE, imgH * LOGO_MAX_HEIGHT_RATIO)
      let logoW = logoImg.naturalWidth
      let logoH = logoImg.naturalHeight
      if (logoW > 0 && logoH > 0) {
        const scale = Math.min(maxLogoW / logoW, maxLogoH / logoH, 1)
        logoW = Math.round(logoW * scale)
        logoH = Math.round(logoH * scale)
        if (logoW >= 20 && logoH >= 20) {
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
        }
      }
    } catch {
      // Logo image failed; draw text watermark so branding still appears
      try {
        const padding = Math.max(8, Math.min(imgW, imgH) * PADDING_RATIO)
        const fontSize = Math.max(12, Math.min(imgW, imgH) * 0.03)
        ctx.font = `600 ${fontSize}px sans-serif`
        ctx.fillStyle = 'rgba(0,0,0,0.6)'
        ctx.strokeStyle = 'rgba(255,255,255,0.8)'
        ctx.lineWidth = 2
        const text = 'Tatva:Ops'
        ctx.measureText(text)
        const textW = ctx.measureText(text).width
        const textH = fontSize * 1.2
        const x = imgW - textW - padding * 2
        const y = imgH - padding
        ctx.strokeText(text, x, y)
        ctx.fillText(text, x, y)
      } catch {
        // ignore
      }
    }

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
