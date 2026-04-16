'use client'

import { useRef } from 'react'
import { compressImageFile } from '../utils/compressImage'

interface ComponentReferenceUploadProps {
  referenceImages: string[]
  referenceLabels: string[]
  onLabelsChange: (labels: string[]) => void
  onChange: (images: string[]) => void
  maxImages?: number
}

/**
 * Reference images for component-based arrangement (e.g. desk, chair to add).
 * Each slot can have a short label for the prompt.
 */
export default function ComponentReferenceUpload({
  referenceImages,
  referenceLabels,
  onLabelsChange,
  onChange,
  maxImages = 6,
}: ComponentReferenceUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    if (referenceImages.length >= maxImages) {
      alert(`You can upload a maximum of ${maxImages} reference images.`)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    try {
      const remainingSlots = maxImages - referenceImages.length
      const filesToUse = Array.from(files).slice(0, remainingSlots)
      const newImages = await Promise.all(filesToUse.map((file) => compressImageFile(file)))
      const added = newImages.length
      onChange([...referenceImages, ...newImages])
      onLabelsChange([...referenceLabels, ...Array(added).fill('')])
    } catch (error) {
      console.error('Error reading reference files:', error)
      alert('Error reading reference images. Please try again.')
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRemove = (index: number) => {
    onChange(referenceImages.filter((_, i) => i !== index))
    onLabelsChange(referenceLabels.filter((_, i) => i !== index))
  }

  const handleLabelChange = (index: number, value: string) => {
    const next = [...referenceLabels]
    while (next.length <= index) next.push('')
    next[index] = value
    onLabelsChange(next)
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
        onClick={() => fileInputRef.current?.click()}
        disabled={referenceImages.length >= maxImages}
      >
        Upload component reference image(s)
      </button>

      <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>
        {referenceImages.length} / {maxImages} images — add a short label per image (e.g. desk, chair).
      </p>

      {referenceImages.length > 0 && (
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {referenceImages.map((img, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.75rem',
                alignItems: 'flex-start',
                padding: '0.75rem',
                border: '1px solid var(--color-border, #e2e8f0)',
                borderRadius: '10px',
                background: 'var(--color-surface, #fff)',
              }}
            >
              <div className="image-preview" style={{ width: 100, height: 100, flexShrink: 0 }}>
                <img src={img} alt={`Reference ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                <label className="label" htmlFor={`component-ref-label-${index}`} style={{ display: 'block', marginBottom: '0.35rem' }}>
                  Description
                </label>
                <input
                  id={`component-ref-label-${index}`}
                  type="text"
                  className="input"
                  placeholder="e.g. desk, chair, storage unit"
                  value={referenceLabels[index] ?? ''}
                  onChange={(e) => handleLabelChange(index, e.target.value)}
                  style={{ width: '100%', maxWidth: '320px' }}
                />
              </div>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => handleRemove(index)}
                title="Remove"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
