/**
 * Client-side image compression to reduce payload size for API calls.
 * Resizes to max 1920px on the longest side and uses JPEG quality 0.82
 * so uploads stay within typical serverless body limits (e.g. Vercel 4.5MB).
 */

const MAX_DIMENSION = 1920
const JPEG_QUALITY = 0.82
const MAX_FILE_SIZE_BEFORE_COMPRESS = 800 * 1024 // 800 KB – only compress if larger

export function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'))
      return
    }
    // If file is small enough, just read as data URL (faster, no quality loss)
    if (file.size <= MAX_FILE_SIZE_BEFORE_COMPRESS) {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
      return
    }
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      let { width, height } = img
      if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(file)
        return
      }
      if (width > height) {
        height = Math.round((height * MAX_DIMENSION) / width)
        width = MAX_DIMENSION
      } else {
        width = Math.round((width * MAX_DIMENSION) / height)
        height = MAX_DIMENSION
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(file)
        return
      }
      ctx.drawImage(img, 0, 0, width, height)
      const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
      try {
        const dataUrl = canvas.toDataURL(mime, mime === 'image/jpeg' ? JPEG_QUALITY : 0.92)
        resolve(dataUrl)
      } catch (e) {
        reject(e)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image'))
    }
    img.src = objectUrl
  })
}
