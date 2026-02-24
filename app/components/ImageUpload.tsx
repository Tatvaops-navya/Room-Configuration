'use client'

import { useRef } from 'react'

/**
 * ImageUpload Component
 * Handles uploading and previewing multiple room images
 * 
 * @param images - Array of base64 image strings
 * @param onImagesChange - Callback when images change
 * @param minImages - Minimum number of images required
 * @param maxImages - Maximum number of images allowed
 */
interface ImageUploadProps {
  images: string[]
  onImagesChange: (images: string[]) => void
  minImages: number
  maxImages: number
  /** Optional title (e.g. "Upload Internal Room Images") */
  title?: string
  /** Optional hint text below title */
  hintText?: string
}

export default function ImageUpload({ images, onImagesChange, minImages, maxImages, title, hintText }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * Convert file to base64 string for easy handling
   */
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  /**
   * Handle file selection
   */
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    // Prevent uploading more than the allowed maximum
    if (images.length >= maxImages) {
      alert(`You can upload a maximum of ${maxImages} images for this room.`)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    try {
      const remainingSlots = maxImages - images.length

      // Only take as many files as we have slots for
      const filesToUse = Array.from(files).slice(0, remainingSlots)

      // Convert selected files to base64
      const newImages = await Promise.all(
        filesToUse.map(file => fileToBase64(file))
      )

      // Add new images to existing ones
      onImagesChange([...images, ...newImages])
    } catch (error) {
      console.error('Error reading files:', error)
      alert('Error reading image files. Please try again.')
    }

    // Reset input to allow selecting same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  /**
   * Remove an image by index
   */
  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }

  /**
   * Trigger file input click
   */
  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div>
      {title && <h3 style={{ marginBottom: '0.5rem' }}>{title}</h3>}
      {hintText && <p className="hint-text" style={{ marginBottom: '1rem' }}>{hintText}</p>}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      <button
        className="button button-upload"
        onClick={handleUploadClick}
        type="button"
        disabled={images.length >= maxImages}
      >
        Upload Images
      </button>

      {/* Image count indicator */}
      <p className={`image-count ${images.length >= minImages ? 'ready' : 'pending'}`}>
        {images.length} / {maxImages} images uploaded (min {minImages})
        {images.length >= minImages && ' ✓'}
      </p>

      {/* Image previews */}
      {images.length > 0 && (
        <div className="image-preview-grid">
          {images.map((image, index) => (
            <div key={index} className="image-preview">
              <img src={image} alt={`Room image ${index + 1}`} />
              <button
                className="remove-btn"
                onClick={() => handleRemoveImage(index)}
                title="Remove image"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
