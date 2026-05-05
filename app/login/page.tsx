'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

export default function LoginPage() {
  const router = useRouter()
  const [countryCode] = useState('+91')
  const [countryName] = useState('India')
  const [phoneRaw, setPhoneRaw] = useState('')
  const [touched, setTouched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const phoneInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    phoneInputRef.current?.focus()
  }, [])

  useEffect(() => {
    try {
      const tok = window.localStorage.getItem('spacia.token')?.trim()
      const otpOk = window.localStorage.getItem('spacia.otpVerified') === '1'
      if (tok || otpOk) router.replace('/auth/continue')
    } catch {
      /* ignore */
    }
  }, [router])

  const digits = useMemo(() => phoneRaw.replace(/\D/g, ''), [phoneRaw])
  const formatted = useMemo(() => {
    const d = digits.slice(0, 10)
    if (d.length <= 5) return d
    return `${d.slice(0, 5)} ${d.slice(5)}`
  }, [digits])

  const isValid = digits.length === 10
  const inlineError =
    touched && digits.length > 0 && !isValid ? 'Phone number must be exactly 10 digits.' : null

  const bgStyle = useMemo(
    () => ({
      backgroundImage:
        'linear-gradient(180deg, rgba(26,21,16,0.55) 0%, rgba(26,21,16,0.95) 55%, rgba(26,21,16,1) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuA1UU98rYsK8SyyDDfJg5bGJSm__C4a8UjHygOr3lkn8Lc2vL2j0K0Op3cUyuiEZv7i2XJGpBLpKAGTsfLZYbm8lDsZCg9KDBQEFxWbEPH2bta1el6BlsSP70JzjKJvQszHRPtdGIOJyK78DuRZI4_kdEc1TdH12YWQhXlbkpn5ilHBkzyPEuxjLwNS5PVhP0MSwgfIpYV-QFr-UQKs_mmkx5ZOidkW4N-FpnQy1r2nsKnZ7Y-AbhSZ4bFA_lI7Cqtb2D6stNUsm_kE")',
    }),
    []
  )

  const handleSendOtp = async () => {
    if (loading) return
    setTouched(true)
    setSubmitError(null)
    if (!isValid) return
    setLoading(true)
    try {
      const phone = `${countryCode}${digits}`
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean }
      if (!res.ok || data.ok !== true) {
        throw new Error(data.error || 'Failed to send OTP. Please try again.')
      }
      router.push(`/verify?phone=${encodeURIComponent(phone)}`)
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Failed to send OTP.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="spacia-login-root">
      <div className="spacia-login-bg" style={bgStyle} aria-hidden="true" />
      <div className="spacia-login-glow" aria-hidden="true" />

      <main className="spacia-login-shell" aria-label="Vision login">
        <header className="spacia-login-top">
          <button
            type="button"
            className="spacia-close"
            aria-label="Close"
            onClick={() => router.push('/')}
          >
            <span className="spacia-x" aria-hidden="true" />
          </button>
        </header>

        <section className="spacia-login-brand" aria-label="Vision logo">
          <div className="spacia-login-mark" aria-hidden="true" />
          <div className="spacia-login-name">Vision</div>
          <div className="spacia-login-underline" aria-hidden="true" />
        </section>

        <section className="spacia-login-title" aria-label="Welcome">
          <div className="spacia-h2">Welcome Back</div>
          <div className="spacia-sub">Your space awaits.</div>
        </section>

        <section className="spacia-card" aria-label="Phone login form">
          <div className="spacia-field">
            <label className="spacia-label" htmlFor="region">
              REGION
            </label>
            <button
              id="region"
              type="button"
              className="spacia-select"
              onClick={() => {
                // mocked selector for now
                alert('Country selector coming soon.')
              }}
            >
              <div className="spacia-select-left">
                <span className="spacia-flag" aria-hidden="true">
                  🇮🇳
                </span>
                <span className="spacia-cc">{countryCode}</span>
                <span className="spacia-sep" aria-hidden="true" />
                <span className="spacia-country">{countryName}</span>
              </div>
              <span className="spacia-caret" aria-hidden="true" />
            </button>
          </div>

          <div className="spacia-field">
            <label className="spacia-label" htmlFor="phone">
              PHONE NUMBER
            </label>

            <div
              className={[
                'spacia-inputWrap',
                touched && !isValid && digits.length > 0 ? 'spacia-inputWrap--error' : '',
              ].join(' ')}
            >
              <div className="spacia-phoneIcon" aria-hidden="true" />
              <div className="spacia-prefix" aria-hidden="true">
                <span className="spacia-prefixText">{countryCode}</span>
                <span className="spacia-sepSmall" />
              </div>
              <input
                ref={phoneInputRef}
                id="phone"
                inputMode="numeric"
                autoComplete="tel"
                type="tel"
                className="spacia-input"
                placeholder="00000 00000"
                value={formatted}
                onChange={(e) => {
                  setTouched(true)
                  setPhoneRaw(e.target.value)
                }}
                onBlur={() => setTouched(true)}
                aria-invalid={Boolean(inlineError)}
                aria-describedby="phoneHelp"
              />
              {formatted.length > 0 && (
                <button
                  type="button"
                  className="spacia-clear"
                  aria-label="Clear input"
                  onClick={() => setPhoneRaw('')}
                >
                  <span className="spacia-clearX" aria-hidden="true" />
                </button>
              )}
            </div>

            <div id="phoneHelp" className="spacia-help">
              We&apos;ll send a 6-digit OTP to verify your number
            </div>
            {inlineError && <div className="spacia-error">{inlineError}</div>}
            {submitError && <div className="spacia-error">{submitError}</div>}
          </div>

          <button
            type="button"
            className="spacia-cta"
            disabled={!isValid || loading}
            onClick={handleSendOtp}
          >
            {loading ? 'Sending…' : 'Send OTP'}
            <span className="spacia-ctaArrow" aria-hidden="true" />
          </button>
        </section>

        <section className="spacia-divider" aria-label="Alternative login">
          <div className="spacia-line" />
          <div className="spacia-dividerText">OR CONTINUE WITH</div>
          <div className="spacia-line" />
        </section>

        <section className="spacia-social" aria-label="Social login buttons">
          <button type="button" className="spacia-socialBtn" aria-label="Continue with Google">
            <span className="spacia-google" aria-hidden="true" />
          </button>
          <button type="button" className="spacia-socialBtn" aria-label="Continue with Apple">
            <span className="spacia-apple" aria-hidden="true" />
          </button>
        </section>

        <footer className="spacia-footer">
          By continuing, you agree to Vision&apos;s{' '}
          <a className="spacia-link" href="#" onClick={(e) => e.preventDefault()}>
            Terms
          </a>{' '}
          and{' '}
          <a className="spacia-link" href="#" onClick={(e) => e.preventDefault()}>
            Privacy Policy
          </a>
          .
        </footer>
      </main>

      <style jsx>{`
        .spacia-login-root {
          position: relative;
          min-height: 100dvh;
          width: 100vw;
          overflow: hidden;
          background: #1a1510;
          color: rgba(245, 240, 232, 0.98);
        }

        .spacia-login-bg {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          filter: blur(22px) saturate(1.05);
          transform: scale(1.12);
          opacity: 0.7;
          mix-blend-mode: luminosity;
        }

        .spacia-login-glow {
          position: absolute;
          top: -90px;
          left: 50%;
          transform: translateX(-50%);
          width: 620px;
          height: 420px;
          background: rgba(245, 158, 11, 0.18);
          border-radius: 999px;
          filter: blur(90px);
          mix-blend-mode: screen;
          pointer-events: none;
        }

        .spacia-login-shell {
          position: relative;
          z-index: 1;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          padding: max(env(safe-area-inset-top), 20px) 18px max(env(safe-area-inset-bottom), 18px);
          max-width: 460px;
          margin: 0 auto;
          animation: fadeIn 520ms ease-out both;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .spacia-login-top {
          display: flex;
          justify-content: flex-start;
          margin-bottom: 18px;
        }

        .spacia-close {
          width: 42px;
          height: 42px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 160ms ease;
        }
        .spacia-close:hover {
          background: rgba(255, 255, 255, 0.12);
        }
        .spacia-close:focus-visible {
          outline: 2px solid rgba(245, 158, 11, 0.8);
          outline-offset: 2px;
        }
        .spacia-x {
          width: 14px;
          height: 14px;
          position: relative;
        }
        .spacia-x::before,
        .spacia-x::after {
          content: '';
          position: absolute;
          left: 50%;
          top: 50%;
          width: 16px;
          height: 2px;
          background: rgba(245, 240, 232, 0.92);
          border-radius: 999px;
          transform-origin: center;
        }
        .spacia-x::before {
          transform: translate(-50%, -50%) rotate(45deg);
        }
        .spacia-x::after {
          transform: translate(-50%, -50%) rotate(-45deg);
        }

        .spacia-login-brand {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 24px;
        }
        .spacia-login-mark {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.22);
          box-shadow: 0 0 22px rgba(245, 158, 11, 0.14);
          position: relative;
        }
        .spacia-login-mark::after {
          content: '';
          position: absolute;
          inset: 14px;
          border-radius: 8px;
          background: radial-gradient(circle at 30% 30%, rgba(245, 158, 11, 1), rgba(232, 135, 58, 1));
        }
        .spacia-login-name {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.2px;
          color: rgba(245, 240, 232, 0.94);
        }
        .spacia-login-underline {
          width: 28px;
          height: 2px;
          background: rgba(245, 158, 11, 0.95);
          border-radius: 999px;
          box-shadow: 0 0 10px rgba(245, 158, 11, 0.45);
        }

        .spacia-login-title {
          text-align: center;
          margin-bottom: 22px;
        }
        .spacia-h2 {
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: rgba(245, 240, 232, 0.98);
        }
        .spacia-sub {
          margin-top: 6px;
          font-size: 16px;
          color: rgba(196, 199, 200, 0.7);
        }

        .spacia-card {
          background: rgba(37, 32, 24, 0.78);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 20px;
          padding: 20px;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
        }

        .spacia-field + .spacia-field {
          margin-top: 16px;
        }
        .spacia-label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.14em;
          color: rgba(196, 199, 200, 0.72);
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .spacia-select {
          width: 100%;
          height: 56px;
          border-radius: 14px;
          background: rgba(30, 24, 18, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.07);
          color: rgba(245, 240, 232, 0.95);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 14px;
          cursor: pointer;
          transition: background 160ms ease, border-color 160ms ease;
        }
        .spacia-select:hover {
          background: rgba(255, 255, 255, 0.03);
        }
        .spacia-select:focus-visible {
          outline: 2px solid rgba(245, 158, 11, 0.8);
          outline-offset: 2px;
        }
        .spacia-select-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .spacia-flag {
          font-size: 18px;
        }
        .spacia-cc,
        .spacia-country {
          font-size: 16px;
          font-weight: 600;
          white-space: nowrap;
        }
        .spacia-sep {
          width: 1px;
          height: 16px;
          background: rgba(255, 255, 255, 0.12);
        }
        .spacia-caret {
          width: 10px;
          height: 10px;
          border-right: 2px solid rgba(196, 199, 200, 0.75);
          border-bottom: 2px solid rgba(196, 199, 200, 0.75);
          transform: rotate(45deg);
          margin-right: 2px;
        }

        .spacia-inputWrap {
          display: flex;
          align-items: center;
          background: rgba(30, 24, 18, 0.85);
          border: 1px solid rgba(245, 158, 11, 0.45);
          border-radius: 14px;
          overflow: hidden;
          transition: box-shadow 160ms ease, border-color 160ms ease;
        }
        .spacia-inputWrap:focus-within {
          border-color: rgba(245, 158, 11, 0.9);
          box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.55);
        }
        .spacia-inputWrap--error {
          border-color: rgba(248, 113, 113, 0.8);
        }

        .spacia-phoneIcon {
          width: 18px;
          height: 18px;
          margin-left: 14px;
          margin-right: 10px;
          position: relative;
          opacity: 0.95;
        }
        .spacia-phoneIcon::before {
          content: '';
          position: absolute;
          inset: 0;
          border: 2px solid rgba(245, 158, 11, 0.95);
          border-radius: 4px;
        }
        .spacia-phoneIcon::after {
          content: '';
          position: absolute;
          left: 50%;
          bottom: -2px;
          width: 8px;
          height: 2px;
          background: rgba(245, 158, 11, 0.95);
          border-radius: 999px;
          transform: translateX(-50%);
        }

        .spacia-prefix {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 16px 0;
          color: rgba(196, 199, 200, 0.8);
          user-select: none;
        }
        .spacia-prefixText {
          font-size: 18px;
          margin-left: 2px;
        }
        .spacia-sepSmall {
          width: 1px;
          height: 16px;
          background: rgba(255, 255, 255, 0.12);
        }

        .spacia-input {
          flex: 1;
          background: transparent;
          border: 0;
          outline: none;
          padding: 16px 10px 16px 10px;
          color: rgba(245, 240, 232, 0.98);
          font-size: 18px;
          letter-spacing: 0.06em;
          min-width: 0;
        }
        .spacia-input::placeholder {
          color: rgba(196, 199, 200, 0.35);
          letter-spacing: 0.02em;
        }

        .spacia-clear {
          border: 0;
          background: transparent;
          cursor: pointer;
          padding: 0 14px 0 6px;
          opacity: 0.8;
          transition: opacity 160ms ease;
        }
        .spacia-clear:hover {
          opacity: 0.65;
        }
        .spacia-clearX {
          width: 18px;
          height: 18px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.1);
          position: relative;
          display: inline-block;
        }
        .spacia-clearX::before,
        .spacia-clearX::after {
          content: '';
          position: absolute;
          left: 50%;
          top: 50%;
          width: 10px;
          height: 2px;
          background: rgba(196, 199, 200, 0.8);
          border-radius: 999px;
          transform-origin: center;
        }
        .spacia-clearX::before {
          transform: translate(-50%, -50%) rotate(45deg);
        }
        .spacia-clearX::after {
          transform: translate(-50%, -50%) rotate(-45deg);
        }

        .spacia-help {
          margin-top: 10px;
          font-size: 12px;
          color: rgba(196, 199, 200, 0.6);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .spacia-error {
          margin-top: 10px;
          font-size: 12px;
          color: rgba(248, 113, 113, 0.92);
          font-weight: 600;
        }

        .spacia-cta {
          width: 100%;
          margin-top: 14px;
          height: 56px;
          border-radius: 14px;
          border: 0;
          cursor: pointer;
          font-size: 18px;
          font-weight: 800;
          color: rgba(14, 14, 14, 0.95);
          background: linear-gradient(90deg, rgba(217, 119, 6, 1) 0%, rgba(245, 158, 11, 1) 100%);
          box-shadow: 0 8px 22px rgba(245, 158, 11, 0.18);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: transform 140ms ease, filter 140ms ease, opacity 140ms ease;
        }
        .spacia-cta:hover:not(:disabled) {
          filter: brightness(1.03);
        }
        .spacia-cta:active:not(:disabled) {
          transform: scale(0.98);
        }
        .spacia-cta:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .spacia-ctaArrow {
          width: 10px;
          height: 10px;
          border-right: 3px solid rgba(14, 14, 14, 0.9);
          border-top: 3px solid rgba(14, 14, 14, 0.9);
          transform: rotate(45deg);
          margin-left: 2px;
        }

        .spacia-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 18px;
          padding: 0 10px;
        }
        .spacia-line {
          height: 1px;
          flex: 1;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1));
        }
        .spacia-line:last-child {
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.1), transparent);
        }
        .spacia-dividerText {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(196, 199, 200, 0.55);
          white-space: nowrap;
        }

        .spacia-social {
          display: flex;
          gap: 12px;
          margin-top: 14px;
        }
        .spacia-socialBtn {
          flex: 1;
          height: 52px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          background: rgba(37, 32, 24, 0.78);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.25);
          transition: background 160ms ease;
        }
        .spacia-socialBtn:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .spacia-google {
          width: 18px;
          height: 18px;
          border-radius: 4px;
          background: conic-gradient(from 0deg, #ea4335, #fbbc05, #34a853, #4285f4, #ea4335);
        }
        .spacia-apple {
          width: 18px;
          height: 18px;
          border-radius: 4px;
          background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.95), rgba(200, 200, 200, 0.55));
        }

        .spacia-footer {
          margin-top: 18px;
          text-align: center;
          font-size: 12px;
          line-height: 1.6;
          color: rgba(196, 199, 200, 0.6);
          padding: 0 10px;
        }
        .spacia-link {
          color: rgba(245, 158, 11, 0.92);
          text-decoration: underline;
          text-decoration-color: rgba(245, 158, 11, 0.28);
          text-underline-offset: 4px;
          transition: color 160ms ease;
        }
        .spacia-link:hover {
          color: rgba(251, 191, 36, 0.95);
        }

        @media (min-width: 900px) {
          .spacia-login-shell {
            padding-left: 22px;
            padding-right: 22px;
          }
        }
      `}</style>
    </div>
  )
}

