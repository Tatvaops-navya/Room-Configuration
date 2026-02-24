'use client'

import { useRef } from 'react'

interface ComponentReferenceUploadProps {
  referenceImages: string[]
  onChange: (images: string[]) => void
  maxImages?: number
  // Optional short labels so the user can describe what each reference is
  referenceLabels?: string[]
  onLabelsChange?: (labels: string[]) => void
}

/**
 * ComponentReferenceUpload
 *
 * Lightweight uploader specifically for reference component images
 * (chairs, tables, storage, etc.). These are used only as style/shape
 * references for the AI, not as room context images.
 */
export default function ComponentReferenceUpload({
  referenceImages,
  onChange,
  maxImages = 6,
  referenceLabels = [],
  onLabelsChange,
}: ComponentReferenceUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    if (referenceImages.length >= maxImages) {
      alert(`You can upload a maximum of ${maxImages} reference component images.`)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    try {
      const remainingSlots = maxImages - referenceImages.length
      const filesToUse = Array.from(files).slice(0, remainingSlots)

      const newImages = await Promise.all(filesToUse.map(file => fileToBase64(file)))
      onChange([...referenceImages, ...newImages])

      // Extend labels array with empty labels for each new image
      if (onLabelsChange) {
        const newLabels = [...referenceLabels]
        for (let i = 0; i < newImages.length; i++) {
          newLabels.push('')
        }
        onLabelsChange(newLabels)
      }
    } catch (error) {
      console.error('Error reading reference files:', error)
      alert('Error reading reference images. Please try again.')
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemove = (index: number) => {
    const updated = referenceImages.filter((_, i) => i !== index)
    onChange(updated)

    if (onLabelsChange) {
      const updatedLabels = referenceLabels.filter((_, i) => i !== index)
      onLabelsChange(updatedLabels)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      <button
        type="button"
        className="button button-secondary"
        onClick={handleClick}
        disabled={referenceImages.length >= maxImages}
      >
        Upload reference images
      </button>

      <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>
        {referenceImages.length} / {maxImages} reference images selected
      </p>

      {referenceImages.length > 0 && (
        <div className="image-preview-grid" style={{ marginTop: '0.75rem' }}>
          {referenceImages.map((img, index) => (
            <div key={index}>
              <div className="image-preview">
                <img src={img} alt={`Component reference ${index + 1}`} />
                <button
                  className="remove-btn"
                  onClick={() => handleRemove(index)}
                  title="Remove reference image"
                >
                  ×
                </button>
              </div>
              {onLabelsChange && (
                <input
                  type="text"
                  className="input"
                  style={{ marginTop: '0.3rem' }}
                  placeholder="What is this? (e.g., potted plants, sofa, TV wall, pendant lights)"
                  value={referenceLabels[index] ?? ''}
                  onChange={(e) => {
                    const newLabels = [...referenceLabels]
                    newLabels[index] = e.target.value
                    onLabelsChange(newLabels)
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

