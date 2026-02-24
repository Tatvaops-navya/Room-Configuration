'use client'

import { useState, useEffect } from 'react'

/**
 * ConfigurationSelector Component
 * Handles selection between Full Room and Component-based configuration.
 * Component-based flow: AI-detected components → Keep/Remove → Add new? → Arrangement preferences → Vastu.
 */

export interface DetectedComponent {
  id: string
  label: string
}

interface ArrangementConfig {
  existingComponentsNote: string
  removedComponentsNote?: string
  newComponentsNote: string
  arrangementPreferencesText: string
}

interface ConfigurationSelectorProps {
  configMode: 'purpose' | 'arrangement'
  onConfigModeChange: (mode: 'purpose' | 'arrangement') => void
  arrangementConfig: ArrangementConfig
  onArrangementChange: (field: string, value: unknown) => void
  /** 'internal' = room; 'external' = facade/compound. Changes labels (Full room vs Full external, etc.) */
  variant?: 'internal' | 'external'
  // Component-based: AI-detected components and user choices
  detectedComponents?: DetectedComponent[]
  componentDecisions?: Record<string, 'keep' | 'remove'>
  onComponentDecisionChange?: (id: string, decision: 'keep' | 'remove') => void
  addNewComponents?: boolean | null
  onAddNewComponentsChange?: (value: boolean) => void
  isAnalyzing?: boolean
  /** Full structured analysis report (sections A–D) from room analysis */
  analysisFullReport?: string | null
  /** Rendered directly below "Do you want to add new components?" when user selects Yes */
  newComponentsRefSection?: React.ReactNode
}

