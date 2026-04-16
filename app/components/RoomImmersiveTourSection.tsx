'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

async function ensureDataUrlForVideoApi(src: string): Promise<string> {
  if (src.startsWith('data:')) return src
  const res = await fetch(src)
  if (!res.ok) throw new Error('Could not load image for tour video')
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(new Error('Could not read image'))
    r.readAsDataURL(blob)
  })
}

export type RoomImmersiveTourSectionProps = {
  /** Data URL, blob URL, or same-origin /api image URL — converted to data URL when generating video. */
  imageUrl: string
  /** Optional external trigger from parent; increments to auto-start generation. */
  startSignal?: number
  /** Optional id so parent can scroll/focus this section. */
  sectionId?: string
}

/**
 * After the user finalizes: confirm-only entry (no room preview here); on confirm, Runway Gen-4 Turbo via /api/room-tour-video.
 */
export default function RoomImmersiveTourSection({
  imageUrl,
  startSignal,
  sectionId,
}: RoomImmersiveTourSectionProps) {
  const [confirmed, setConfirmed] = useState(false)
  const [videoStatus, setVideoStatus] = useState<'idle' | 'starting' | 'polling' | 'ready' | 'error'>('idle')
  const [videoError, setVideoError] = useState<string | null>(null)
  const [videoObjectUrl, setVideoObjectUrl] = useState<string | null>(null)
  const [operationName, setOperationName] = useState<string | null>(null)
  const abortRef = useRef(false)
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastStartSignalRef = useRef<number | undefined>(startSignal)

  useEffect(() => {
    return () => {
      abortRef.current = true
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current)
      setVideoObjectUrl((u) => {
        if (u) URL.revokeObjectURL(u)
        return null
      })
    }
  }, [])

  useEffect(() => {
    setConfirmed(false)
    setVideoStatus('idle')
    setVideoError(null)
    setOperationName(null)
    setVideoObjectUrl((u) => {
      if (u) URL.revokeObjectURL(u)
      return null
    })
    abortRef.current = false
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }, [imageUrl])

  const pollOnce = useCallback(async (op: string): Promise<'pending' | Blob> => {
    const res = await fetch(`/api/room-tour-video?op=${encodeURIComponent(op)}`)
    if (res.status === 202) return 'pending'
    if (res.status === 200) {
      const blob = await res.blob()
      return blob.size > 0 ? blob : 'pending'
    }
    let msg = res.statusText
    try {
      const j = (await res.json()) as { error?: string }
      if (typeof j.error === 'string') msg = j.error
    } catch {
      /* ignore */
    }
    throw new Error(msg || 'Tour video request failed')
  }, [])

  const startGeneration = useCallback(async () => {
    setConfirmed(true)
    setVideoError(null)
    setVideoStatus('starting')
    abortRef.current = false
    setVideoObjectUrl((u) => {
      if (u) URL.revokeObjectURL(u)
      return null
    })

    try {
      const imageDataUrl = await ensureDataUrlForVideoApi(imageUrl)
      const res = await fetch('/api/room-tour-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataUrl }),
      })
      const data = (await res.json().catch(() => ({}))) as { operationName?: string; error?: string }
      if (!res.ok) {
        throw new Error(data.error || res.statusText || 'Could not start video generation')
      }
      if (!data.operationName) {
        throw new Error('Invalid response from server')
      }
      setOperationName(data.operationName)
      setVideoStatus('polling')

      const op = data.operationName
      const loop = async () => {
        if (abortRef.current) return
        try {
          const result = await pollOnce(op)
          if (result === 'pending') {
            pollTimerRef.current = setTimeout(() => void loop(), 10_000)
            return
          }
          if (abortRef.current) return
          const url = URL.createObjectURL(result)
          setVideoObjectUrl(url)
          setVideoStatus('ready')
        } catch (e) {
          if (!abortRef.current) {
            setVideoStatus('error')
            setVideoError(e instanceof Error ? e.message : 'Tour video failed')
          }
        }
      }
      void loop()
    } catch (e) {
      setVideoStatus('error')
      setVideoError(e instanceof Error ? e.message : 'Tour video failed')
    }
  }, [imageUrl, pollOnce])

  useEffect(() => {
    if (startSignal == null) return
    if (lastStartSignalRef.current === startSignal) return
    lastStartSignalRef.current = startSignal
    if (videoStatus === 'starting' || videoStatus === 'polling') return
    void startGeneration()
  }, [startSignal, startGeneration, videoStatus])

  return (
    <section
      id={sectionId}
      className="card"
      style={{
        marginTop: '1.25rem',
        padding: '1.15rem 1.25rem',
        borderRadius: 12,
        border: '1px solid var(--color-border, #e2e8f0)',
        background: 'linear-gradient(180deg, #f8fafc 0%, #fff 100%)',
      }}
      aria-labelledby="room-immersive-tour-heading"
    >
      <h3 id="room-immersive-tour-heading" style={{ fontSize: '1rem', margin: '0 0 0.35rem', color: '#0f172a' }}>
        360°-style room tour
      </h3>
      {!confirmed && videoStatus === 'idle' && (
        <p className="hint-text" style={{ margin: '0 0 1rem', fontSize: '0.88rem', lineHeight: 1.5 }}>
          When you are happy with your design above, confirm below. We will generate a short video with a smooth panoramic
          camera move using <strong>Runway Gen-4 Turbo</strong> (uses your Runway API credits — see{' '}
          <a href="https://docs.dev.runwayml.com/" target="_blank" rel="noopener noreferrer">
            Runway docs
          </a>
          ). This usually takes one to several minutes — keep this tab open.
        </p>
      )}
      {confirmed && videoStatus === 'starting' && (
        <p className="hint-text" style={{ margin: '0 0 1rem', fontSize: '0.88rem', lineHeight: 1.5 }}>
          Starting tour video generation…
        </p>
      )}
      {videoStatus === 'polling' && (
        <p className="hint-text" style={{ margin: '0 0 1rem', fontSize: '0.88rem', lineHeight: 1.5 }}>
          Generating your room tour video…
        </p>
      )}
      {videoStatus === 'ready' && videoObjectUrl && (
        <p className="hint-text" style={{ margin: '0 0 1rem', fontSize: '0.88rem', lineHeight: 1.5 }}>
          Your tour video is ready below.
        </p>
      )}
      {videoStatus === 'error' && (
        <p className="hint-text" style={{ margin: '0 0 1rem', fontSize: '0.88rem', lineHeight: 1.5 }}>
          Something went wrong. You can try again.
        </p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center' }}>
        {(() => {
          const busy = videoStatus === 'starting' || videoStatus === 'polling'
          const initial = !confirmed && videoStatus === 'idle'
          let label: ReactNode = 'Try again'
          if (initial) {
            label = "I'm happy with this design — create 360° tour video"
          } else if (busy) {
            label = (
              <>
                <span className="spinner" aria-hidden />
                {videoStatus === 'starting' ? 'Starting…' : 'Generating video…'}
              </>
            )
          } else if (videoStatus === 'ready') {
            label = 'Regenerate tour video'
          }
          return (
            <button
              type="button"
              className="button button-primary"
              disabled={busy}
              onClick={() => void startGeneration()}
            >
              {label}
            </button>
          )
        })()}
        {videoStatus === 'polling' && operationName && (
          <span className="hint-text" style={{ fontSize: '0.8rem' }}>
            Checking status every 10s — keep this tab open.
          </span>
        )}
      </div>

      {videoError && (
        <p style={{ color: '#b91c1c', fontSize: '0.88rem', marginTop: '0.75rem', marginBottom: 0 }} role="alert">
          {videoError}
        </p>
      )}

      {videoObjectUrl && videoStatus === 'ready' && (
        <div style={{ marginTop: '1rem' }}>
          <p className="hint-text" style={{ margin: '0 0 0.5rem', fontSize: '0.85rem' }}>
            Your tour video (AI-generated — inspect for accuracy):
          </p>
          <video
            src={videoObjectUrl}
            controls
            playsInline
            style={{
              width: '100%',
              maxWidth: 720,
              borderRadius: 12,
              border: '1px solid var(--color-border, #e2e8f0)',
              background: '#000',
            }}
          />
        </div>
      )}
    </section>
  )
}
