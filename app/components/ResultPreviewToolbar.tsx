'use client'

import type { ReactNode } from 'react'

export type ResultPreviewToolbarProps = {
  styleReviewGateActive: boolean
  showStyleReviewPanel: boolean
  onFinalizeStyle?: () => void
  onToggleAdjustStyle?: () => void
  onRegenerate: () => void
  regenerateDisabled: boolean
  regeneratePending: boolean
  onShare: () => void
  shareDisabled: boolean
  onDownload: () => void
  downloadDisabled: boolean
  onToggleLike: () => void
  likeDisabled: boolean
  liked: boolean
  onHistory: () => void
  historyDisabled: boolean
  /** Highlights History when the generation history card is visible. */
  historyPanelOpen: boolean
  onStyle: () => void
  styleDisabled: boolean
  showStyleButton: boolean
  /** Optional: human-readable style & palette labels, shown on the right side. */
  styleLabel?: string
  paletteLabel?: string
}

function ToolbarAction({
  icon,
  label,
  onClick,
  disabled,
  active,
}: {
  icon: ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  active?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`button button-secondary result-preview-toolbar__action${active ? ' result-preview-toolbar__action--active' : ''}`}
    >
      <span className="result-preview-toolbar__icon" aria-hidden>
        {icon}
      </span>
      {label}
    </button>
  )
}

/**
 * Action bar above the before/after preview — same palette as the rest of the app (surface, teal, stone borders).
 */
export default function ResultPreviewToolbar({
  styleReviewGateActive,
  showStyleReviewPanel,
  onFinalizeStyle,
  onToggleAdjustStyle,
  onRegenerate,
  regenerateDisabled,
  regeneratePending,
  onShare,
  shareDisabled,
  onDownload,
  downloadDisabled,
  onToggleLike,
  likeDisabled,
  liked,
  onHistory,
  historyDisabled,
  historyPanelOpen,
  onStyle,
  styleDisabled,
  showStyleButton,
  styleLabel,
  paletteLabel,
}: ResultPreviewToolbarProps) {
  const styleTabActive = showStyleReviewPanel && styleReviewGateActive

  return (
    <div role="toolbar" aria-label="Result actions" className="result-preview-toolbar">
      <div className="result-preview-toolbar__row">
        {styleReviewGateActive && (
          <>
            <button
              type="button"
              className="button button-primary result-preview-toolbar__primary-compact"
              onClick={onFinalizeStyle}
            >
              Finalize &amp; continue
            </button>
            <button
              type="button"
              className="button button-secondary result-preview-toolbar__primary-compact"
              onClick={onToggleAdjustStyle}
            >
              {showStyleReviewPanel ? 'Hide adjust' : 'Adjust style'}
            </button>
            <span className="result-preview-toolbar__divider" aria-hidden />
          </>
        )}

        <ToolbarAction
          icon={<span style={{ display: 'inline-block', fontSize: '1.05rem' }}>⟳</span>}
          label="Regenerate"
          onClick={onRegenerate}
          disabled={regenerateDisabled || regeneratePending}
        />
        <ToolbarAction icon="↗" label="Share" onClick={onShare} disabled={shareDisabled} />
        <ToolbarAction
          icon={liked ? '♥' : '♡'}
          label="Like"
          onClick={onToggleLike}
          disabled={likeDisabled}
          active={liked}
        />
        <ToolbarAction icon="⬇" label="Download" onClick={onDownload} disabled={downloadDisabled} />
      </div>

      <div className="result-preview-toolbar__row result-preview-toolbar__row--secondary">
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <ToolbarAction
            icon="☰"
            label="History"
            onClick={onHistory}
            disabled={historyDisabled}
            active={historyPanelOpen}
          />
          {showStyleButton && (
            <ToolbarAction
              icon="◆"
              label="Style"
              onClick={onStyle}
              disabled={styleDisabled}
              active={styleTabActive}
            />
          )}
        </div>
        {(styleLabel || paletteLabel) && (
          <div
            style={{
              display: 'flex',
              gap: '0.4rem',
              alignItems: 'center',
              marginLeft: 'auto',
              flexWrap: 'wrap',
            }}
          >
            {styleLabel && (
              <span
                className="status-pill"
                style={{
                  fontSize: '0.78rem',
                  padding: '0.18rem 0.55rem',
                  borderRadius: 999,
                  background: 'rgba(15,23,42,0.78)',
                  color: '#e5e7eb',
                  border: '1px solid rgba(148,163,184,0.6)',
                }}
              >
                Style: {styleLabel}
              </span>
            )}
            {paletteLabel && (
              <span
                className="status-pill"
                style={{
                  fontSize: '0.78rem',
                  padding: '0.18rem 0.55rem',
                  borderRadius: 999,
                  background: 'rgba(15,23,42,0.78)',
                  color: '#e5e7eb',
                  border: '1px solid rgba(148,163,184,0.6)',
                }}
              >
                Palette: {paletteLabel}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
