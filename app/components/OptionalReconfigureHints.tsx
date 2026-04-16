'use client'

import { useRef } from 'react'
import { compressImageFile } from '../utils/compressImage'

const MAX_IMAGES = 3
const MAX_TEXT_CHARS = 2000

interface OptionalReconfigureHintsProps {
  notes: string
  onNotesChange: (value: string) => void
  referenceImages: string[]
  onReferenceImagesChange: (images: string[]) => void
  variant?: 'internal' | 'external'
  disabled?: boolean
}

/**
 * Optional Step 4: extra text and/or style reference images (e.g. "make it a bedroom", kitchen moodboard).
 * Layout still comes from uploaded room images; refs are style-only per API rules.
 */
export default function OptionalReconfigureHints({
  notes,
  onNotesChange,
  referenceImages,
  onReferenceImagesChange,
  variant = 'internal',
  disabled = false,
}: OptionalReconfigureHintsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    if (referenceImages.length >= MAX_IMAGES) {
      alert(`You can upload up to ${MAX_IMAGES} optional reference images.`)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    try {
      const remaining = MAX_IMAGES - referenceImages.length
      const toAdd = Array.from(files).slice(0, remaining)
      const newImages = await Promise.all(toAdd.map((f) => compressImageFile(f)))
      onReferenceImagesChange([...referenceImages, ...newImages])
    } catch (e) {
      console.error(e)
      alert('Could not read one or more images. Try again.')
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeAt = (index: number) => {
    onReferenceImagesChange(referenceImages.filter((_, i) => i !== index))
  }

  const space = variant === 'external' ? 'exterior / facade' : 'room'

  return (
    <div className="card">
      <div className="step-label">{variant === 'external' ? '🏡 STEP 4' : '🏠 STEP 4'}</div>
      <div className="step-title-row">
        <h2>Optional: extra direction</h2>
      </div>
      <p className="hint-text" style={{ marginBottom: '0.85rem' }}>
        Totally optional. Add a short note and/or reference images if you want to steer the AI further—for example: turn the space into a{' '}
        {variant === 'external' ? 'different exterior style' : 'bedroom, kitchen, or home office'}, or describe materials and mood. If you skip this,
        your earlier choices (mode, style, palette{variant === 'internal' ? ', components' : ''}) are enough.
      </p>
      <p className="hint-text" style={{ marginBottom: '0.75rem', fontSize: '0.82rem', color: '#64748b' }}>
        Reference images are used for <strong>style, colors, and furniture cues only</strong>. Your uploaded {space} photos still define layout and
        structure.
      </p>

      <label htmlFor="optional-reconfigure-notes" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.88rem', fontWeight: 600 }}>
        Extra instructions (optional)
      </label>
      <textarea
        id="optional-reconfigure-notes"
        style={{
          minHeight: '100px',
          width: '100%',
          marginBottom: '1rem',
          padding: '0.65rem 0.75rem',
          borderRadius: '10px',
          border: '1px solid var(--color-border, #e2e8f0)',
          fontFamily: 'inherit',
          fontSize: '0.92rem',
          resize: 'vertical',
        }}
        placeholder={`e.g. "Reconfigure as a calm bedroom with a queen bed and warm lighting" or "More minimalist kitchen look"`}
        value={notes}
        disabled={disabled}
        maxLength={MAX_TEXT_CHARS}
        onChange={(e) => onNotesChange(e.target.value.slice(0, MAX_TEXT_CHARS))}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
          {notes.length} / {MAX_TEXT_CHARS} characters
        </span>
        {notes.length > 0 && (
          <button type="button" className="button button-secondary" style={{ fontSize: '0.82rem' }} onClick={() => onNotesChange('')} disabled={disabled}>
            Clear text
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
      <button
        type="button"
        className="button button-secondary"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || referenceImages.length >= MAX_IMAGES}
      >
        Add optional reference image{referenceImages.length > 0 ? 's' : ''} (max {MAX_IMAGES})
      </button>
      {referenceImages.length > 0 && (
        <button
          type="button"
          className="button button-secondary"
          style={{ marginLeft: '0.5rem' }}
          onClick={() => onReferenceImagesChange([])}
          disabled={disabled}
        >
          Remove all images
        </button>
      )}

      {referenceImages.length > 0 && (
        <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
          {referenceImages.map((src, i) => (
            <div
              key={i}
              style={{
                position: 'relative',
                width: '96px',
                height: '96px',
                borderRadius: '10px',
                overflow: 'hidden',
                border: '1px solid var(--color-border, #e2e8f0)',
              }}
            >
              <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button
                type="button"
                aria-label={`Remove image ${i + 1}`}
                onClick={() => removeAt(i)}
                disabled={disabled}
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 26,
                  height: 26,
                  borderRadius: '6px',
                  border: 'none',
                  background: 'rgba(0,0,0,0.55)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  lineHeight: 1,
                }}
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
