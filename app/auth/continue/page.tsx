'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { isSpaciaSignedIn } from '@/app/lib/auth/spaciaSession'
import { loadUserProfile } from '@/app/lib/userProfile/service'

/**
 * Post-auth router: sends users to onboarding when not completed, otherwise /home.
 * Call `router.replace('/auth/continue')` after successful login/verify instead of linking directly to /home.
 */
export default function AuthContinuePage() {
  const router = useRouter()
  const [message, setMessage] = useState('Signing you in…')
  const runIdRef = useRef(0)

  useEffect(() => {
    const runId = ++runIdRef.current
    ;(async () => {
      if (!isSpaciaSignedIn()) {
        if (runIdRef.current !== runId) return
        router.replace('/login')
        return
      }
      setMessage('Loading your profile…')
      try {
        const profile = await loadUserProfile()
        if (runIdRef.current !== runId) return
        if (profile.onboardingCompleted) router.replace('/home')
        else router.replace('/onboarding/questions')
      } catch {
        if (runIdRef.current !== runId) return
        router.replace('/onboarding/questions')
      }
    })()
  }, [router])

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#1a1510',
        color: 'rgba(245,240,232,0.9)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 24,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 999,
          border: '3px solid rgba(255,255,255,0.12)',
          borderTopColor: '#e8873a',
          animation: 'obspin 0.75s linear infinite',
        }}
        aria-busy
        aria-label="Loading"
      />
      <p style={{ fontSize: 14, margin: 0, color: 'rgba(196,199,200,0.75)' }}>{message}</p>
      <style>{`@keyframes obspin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
