'use client'

import { useState } from 'react'
import { swatchHexFromOption } from '@/app/utils/customizationSwatch'

export type StyleGridOption = {
  id: string
  label: string
  description?: string
  color?: string
  imageUrl?: string
}

function ThumbOrSwatch({
  imageUrl,
  swatchHex,
  title,
}: {
  imageUrl?: string
  swatchHex: string
  title: string
}) {
  const [imgFailed, setImgFailed] = useState(false)
  const showImg = Boolean(imageUrl?.trim()) && !imgFailed
  if (showImg) {
    return (
      <img
        src={imageUrl!.trim()}
        alt=""
        loading="lazy"
        decoding="async"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        onError={() => setImgFailed(true)}
        title={title}
      />
    )
  }
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: swatchHex,
        minHeight: 48,
      }}
      title={title}
    />
  )
}

export default function CustomizationStyleGrid({
  options,
  value,
  onChange,
  loading,
  emptyMessage = 'No styles available for this component yet.',
  variant = 'compact',
  showClear = true,
}: {
  options: StyleGridOption[]
  value: string
  onChange: (id: string | null) => void
  loading?: boolean
  emptyMessage?: string
  /** Larger cells for sofas / big product shots */
  variant?: 'compact' | 'large'
  showClear?: boolean
}) {
  const cols = variant === 'large' ? 'repeat(auto-fill, minmax(108px, 1fr))' : 'repeat(4, minmax(0, 1fr))'
  const minThumb = variant === 'large' ? 96 : 64

  if (loading) {
    return <p className="hint-text" style={{ marginTop: '0.4rem' }}>Loading styles…</p>
  }

  if (options.length === 0) {
    return <p className="hint-text" style={{ marginTop: '0.4rem' }}>{emptyMessage}</p>
  }

  return (
    <div style={{ marginTop: '0.35rem' }}>
      {showClear && value ? (
        <button
          type="button"
          className="button button-secondary"
          style={{ marginBottom: '0.5rem', fontSize: '0.78rem', padding: '0.25rem 0.55rem' }}
          onClick={() => onChange(null)}
        >
          Clear selection
        </button>
      ) : null}
      <div
        role="listbox"
        aria-label="Style options"
        style={{
          display: 'grid',
          gridTemplateColumns: cols,
          gap: variant === 'large' ? 10 : 8,
          maxHeight: variant === 'large' ? 480 : 400,
          overflowY: 'auto',
          padding: '2px',
        }}
      >
        {options.map((opt) => {
          const selected = value === opt.id
          const swatchHex = swatchHexFromOption(opt)
          const caption = [opt.label, opt.description].filter(Boolean).join(' — ')
          return (
            <button
              key={opt.id}
              type="button"
              role="option"
              aria-selected={selected}
              className={`selection-highlight ${selected ? 'is-selected' : ''}`}
              title={caption}
              onClick={() => onChange(opt.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: 6,
                padding: 8,
                borderRadius: 10,
                border: `2px solid ${selected ? '#10b981' : '#e2e8f0'}`,
                background: selected ? 'rgba(16, 185, 129, 0.08)' : '#fff',
                cursor: 'pointer',
                textAlign: 'left',
                minWidth: 0,
              }}
            >
              <div
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  minHeight: minThumb,
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: '1px solid #e8eef3',
                  background: '#f1f5f9',
                }}
              >
                <ThumbOrSwatch imageUrl={opt.imageUrl} swatchHex={swatchHex} title={caption} />
              </div>
              <span
                style={{
                  fontSize: variant === 'large' ? '0.76rem' : '0.7rem',
                  fontWeight: 600,
                  color: '#334155',
                  lineHeight: 1.25,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical' as const,
                  overflow: 'hidden',
                }}
              >
                {opt.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