export default function ConfigurationSelector({
  configMode,
  onConfigModeChange,
  arrangementConfig,
  onArrangementChange,
  variant = 'internal',
  detectedComponents = [],
  componentDecisions = {},
  onComponentDecisionChange,
  addNewComponents = null,
  onAddNewComponentsChange,
  isAnalyzing = false,
  analysisFullReport = null,
  newComponentsRefSection,
}: ConfigurationSelectorProps) {
  const [showFullReport, setShowFullReport] = useState(false)
  const isExternal = variant === 'external'
  const fullLabel = isExternal ? 'Full external configuration' : 'Full Room Configuration'
  const componentLabel = isExternal ? 'Component-based external configuration' : 'Component-based Configuration'
  const componentBasedConfigEnabled = false // Set to true to re-enable component-based configuration
  useEffect(() => {
    if (!componentBasedConfigEnabled && configMode === 'arrangement') {
      onConfigModeChange('purpose')
    }
  }, [componentBasedConfigEnabled, configMode, onConfigModeChange])
  return (
    <div>
      {/* Configuration Mode Selection */}
      <div className="radio-group">
        <h3>Select Configuration Mode:</h3>
        <div className="radio-option">
          <input
            type="radio"
            id="mode-purpose"
            name="configMode"
            checked={configMode === 'purpose'}
            onChange={() => onConfigModeChange('purpose')}
          />
          <label htmlFor="mode-purpose">{fullLabel}</label>
        </div>
        {componentBasedConfigEnabled && (
          <div className="radio-option">
            <input
              type="radio"
              id="mode-arrangement"
              name="configMode"
              checked={configMode === 'arrangement'}
              onChange={() => onConfigModeChange('arrangement')}
            />
            <label htmlFor="mode-arrangement">{componentLabel}</label>
          </div>
        )}
      </div>

      {/* Component-based flow: Step 2–4 – Detected components → Keep/Remove (hidden when component-based is off) */}
      {componentBasedConfigEnabled && configMode === 'arrangement' && (
        <div style={{ marginTop: '1.5rem' }}>
          <h3>Component Configuration</h3>

          {isAnalyzing && (
            <div className="loading-card" style={{ padding: '1.5rem' }}>
              <span className="spinner" aria-hidden />
              <p>Analyzing room images…</p>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', color: '#64748b' }}>
                Detecting furniture and components.
              </p>
            </div>
          )}

          {!isAnalyzing && analysisFullReport && (
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <button
                type="button"
                onClick={() => setShowFullReport((v) => !v)}
                style={{
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.9rem',
                  background: 'var(--color-surface, #f8fafc)',
                  border: '1px solid var(--color-border, #e2e8f0)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                {showFullReport ? '▼ Hide detailed room analysis' : '▶ View detailed room analysis'}
              </button>
              {showFullReport && (
                <div
                  style={{
                    marginTop: '0.75rem',
                    padding: '1rem',
                    background: 'var(--color-surface, #f8fafc)',
                    border: '1px solid var(--color-border, #e2e8f0)',
                    borderRadius: '6px',
                    maxHeight: '320px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                    fontSize: '0.875rem',
                    lineHeight: 1.5,
                    color: 'var(--color-text-secondary, #475569)',
                  }}
                >
                  {analysisFullReport}
                </div>
              )}
            </div>
          )}

          {!isAnalyzing && detectedComponents.length > 0 && onComponentDecisionChange && (
            <div className="form-group">
              <label className="label">Select which components to keep or remove</label>
              <p className="hint-text" style={{ marginBottom: '0.75rem' }}>
                Keep = remain in the room (rearranged). Remove = excluded from the final configuration.
              </p>
              <div className="component-keep-remove-table">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontWeight: 600 }}>Component</th>
                      <th style={{ textAlign: 'center', padding: '0.5rem 0.75rem', fontWeight: 600 }}>Keep</th>
                      <th style={{ textAlign: 'center', padding: '0.5rem 0.75rem', fontWeight: 600 }}>Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detectedComponents.map((comp) => (
                      <tr key={comp.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{comp.label}</td>
                        <td style={{ textAlign: 'center', padding: '0.5rem 0.75rem' }}>
                          <input
                            type="radio"
                            name={`decision-${comp.id}`}
                            id={`keep-${comp.id}`}
                            checked={componentDecisions[comp.id] !== 'remove'}
                            onChange={() => onComponentDecisionChange(comp.id, 'keep')}
                          />
                          <label htmlFor={`keep-${comp.id}`} style={{ marginLeft: '0.35rem' }}>✔</label>
                        </td>
                        <td style={{ textAlign: 'center', padding: '0.5rem 0.75rem' }}>
                          <input
                            type="radio"
                            name={`decision-${comp.id}`}
                            id={`remove-${comp.id}`}
                            checked={componentDecisions[comp.id] === 'remove'}
                            onChange={() => onComponentDecisionChange(comp.id, 'remove')}
                          />
                          <label htmlFor={`remove-${comp.id}`} style={{ marginLeft: '0.35rem' }}>✕</label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Step 5 – Add new components? Yes / No */}
          {!isAnalyzing && onAddNewComponentsChange && (
            <div className="form-group" style={{ marginTop: '1.25rem' }}>
              <label className="label">Do you want to add new components to this room?</label>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                <label className="radio-option" style={{ marginBottom: 0, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="addNewComponents"
                    checked={addNewComponents === true}
                    onChange={() => onAddNewComponentsChange(true)}
                  />
                  <span style={{ marginLeft: '0.5rem' }}>Yes</span>
                </label>
                <label className="radio-option" style={{ marginBottom: 0, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="addNewComponents"
                    checked={addNewComponents === false}
                    onChange={() => onAddNewComponentsChange(false)}
                  />
                  <span style={{ marginLeft: '0.5rem' }}>No</span>
                </label>
              </div>
              {addNewComponents === true && newComponentsRefSection && (
                <div style={{ marginTop: '1rem' }}>{newComponentsRefSection}</div>
              )}
            </div>
          )}

          {/* Arrangement preferences – free-form text */}
          {!isAnalyzing && (
            <div className="form-group">
              <label htmlFor="arrangement-preferences" className="label">Arrangement preferences (optional)</label>
              <textarea
                id="arrangement-preferences"
                className="input"
                style={{ minHeight: '80px', resize: 'vertical' }}
                value={arrangementConfig.arrangementPreferencesText}
                onChange={(e) => onArrangementChange('arrangementPreferencesText', e.target.value)}
                placeholder="e.g. Desk by the window, sofa in the corner, plants near the door, open space in the center..."
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
