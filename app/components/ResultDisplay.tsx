'use client'

import { useState } from 'react'

/**
 * ResultDisplay Component
 * Displays the generated room image and provides shuffle functionality
 * 
 * @param imageUrl - Base64 string or URL of the generated image
 * @param onShuffle - Callback when shuffle button is clicked
 * @param onAddFavorite - Callback when the favourite button is clicked
 * @param directionLabel - Optional textual description of North direction to overlay on the image
 * @param shuffleCount - How many times shuffle has been used
 * @param maxShuffles - Maximum allowed shuffles
 * @param isGenerating - Whether generation is in progress
 * @param onImageClick - Optional callback when user clicks inside the image (for customization)
 * @param isCustomizing - Whether the parent is currently in customize mode
 */
interface ResultDisplayProps {
  imageUrl: string
  onShuffle?: () => void
  isGenerating: boolean
  onAddFavorite?: () => void
  shuffleCount?: number
  maxShuffles?: number
  directionLabel?: string
  onImageClick?: (coords: { x: number; y: number }) => void
  isCustomizing?: boolean
}

export default function ResultDisplay({
  imageUrl,
  onShuffle,
  isGenerating,
  onAddFavorite,
  shuffleCount,
  maxShuffles,
  directionLabel,
  onImageClick,
  isCustomizing,
}: ResultDisplayProps) {
  const [zoomLevel, setZoomLevel] = useState(100) // Zoom percentage (100% = normal)

  /**
   * Handle zoom in
   */
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 300)) // Max 300%
  }

  /**
   * Handle zoom out
   */
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 50)) // Min 50%
  }

  /**
   * Reset zoom to 100%
   */
  const handleResetZoom = () => {
    setZoomLevel(100)
  }

  /**
   * Download the generated image
   */
  const handleDownload = () => {
    try {
      // Create a temporary anchor element
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = `room-configuration-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error downloading image:', error)
      alert('Failed to download image. Please try again.')
    }
  }

  const hasShuffleLimit = typeof maxShuffles === 'number' && typeof shuffleCount === 'number'
  const remainingShuffles = hasShuffleLimit ? Math.max(maxShuffles! - shuffleCount!, 0) : null
  const shuffleDisabled = !onShuffle || isGenerating || (hasShuffleLimit && remainingShuffles === 0)

  const handleImageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!onImageClick) return
    const rect = event.currentTarget.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height
    onImageClick({
      x: Math.min(Math.max(x, 0), 1),
      y: Math.min(Math.max(y, 0), 1),
    })
  }

  return (
    <div>
      <h2>Generated Room Configuration</h2>
      <p style={{ marginBottom: '1rem', color: '#666' }}>
        Your AI-generated room layout based on your preferences
      </p>
      
      {/* Image Container with Zoom Controls */}
      <div className="image-zoom-container">
        <div className="zoom-controls">
          <button
            className="zoom-btn"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 50}
            title="Zoom Out"
          >
            −
          </button>
          <span className="zoom-level">{zoomLevel}%</span>
          <button
            className="zoom-btn"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 300}
            title="Zoom In"
          >
            +
          </button>
          {zoomLevel !== 100 && (
            <button
              className="zoom-reset-btn"
              onClick={handleResetZoom}
              title="Reset Zoom"
            >
              Reset
            </button>
          )}
        </div>

        {/* Generated Image – fits in view so full image is visible without scrolling */}
        <div className="image-zoom-wrapper image-result-fit" style={{ position: 'relative' }}>
          {isGenerating && (
            <div className="loading-overlay loading-overlay-bar-only">
              <div className="generating-bar-vertical-track">
                <div className="generating-bar-vertical" aria-hidden />
              </div>
            </div>
          )}
          {directionLabel && (
            <div
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '0.75rem',
                zIndex: 2,
                padding: '0.35rem 0.6rem',
                borderRadius: '999px',
                backgroundColor: 'rgba(15,23,42,0.75)',
                color: '#e5f2ff',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '20px',
                  height: '20px',
                  borderRadius: '999px',
                  border: '1px solid #bfdbfe',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  backgroundColor: 'rgba(30,64,175,0.9)',
                }}
              >
                N
              </span>
              <span style={{ maxWidth: '180px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {directionLabel}
              </span>
            </div>
          )}
          {isCustomizing && !isGenerating && (
            <div
              style={{
                position: 'absolute',
                left: '50%',
                bottom: '0.75rem',
                transform: 'translateX(-50%)',
                padding: '0.25rem 0.75rem',
                borderRadius: '999px',
                backgroundColor: 'rgba(15,23,42,0.7)',
                color: '#e5e7eb',
                fontSize: '0.8rem',
              }}
            >
              Click anywhere in the image to choose what you want to customize.
            </div>
          )}
          {onAddFavorite && (
            <button
              type="button"
              onClick={onAddFavorite}
              title="Add to favourites"
              aria-label="Add this configuration to favourites"
              style={{
                position: 'absolute',
                top: '0.75rem',
                right: '0.75rem',
                zIndex: 2,
                borderRadius: '999px',
                border: 'none',
                padding: '0.4rem 0.6rem',
                backgroundColor: 'rgba(15,23,42,0.7)',
                color: '#f97316',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(15,23,42,0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.85rem',
              }}
            >
              <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>★</span>
              <span>Favourite</span>
            </button>
          )}
          <div
            onClick={handleImageClick}
            style={{ cursor: onImageClick ? 'crosshair' : 'default' }}
          >
            <img 
              src={imageUrl} 
              alt="Generated room configuration" 
            className="result-image result-image-fit"
              style={zoomLevel === 100 ? undefined : { transform: `scale(${zoomLevel / 100})` }}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="button-group" style={{ justifyContent: 'center', marginTop: '1.5rem', gap: '0.75rem' }}>
        <button
          className="button button-secondary"
          onClick={handleDownload}
          title="Download Image"
        >
          💾 Download Image
        </button>
        {onShuffle && (
          <button
            className="button button-secondary"
            onClick={onShuffle}
            disabled={shuffleDisabled}
          >
            {isGenerating ? (
              <>
                <span className="spinner" aria-hidden />
                Shuffling…
              </>
            ) : shuffleDisabled ? (
              'Shuffle limit reached'
            ) : (
              '🔁 Shuffle Layout'
            )}
          </button>
        )}
      </div>

      <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666', textAlign: 'center' }}>
        Use zoom controls to inspect details. Click "Download Image" to save.
        {onShuffle && hasShuffleLimit && remainingShuffles !== null && (
          <span> You can shuffle {remainingShuffles} more time{remainingShuffles === 1 ? '' : 's'}.</span>
        )}
      </p>
    </div>
  )
}
