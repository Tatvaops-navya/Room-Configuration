import { useCallback, useRef } from 'react'
import { Upload, ImagePlus } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { loadImage, imageToDataUrl } from '../lib/canvasUtils'
import { addToast } from './ToastContainer'

const MAX_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'

export function UploadZone() {
  const inputRef = useRef<HTMLInputElement>(null)
  const { dispatch, state } = useApp()

  const processFile = useCallback(
    async (file: File) => {
      if (!file.type.match(/^image\/(jpeg|png|webp|gif)$/i)) {
        addToast('Please upload a JPG, PNG, WebP, or GIF image.', 'error')
        return
      }
      if (file.size > MAX_SIZE) {
        addToast('Image must be under 10MB.', 'error')
        return
      }
      // Revoke previous blob URL if any (avoid memory leak when re-uploading)
      if (state.image.source?.startsWith('blob:')) {
        URL.revokeObjectURL(state.image.source)
      }
      const url = URL.createObjectURL(file)
      try {
        const img = await loadImage(url)
        const width = img.naturalWidth
        const height = img.naturalHeight
        const originalDataUrl = imageToDataUrl(img)
        dispatch({
          type: 'SET_IMAGE',
          payload: { source: url, file, width, height, originalDataUrl },
        })
        setTimeout(() => {
          dispatch({ type: 'SET_EDITING', payload: { isAnalyzing: false, currentOperation: '', progress: 100 } })
        }, 400)
        addToast('Image loaded — click any object (sofa, chair, lamp, etc.) to extract it', 'success')
      } catch {
        addToast('Failed to load image.', 'error')
        URL.revokeObjectURL(url)
      }
      // Do NOT revoke url here — we keep it so the image stays visible in the canvas
    },
    [dispatch, state.image.source]
  )

  const loadSample = useCallback(async () => {
    const sampleUrl = 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80'
    try {
      const img = await loadImage(sampleUrl)
      const width = img.naturalWidth
      const height = img.naturalHeight
      const originalDataUrl = imageToDataUrl(img)
      dispatch({
        type: 'SET_IMAGE',
        payload: { source: sampleUrl, file: null, width, height, originalDataUrl },
      })
      setTimeout(() => {
        dispatch({ type: 'SET_EDITING', payload: { isAnalyzing: false, currentOperation: '', progress: 100 } })
      }, 400)
      addToast('Image loaded — click any object to extract it', 'success')
    } catch {
      addToast('Failed to load sample image. Try uploading your own.', 'error')
    }
  }, [dispatch])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const onFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processFile(file)
      e.target.value = ''
    },
    [processFile]
  )

  const onClick = useCallback(() => inputRef.current?.click(), [])

  return (
    <div
      className="flex-1 flex items-center justify-center p-6 md:p-12"
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => e.key === 'Enter' && onClick()}
        className="
          w-full max-w-xl rounded-[var(--radius-xl)] border-2 border-dashed border-[var(--neutral-300)]
          bg-white/90 backdrop-blur-sm p-12 md:p-16 text-center cursor-pointer
          hover:border-[var(--primary)] hover:bg-white hover:shadow-[var(--shadow-card)]
          focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-4 focus:ring-offset-[var(--neutral-100)]
          transition-all duration-300
        "
        aria-label="Upload image: drag and drop or click to select"
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          onChange={onFileSelect}
          className="hidden"
          style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
          aria-hidden
        />
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--primary-light)] to-[var(--secondary-light)] flex items-center justify-center text-[var(--primary)] shadow-inner">
            <Upload className="w-10 h-10" strokeWidth={1.8} />
          </div>
        </div>
        <h2 className="font-['Inter',sans-serif] font-semibold text-xl md:text-2xl text-[var(--neutral-900)] mb-2 tracking-tight">
          Drag & drop your image
        </h2>
        <p className="text-sm text-[var(--neutral-500)] mb-1">
          or click to browse · JPG, PNG, WebP, GIF (max 10MB)
        </p>
        <p className="text-xs text-[var(--neutral-400)] mb-8">
          We'll detect extractable components automatically.
        </p>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); loadSample(); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-full)] border border-[var(--neutral-200)] text-sm font-medium text-[var(--neutral-700)] bg-white hover:bg-[var(--neutral-50)] hover:border-[var(--neutral-300)] shadow-sm transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <ImagePlus className="w-4 h-4" />
          Use sample image
        </button>
      </div>
    </div>
  )
}
