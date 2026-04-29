'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function HomePage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    try {
      setToken(window.localStorage.getItem('spacia.token'))
    } catch {
      setToken(null)
    }
  }, [])

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

