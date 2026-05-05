import type { ReactNode } from 'react'

type Props = {
  label: string
  selected: boolean
  onSelect: () => void
  icon: ReactNode
  disabled?: boolean
}

export function OnboardingOptionCard({ label, selected, onSelect, icon, disabled }: Props) {
  return (
    <button
      type="button"
      className={`ob-opt ${selected ? 'ob-opt--selected' : ''}`}
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
    >
      <span className="ob-opt-icon" aria-hidden>
        {icon}
      </span>
      <span className="ob-opt-label">{label}</span>
      {selected && (
        <span className="ob-opt-check" aria-hidden>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="11" fill="rgba(232, 135, 58, 0.25)" stroke="#e8873a" strokeWidth="1.5" />
            <path
              d="M7.5 12.5l3 3 6-6"
              stroke="#f5f0e8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
      <style jsx>{`
        .ob-opt {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 16px 16px 18px;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(37, 32, 24, 0.55);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          color: rgba(245, 240, 232, 0.96);
          cursor: pointer;
          text-align: left;
          transition:
            border-color 160ms ease,
            box-shadow 160ms ease,
            background 160ms ease,
            transform 140ms ease;
        }
        .ob-opt:hover:not(:disabled) {
          background: rgba(55, 48, 38, 0.65);
          border-color: rgba(255, 255, 255, 0.12);
        }
        .ob-opt:active:not(:disabled) {
          transform: scale(0.99);
        }
        .ob-opt:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .ob-opt--selected {
          border-color: rgba(232, 135, 58, 0.85);
          box-shadow:
            0 0 0 1px rgba(232, 135, 58, 0.25),
            0 12px 36px rgba(0, 0, 0, 0.35);
          background: linear-gradient(135deg, rgba(80, 52, 28, 0.55) 0%, rgba(37, 32, 24, 0.72) 100%);
        }
        .ob-opt-icon {
          flex-shrink: 0;
          width: 28px;
          height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          opacity: 0.92;
        }
        .ob-opt-label {
          flex: 1;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: -0.01em;
          line-height: 1.35;
        }
        .ob-opt-check {
          flex-shrink: 0;
        }
      `}</style>
    </button>
  )
}
