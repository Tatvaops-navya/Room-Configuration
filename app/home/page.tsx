'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { isSpaciaSignedIn } from '@/app/lib/auth/spaciaSession'
import { loadUserProfile } from '@/app/lib/userProfile/service'

export default function HomePage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const runIdRef = useRef(0)

  useEffect(() => {
    const runId = ++runIdRef.current
    ;(async () => {
      if (!isSpaciaSignedIn()) {
        if (runIdRef.current !== runId) return
        router.replace('/login')
        return
      }
      try {
        const profile = await loadUserProfile()
        if (runIdRef.current !== runId) return
        if (!profile.onboardingCompleted) {
          router.replace('/onboarding/questions')
          return
        }
      } catch {
        if (runIdRef.current !== runId) return
        router.replace('/onboarding/questions')
        return
      }
      try {
        setToken(window.localStorage.getItem('spacia.token'))
      } catch {
        setToken(null)
      }
      if (runIdRef.current !== runId) return
      setReady(true)
    })()
  }, [router])

  if (!ready) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          background: '#1a1510',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            border: '3px solid rgba(255,255,255,0.12)',
            borderTopColor: '#e8873a',
            animation: 'homeSpin 0.75s linear infinite',
          }}
          aria-busy
          aria-label="Loading"
        />
        <style>{`@keyframes homeSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', padding: 24 }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em' }}>Vision Home</h1>
        <p style={{ marginTop: 10, color: '#57534e' }}>
          Placeholder Home screen. Stored token:
        </p>
        <div style={{ marginTop: 8, padding: 12, border: '1px solid rgba(120,113,108,0.25)', borderRadius: 12 }}>
          <code>{token ?? '(none)'}</code>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          <button type="button" className="button button-secondary" style={{ width: 'auto' }} onClick={() => router.push('/spacia')}>
            Back to landing
          </button>
          <button type="button" className="button" style={{ width: 'auto' }} onClick={() => router.push('/')}>
            Go to main app (/)
          </button>
        </div>
      </div>
    </div>
  )
}
