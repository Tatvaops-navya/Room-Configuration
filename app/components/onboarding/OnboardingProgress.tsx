type Props = {
  current: 1 | 2 | 3 | 4
  total?: 4
}

export function OnboardingProgress({ current, total = 4 }: Props) {
  return (
    <div className="ob-progress" aria-label={`Step ${current} of ${total}`}>
      <div className="ob-progress-bar" role="presentation">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`ob-progress-seg ${i < current ? 'ob-progress-seg--on' : ''}`} />
        ))}
      </div>
      <span className="ob-progress-label">
        {current}/{total}
      </span>
      <style jsx>{`
        .ob-progress {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
        }
        .ob-progress-bar {
          flex: 1;
          display: flex;
          gap: 6px;
        }
        .ob-progress-seg {
          flex: 1;
          height: 4px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.1);
          transition: background 220ms ease;
        }
        .ob-progress-seg--on {
          background: linear-gradient(90deg, #c45e18 0%, #e8873a 55%, #f59e0b 100%);
          box-shadow: 0 0 12px rgba(232, 135, 58, 0.35);
        }
        .ob-progress-label {
          font-size: 12px;
          font-weight: 700;
          color: rgba(138, 128, 112, 0.95);
          min-width: 32px;
          text-align: right;
        }
      `}</style>
    </div>
  )
}
