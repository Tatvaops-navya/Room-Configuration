import { ArrowLeft, User, ArrowRight } from 'lucide-react';

interface AppHeaderProps {
  onBack?: () => void;
  onNext?: () => void;
}

export function AppHeader({ onBack, onNext }: AppHeaderProps) {
  return (
    <div
      style={{
        position:             'absolute',
        top:                  0,
        left:                 0,
        right:                0,
        height:               '48px',
        zIndex:               50,
        display:              'flex',
        alignItems:           'center',
        justifyContent:       'space-between',
        padding:              '0 40px',
        background:           'rgba(255,255,255,0.03)',
        borderBottom:         '1px solid rgba(255,255,255,0.10)',
        boxShadow:            '0px 4px 18px 0px rgba(0,0,0,0.15)',
        backdropFilter:       'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* ── Left: conditional back button ── */}
      <div style={{ width: '80px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '8px',
              background:   'transparent',
              border:       'none',
              cursor:       'pointer',
              color:        'rgba(255,255,255,0.58)',
              padding:      '5px 10px',
              borderRadius: '9px',
              fontSize:     '13px',
              fontWeight:   500,
              fontFamily:   "'Inter', sans-serif",
              transition:   'all 0.18s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
              e.currentTarget.style.color      = 'rgba(255,255,255,0.90)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color      = 'rgba(255,255,255,0.58)';
            }}
          >
            <ArrowLeft size={15} strokeWidth={2} />
            Back
          </button>
        )}
        {onNext && (
          <button
            onClick={onNext}
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '8px',
              background:   'transparent',
              border:       'none',
              cursor:       'pointer',
              color:        'rgba(255,255,255,0.58)',
              padding:      '5px 10px',
              borderRadius: '9px',
              fontSize:     '13px',
              fontWeight:   500,
              fontFamily:   "'Inter', sans-serif",
              transition:   'all 0.18s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
              e.currentTarget.style.color      = 'rgba(255,255,255,0.90)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color      = 'rgba(255,255,255,0.58)';
            }}
          >
            Next
            <ArrowRight size={15} strokeWidth={2} />
          </button>
        )}
      </div>

      {/* ── Right: tatva:Ops logo + user avatar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <span
            style={{
              fontFamily:    "'Inter', sans-serif",
              fontWeight:    700,
              fontSize:      '15px',
              color:         '#ec4899',
              letterSpacing: '-0.45px',
            }}
          >
            tatva
          </span>
          <span
            style={{
              fontFamily:    "'Inter', sans-serif",
              fontWeight:    700,
              fontSize:      '15px',
              color:         'rgba(255,255,255,0.82)',
              letterSpacing: '-0.45px',
            }}
          >
            :Ops
          </span>
        </div>

        <div
          style={{
            width:          '30px',
            height:         '30px',
            borderRadius:   '50%',
            background:     'linear-gradient(135deg, #374151 0%, #1F2937 100%)',
            border:         '1.5px solid rgba(255,255,255,0.13)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            flexShrink:     0,
          }}
        >
          <User size={14} style={{ color: 'rgba(255,255,255,0.62)' }} />
        </div>
      </div>
    </div>
  );
}