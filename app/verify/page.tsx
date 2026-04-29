'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'

function VerifyInner() {
  const params = useSearchParams()
  const router = useRouter()

  const phone = useMemo(() => params.get('phone') ?? '', [params])

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', ''])
  const [activeIdx, setActiveIdx] = useState(0)
  const [timer, setTimer] = useState(30)
  const [resendLoading, setResendLoading] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refs = useRef<Array<HTMLInputElement | null>>([])

  const otpString = otp.join('')
  const isComplete = otp.every((d) => /^\d$/.test(d))

  useEffect(() => {
    // Start countdown
    setTimer(30)
    const id = window.setInterval(() => {
      setTimer((t) => (t > 0 ? t - 1 : 0))
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    // focus first box on mount
    refs.current[0]?.focus()
  }, [])

  useEffect(() => {
    try {
      const tok = window.localStorage.getItem('spacia.token')?.trim()
      const otpOk = window.localStorage.getItem('spacia.otpVerified') === '1'
      if (tok || otpOk) router.replace('/home')
    } catch {
      /* ignore */
    }
  }, [router])

  const focusIdx = (idx: number) => {
    const next = Math.max(0, Math.min(5, idx))
    setActiveIdx(next)
    refs.current[next]?.focus()
    refs.current[next]?.select?.()
  }

  const applyDigits = (digits: string, startIndex = 0) => {
    const clean = digits.replace(/\D/g, '').slice(0, 6)
    if (!clean) return
    setOtp((prev) => {
      const next = [...prev]
      let i = startIndex
      for (const ch of clean) {
        if (i > 5) break
        next[i] = ch
        i += 1
      }
      return next
    })
    const nextFocus = Math.min(5, startIndex + clean.length)
    focusIdx(nextFocus)
  }

  const handleResend = async () => {
    if (!phone || resendLoading || timer > 0) return
    setResendLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (!res.ok || data.ok !== true) throw new Error(data.error || 'Failed to resend OTP.')
      setTimer(30)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to resend OTP.')
    } finally {
      setResendLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!phone || verifyLoading || !isComplete) return
    setVerifyLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: otpString }),
      })
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown> & {
        ok?: boolean
        error?: string
      }
      if (!res.ok || data.ok !== true)
        throw new Error(
          typeof data.error === 'string' ? data.error : 'Invalid OTP. Please try again.',
        )
      if (typeof window !== 'undefined') {
        let token = '';
        const tTop = data.token;
        if (typeof tTop === 'string' && tTop.trim()) token = tTop.trim();
        else if (data.data !== null && typeof data.data === 'object') {
          const d = data.data as Record<string, unknown>;
          if (typeof d.token === 'string' && d.token.trim()) token = d.token.trim();
          else if (typeof d.accessToken === 'string') token = String(d.accessToken).trim();
          else if (typeof d.jwt === 'string') token = String(d.jwt).trim();
        }
        if (token) window.localStorage.setItem('spacia.token', token);
        else window.localStorage.setItem('spacia.otpVerified', '1');
      }
      router.push('/home')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid OTP. Please try again.')
      setOtp(['', '', '', '', '', ''])
      focusIdx(0)
    } finally {
      setVerifyLoading(false)
    }
  }

  return (
    <div className="spacia-verify-root" aria-label="Vision OTP verification">
      <div
        className="spacia-verify-bg"
        aria-hidden="true"
        style={{
          backgroundImage:
            'linear-gradient(180deg, rgba(26,21,16,0.55) 0%, rgba(26,21,16,0.95) 60%, #1A1510 78%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuA23YRBDcLoz_fSV-y03CgWk4JgBalAtUGz6obRdPoZHox2ZrhB1DQyXfCQ9ku1wtdXSIeweC0Yqemv2mzzPbxGX_fQTUj-HXylG39k0o99LgD1kJZdKvFk1-0YyUiInNfvQJiUXjZin1Ynn9PaOqpUQWCPiCCX9bCuc1YWOkCrwyv-pY5kMi__Y80_HXamUxjSoLwJ-EfNTcot9DW7aMMmYAdMCQe-GnXxvRiIMDxrVmzd7M7N_R2OJdupTkG9g19Uwc5K6ksGmvsu")',
        }}
      />
      <div className="spacia-verify-glow" aria-hidden="true" />

      <main className="spacia-verify-shell">
        <button
          type="button"
          className="spacia-back"
          onClick={() => router.push('/login')}
          aria-label="Go back"
          disabled={verifyLoading || resendLoading}
        >
          <span className="spacia-backIcon" aria-hidden="true" />
        </button>

        <div className="spacia-brand">
          <div className="spacia-mark" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="spacia-name">Vision</div>
          <div className="spacia-underline" aria-hidden="true" />
        </div>

        <div className="spacia-title">
          <div className="spacia-h2">Verify Number</div>
          <div className="spacia-sub">OTP sent to {phone || 'your number'}</div>
          <button
            type="button"
            className="spacia-change"
            onClick={() => router.push('/login')}
            disabled={verifyLoading || resendLoading}
          >
            Change number
          </button>
        </div>

        <div className="spacia-otpCard">
          <div className="spacia-otpRow" aria-label="OTP input">
            {otp.map((val, idx) => (
              <div
                key={idx}
                className={[
                  'spacia-box',
                  idx === activeIdx ? 'spacia-box--active' : '',
                  val ? 'spacia-box--filled' : '',
                ].join(' ')}
              >
                <input
                  ref={(el) => {
                    refs.current[idx] = el
                  }}
                  value={val}
                  onFocus={() => setActiveIdx(idx)}
                  disabled={verifyLoading}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  type="tel"
                  className="spacia-input"
                  aria-label={`OTP digit ${idx + 1}`}
                  maxLength={1}
                  onChange={(e) => {
                    setError(null)
                    const d = e.target.value.replace(/\D/g, '').slice(-1)
                    if (!d) {
                      setOtp((prev) => {
                        const next = [...prev]
                        next[idx] = ''
                        return next
                      })
                      return
                    }
                    setOtp((prev) => {
                      const next = [...prev]
                      next[idx] = d
                      return next
                    })
                    focusIdx(idx + 1)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace') {
                      if (otp[idx]) {
                        setOtp((prev) => {
                          const next = [...prev]
                          next[idx] = ''
                          return next
                        })
                        return
                      }
                      focusIdx(idx - 1)
                    }
                    if (e.key === 'ArrowLeft') focusIdx(idx - 1)
                    if (e.key === 'ArrowRight') focusIdx(idx + 1)
                  }}
                  onPaste={(e) => {
                    e.preventDefault()
                    const text = e.clipboardData.getData('text')
                    applyDigits(text, idx)
                  }}
                />
                {idx === activeIdx && !otp[idx] && <div className="spacia-caret" aria-hidden="true" />}
              </div>
            ))}
          </div>

          <div className="spacia-resend">
            {timer > 0 ? (
              <span>
                Didn&apos;t receive it? <span className="spacia-mutedStrong">Resend in 0:{String(timer).padStart(2, '0')}</span>
              </span>
            ) : (
              <button type="button" className="spacia-resendBtn" onClick={handleResend} disabled={resendLoading}>
                {resendLoading ? 'Resending…' : 'Resend OTP'}
              </button>
            )}
          </div>
        </div>

        {error && <div className="spacia-error" role="alert">{error}</div>}

        <div className="spacia-bottom">
          <button
            type="button"
            className="spacia-cta"
            onClick={handleVerify}
            disabled={!isComplete || verifyLoading}
          >
            {verifyLoading ? 'Verifying…' : 'Verify & Continue'}
            <span className="spacia-ctaArrow" aria-hidden="true" />
          </button>

          <button type="button" className="spacia-face" onClick={() => alert('Biometric login coming soon.')} disabled={verifyLoading}>
            <span className="spacia-faceIcon" aria-hidden="true" />
            Or use Face ID
          </button>

          <div className="spacia-terms">
            By continuing, you agree to our{' '}
            <a className="spacia-link" href="#" onClick={(e) => e.preventDefault()}>
              Terms
            </a>{' '}
            and{' '}
            <a className="spacia-link" href="#" onClick={(e) => e.preventDefault()}>
              Privacy Policy
            </a>
            .
          </div>
        </div>
      </main>

      <style jsx>{`
        .spacia-verify-root {
          position: relative;
          min-height: 100dvh;
          width: 100vw;
          overflow: hidden;
          background: #1a1510;
          color: #f5f0e8;
        }
        .spacia-verify-bg {
          position: absolute;
          inset: 0;
          height: 45%;
          background-size: cover;
          background-position: center;
          filter: blur(2px);
        }
        .spacia-verify-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 60% 30% at 50% 0%, rgba(232, 135, 58, 0.1) 0%, transparent 100%);
          pointer-events: none;
        }
        .spacia-verify-shell {
          position: relative;
          z-index: 1;
          min-height: 100dvh;
          max-width: 460px;
          margin: 0 auto;
          padding: max(env(safe-area-inset-top), 18px) 18px max(env(safe-area-inset-bottom), 18px);
          display: flex;
          flex-direction: column;
          align-items: center;
          animation: fadeIn 520ms ease-out both;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .spacia-back {
          position: absolute;
          left: 18px;
          top: max(env(safe-area-inset-top), 18px);
          width: 42px;
          height: 42px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 140ms ease, background 160ms ease;
        }
        .spacia-back:active { transform: scale(0.96); }
        .spacia-back:disabled { opacity: 0.6; cursor: not-allowed; }
        .spacia-backIcon {
          width: 10px;
          height: 10px;
          border-left: 2px solid rgba(245, 240, 232, 0.92);
          border-bottom: 2px solid rgba(245, 240, 232, 0.92);
          transform: rotate(45deg);
          margin-left: 4px;
        }

        .spacia-brand {
          margin-top: 42px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        .spacia-mark {
          width: 50px;
          height: 50px;
          border-radius: 14px;
          background: #e8873a;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          padding: 11px;
          box-shadow: 0 14px 28px rgba(0,0,0,0.22);
        }
        .spacia-mark span { background: rgba(245, 240, 232, 0.98); border-radius: 4px; }
        .spacia-name {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.2px;
        }
        .spacia-underline {
          width: 28px;
          height: 2px;
          border-radius: 999px;
          background: #e8873a;
        }

        .spacia-title {
          text-align: center;
          margin-top: 18px;
          margin-bottom: 16px;
        }
        .spacia-h2 {
          font-size: 30px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        .spacia-sub {
          margin-top: 6px;
          font-size: 14px;
          color: rgba(138, 128, 112, 0.9);
        }
        .spacia-change {
          margin-top: 8px;
          border: 0;
          background: transparent;
          color: #e8873a;
          font-size: 13px;
          text-decoration: underline;
          text-decoration-color: rgba(232, 135, 58, 0.5);
          cursor: pointer;
        }
        .spacia-change:disabled { opacity: 0.6; cursor: not-allowed; }

        .spacia-otpCard {
          width: 100%;
          background: rgba(37, 32, 24, 0.78);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 20px;
          padding: 18px;
          box-shadow: 0 26px 66px rgba(0,0,0,0.42);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
        .spacia-otpRow {
          display: flex;
          justify-content: center;
          gap: 10px;
          padding: 6px 0 14px;
          flex-wrap: nowrap;
        }
        .spacia-box {
          width: 44px;
          height: 58px;
          border-radius: 12px;
          background: rgba(30, 24, 18, 0.92);
          border: 1px solid rgba(255, 255, 255, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: border-color 140ms ease, box-shadow 140ms ease, transform 140ms ease;
        }
        .spacia-box--active {
          border-color: rgba(232, 135, 58, 0.95);
          box-shadow: 0 0 14px rgba(232, 135, 58, 0.22);
          transform: translateY(-1px);
        }
        .spacia-box--filled {
          border-color: rgba(232, 135, 58, 0.75);
        }
        .spacia-input {
          width: 100%;
          height: 100%;
          border: 0;
          outline: none;
          background: transparent;
          text-align: center;
          font-size: 26px;
          font-weight: 700;
          color: rgba(245, 240, 232, 0.98);
          caret-color: transparent;
        }
        .spacia-input:disabled { opacity: 0.75; }
        .spacia-caret {
          position: absolute;
          width: 10px;
          height: 22px;
          border-left: 2px solid rgba(232, 135, 58, 0.95);
          animation: blink 1s step-end infinite;
        }
        @keyframes blink {
          50% { opacity: 0; }
        }

        .spacia-resend {
          text-align: center;
          font-size: 13px;
          color: rgba(138, 128, 112, 0.95);
        }
        .spacia-mutedStrong {
          color: rgba(90, 82, 72, 0.95);
          font-weight: 700;
        }
        .spacia-resendBtn {
          border: 0;
          background: transparent;
          color: #e8873a;
          font-weight: 800;
          cursor: pointer;
          text-decoration: underline;
          text-decoration-color: rgba(232, 135, 58, 0.45);
        }

        .spacia-error {
          width: 100%;
          margin-top: 12px;
          font-size: 12px;
          font-weight: 700;
          color: rgba(248, 113, 113, 0.95);
          text-align: center;
        }

        .spacia-bottom {
          width: 100%;
          margin-top: auto;
          padding-top: 18px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .spacia-cta {
          width: 100%;
          height: 56px;
          border-radius: 14px;
          border: 0;
          cursor: pointer;
          font-size: 16px;
          font-weight: 800;
          color: rgba(255, 255, 255, 0.96);
          background: linear-gradient(135deg, #e8873a 0%, #c45e18 100%);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: transform 140ms ease, opacity 140ms ease;
        }
        .spacia-cta:active:not(:disabled) { transform: scale(0.98); }
        .spacia-cta:disabled { opacity: 0.55; cursor: not-allowed; }
        .spacia-ctaArrow {
          width: 10px;
          height: 10px;
          border-right: 3px solid rgba(255, 255, 255, 0.95);
          border-top: 3px solid rgba(255, 255, 255, 0.95);
          transform: rotate(45deg);
        }

        .spacia-face {
          border: 0;
          background: transparent;
          color: rgba(138, 128, 112, 0.95);
          font-size: 13px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          opacity: 0.9;
        }
        .spacia-face:disabled { opacity: 0.5; cursor: not-allowed; }
        .spacia-faceIcon {
          width: 18px;
          height: 18px;
          border-radius: 6px;
          border: 1px solid rgba(90, 82, 72, 0.6);
          position: relative;
        }
        .spacia-faceIcon::before {
          content: '';
          position: absolute;
          left: 50%;
          top: 50%;
          width: 8px;
          height: 8px;
          border-radius: 999px;
          border: 1px solid rgba(90, 82, 72, 0.7);
          transform: translate(-50%, -50%);
        }

        .spacia-terms {
          text-align: center;
          font-size: 11px;
          color: rgba(90, 82, 72, 0.9);
          padding: 0 14px;
          line-height: 1.6;
          margin-bottom: 4px;
        }
        .spacia-link {
          color: #e8873a;
          text-decoration: underline;
          text-decoration-color: rgba(232, 135, 58, 0.45);
          text-underline-offset: 4px;
        }

        @media (max-width: 380px) {
          .spacia-box { width: 40px; height: 56px; }
          .spacia-input { font-size: 24px; }
        }
      `}</style>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100dvh' }} />}>
      <VerifyInner />
    </Suspense>
  )
}

