import React from 'react'

type YesNo = boolean | null

export type VastuStrictness = 'soft' | 'moderate' | 'strict' | null
export type VastuRoomType = 'bedroom' | 'living' | 'workspace' | 'study' | 'pooja' | null

export interface VastuPreferences {
  structuralChanges: YesNo
  rearrangeFurniture: YesNo
  newComponents: YesNo
  strictness: VastuStrictness
  roomType: VastuRoomType
  /** Free-text description of where North is in this room */
  northDirectionText: string
}

interface VastuQuestionnaireProps {
  preferences: VastuPreferences
  onChange: (prefs: VastuPreferences) => void
}

export default function VastuQuestionnaire({ preferences, onChange }: VastuQuestionnaireProps) {
  const update = (patch: Partial<VastuPreferences>) => {
    onChange({ ...preferences, ...patch })
  }

  const { structuralChanges, rearrangeFurniture, newComponents, strictness, roomType, northDirectionText } = preferences

  return (
    <div>
      <p className="hint-text" style={{ marginBottom: '1rem' }}>
        These answers control how aggressively the AI applies Vastu corrections. They do not change your
        original room structure unless you explicitly allow it.
      </p>

      {/* 1. Structural changes */}
      <div className="form-group">
        <label className="label">Do you want structural changes?</label>
        <p className="hint-text" style={{ marginBottom: '0.5rem' }}>
          Structural = walls, doors, fixed elements. For prototype these are visual suggestions only, not construction drawings.
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <label className="radio-option" style={{ marginBottom: 0, cursor: 'pointer' }}>
            <input
              type="radio"
              name="vastu-structural"
              checked={structuralChanges === true}
              onChange={() => update({ structuralChanges: true })}
            />
            <span style={{ marginLeft: '0.5rem' }}>Yes</span>
          </label>
          <label className="radio-option" style={{ marginBottom: 0, cursor: 'pointer' }}>
            <input
              type="radio"
              name="vastu-structural"
              checked={structuralChanges === false}
              onChange={() => update({ structuralChanges: false })}
            />
            <span style={{ marginLeft: '0.5rem' }}>No</span>
          </label>
        </div>
      </div>

      {/* 2. Furniture rearrangement */}
      <div className="form-group">
        <label className="label">Do you want existing furniture to be rearranged as per Vastu?</label>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <label className="radio-option" style={{ marginBottom: 0, cursor: 'pointer' }}>
            <input
              type="radio"
              name="vastu-rearrange"
              checked={rearrangeFurniture === true}
              onChange={() => update({ rearrangeFurniture: true })}
            />
            <span style={{ marginLeft: '0.5rem' }}>Yes</span>
          </label>
          <label className="radio-option" style={{ marginBottom: 0, cursor: 'pointer' }}>
            <input
              type="radio"
              name="vastu-rearrange"
              checked={rearrangeFurniture === false}
              onChange={() => update({ rearrangeFurniture: false })}
            />
            <span style={{ marginLeft: '0.5rem' }}>No</span>
          </label>
        </div>
      </div>

      {/* 3. New components */}
      <div className="form-group">
        <label className="label">Do you want to add new components based on Vastu recommendations?</label>
        <p className="hint-text" style={{ marginBottom: '0.5rem' }}>
          Example: storage in south/west, pooja unit in north-east, mirrors in north/east, partitions for balance.
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <label className="radio-option" style={{ marginBottom: 0, cursor: 'pointer' }}>
            <input
              type="radio"
              name="vastu-new-components"
              checked={newComponents === true}
              onChange={() => update({ newComponents: true })}
            />
            <span style={{ marginLeft: '0.5rem' }}>Yes</span>
          </label>
          <label className="radio-option" style={{ marginBottom: 0, cursor: 'pointer' }}>
            <input
              type="radio"
              name="vastu-new-components"
              checked={newComponents === false}
              onChange={() => update({ newComponents: false })}
            />
            <span style={{ marginLeft: '0.5rem' }}>No</span>
          </label>
        </div>
      </div>

      {/* 4. Strictness level */}
      <div className="form-group">
        <label className="label">How strictly should Vastu be followed?</label>
        <p className="hint-text" style={{ marginBottom: '0.5rem' }}>
          Softer settings prioritise practicality and aesthetics. Strict tries to follow Vastu more literally.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="button button-secondary"
            style={{
              padding: '0.5rem 0.75rem',
              background: strictness === 'soft' ? 'rgba(34, 197, 94, 0.12)' : undefined,
              borderColor: strictness === 'soft' ? '#22c55e' : undefined,
            }}
            onClick={() => update({ strictness: 'soft' })}
          >
            Soft (recommended)
          </button>
          <button
            type="button"
            className="button button-secondary"
            style={{
              padding: '0.5rem 0.75rem',
              background: strictness === 'moderate' ? 'rgba(59, 130, 246, 0.12)' : undefined,
              borderColor: strictness === 'moderate' ? '#3b82f6' : undefined,
            }}
            onClick={() => update({ strictness: 'moderate' })}
          >
            Moderate
          </button>
          <button
            type="button"
            className="button button-secondary"
            style={{
              padding: '0.5rem 0.75rem',
              background: strictness === 'strict' ? 'rgba(239, 68, 68, 0.12)' : undefined,
              borderColor: strictness === 'strict' ? '#ef4444' : undefined,
            }}
            onClick={() => update({ strictness: 'strict' })}
          >
            Strict
          </button>
        </div>
      </div>

      {/* 5. North direction */}
      <div className="form-group">
        <label className="label">Describe which side of this room is North</label>
        <p className="hint-text" style={{ marginBottom: '0.5rem' }}>
          Use a compass or building plan if possible. Describe North in your own words so the AI can align Vastu directions correctly
          (for example: "the wall with the big window on the left is North").
        </p>
        <textarea
          className="input"
          style={{ minHeight: '60px', resize: 'vertical' }}
          value={northDirectionText}
          onChange={(e) => update({ northDirectionText: e.target.value })}
          placeholder='e.g. "The full-height window wall on the left side of the photo is North."'
        />
      </div>

      {/* 6. Room usage */}
      <div className="form-group">
        <label className="label">What is the primary use of this room?</label>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {[
            { id: 'bedroom', label: 'Bedroom' },
            { id: 'living', label: 'Living room' },
            { id: 'workspace', label: 'Workspace' },
            { id: 'study', label: 'Study' },
            { id: 'pooja', label: 'Pooja room' },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              className="button button-secondary"
              style={{
                padding: '0.5rem 0.75rem',
                background: roomType === opt.id ? 'rgba(15, 118, 110, 0.12)' : undefined,
                borderColor: roomType === opt.id ? '#0f766e' : undefined,
              }}
              onClick={() => update({ roomType: opt.id as VastuRoomType })}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

