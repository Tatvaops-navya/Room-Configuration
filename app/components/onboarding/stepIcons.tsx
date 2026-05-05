import type { ReactNode } from 'react'

const stroke = 'rgba(245, 240, 232, 0.9)'

function SvgWrap({ children }: { children: ReactNode }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      {children}
    </svg>
  )
}

export const STEP_OPTION_ICONS: readonly (readonly ReactNode[])[] = [
  // Step 1
  [
    <SvgWrap key="0">
      <path
        d="M12 3v1M8.5 5.5l.7.7M5 10h1M19 10h1M15.8 6.2l.7-.7M12 18v3M8 16l-2 2M16 16l2 2"
        stroke={stroke}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path d="M9 12h6v5H9z" stroke={stroke} strokeWidth="1.4" rx="1" />
    </SvgWrap>,
    <SvgWrap key="1">
      <path d="M4 10.5L12 4l8 6.5V20H4z" stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M9 20v-6h6v6" stroke={stroke} strokeWidth="1.4" />
    </SvgWrap>,
    <SvgWrap key="2">
      <path d="M6 18h12M8 14l-2 4M16 14l2 4" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
      <rect x="5" y="6" width="14" height="8" rx="1" stroke={stroke} strokeWidth="1.4" />
    </SvgWrap>,
    <SvgWrap key="3">
      <path d="M6 19c0-4 2.5-6 6-6s6 2 6 6" stroke={stroke} strokeWidth="1.4" />
      <path d="M9 11V8a3 3 0 016 0v3" stroke={stroke} strokeWidth="1.4" />
    </SvgWrap>,
  ],
  // Step 2
  [
    <SvgWrap key="0">
      <path d="M4 10.5L12 4l8 6.5V20H4z" stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M9 20v-6h6v6" stroke={stroke} strokeWidth="1.4" />
    </SvgWrap>,
    <SvgWrap key="1">
      <circle cx="12" cy="10" r="3" stroke={stroke} strokeWidth="1.4" />
      <path d="M8 21v-1a4 4 0 018 0v1" stroke={stroke} strokeWidth="1.4" />
      <path d="M17 6l2-2M19 6l-2-2" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
    </SvgWrap>,
    <SvgWrap key="2">
      <path d="M4 20h16M6 20V9l6-4 6 4v11" stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M10 20v-5h4v5" stroke={stroke} strokeWidth="1.4" />
    </SvgWrap>,
    <SvgWrap key="3">
      <circle cx="12" cy="12" r="8" stroke={stroke} strokeWidth="1.4" />
      <path d="M12 8v4l3 2" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
    </SvgWrap>,
  ],
  // Step 3
  [
    <SvgWrap key="0">
      <rect x="4" y="5" width="16" height="14" rx="2" stroke={stroke} strokeWidth="1.4" />
      <path d="M8 9h8M8 13h5" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
    </SvgWrap>,
    <SvgWrap key="1">
      <circle cx="12" cy="13" r="7" stroke={stroke} strokeWidth="1.4" />
      <path d="M12 9v4l3 2" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
    </SvgWrap>,
    <SvgWrap key="2">
      <circle cx="12" cy="9" r="3" stroke={stroke} strokeWidth="1.4" />
      <path d="M6 20v-1a6 6 0 0112 0v1" stroke={stroke} strokeWidth="1.4" />
    </SvgWrap>,
  ],
  // Step 4
  [
    <SvgWrap key="0">
      <path d="M9 18h6M10 14h4M12 6v2M9 10h6" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M12 3v1" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
    </SvgWrap>,
    <SvgWrap key="1">
      <rect x="4" y="5" width="16" height="15" rx="2" stroke={stroke} strokeWidth="1.4" />
      <path d="M8 3v4M16 3v4M4 11h16" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
    </SvgWrap>,
    <SvgWrap key="2">
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3-3-3 3a1 1 0 01-1.4 0L14.7 6.3z" stroke={stroke} strokeWidth="1.2" />
      <path d="M5 19l4.5-4.5M9 14l2 2" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
    </SvgWrap>,
  ],
] as const
