import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { buildApiUrl } from '../lib/apiUrl';

async function ensureDataUrlForVideoApi(src: string): Promise<string> {
  if (src.startsWith('data:')) return src;
  const res = await fetch(src);
  if (!res.ok) throw new Error('Could not load image for tour video');
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('Could not read image'));
    r.readAsDataURL(blob);
  });
}

export type RoomImmersiveTourSectionProps = {
  imageUrl: string;
  startSignal?: number;
  sectionId?: string;
  /** When false, omit the in-card heading (e.g. modal already has a title). */
  showHeading?: boolean;
};

/**
 * Same flow as `app/components/RoomImmersiveTourSection.tsx` — Runway Gen-4 Turbo via Next `/api/room-tour-video` (Vite proxies /api).
 */
export default function RoomImmersiveTourSection({
  imageUrl,
  startSignal,
  sectionId,
  showHeading = true,
}: RoomImmersiveTourSectionProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [videoStatus, setVideoStatus] = useState<'idle' | 'starting' | 'polling' | 'ready' | 'error'>('idle');
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoObjectUrl, setVideoObjectUrl] = useState<string | null>(null);
  const [operationName, setOperationName] = useState<string | null>(null);
  const abortRef = useRef(false);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastStartSignalRef = useRef<number | undefined>(startSignal);

  useEffect(() => {
    return () => {
      abortRef.current = true;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      setVideoObjectUrl((u) => {
        if (u) URL.revokeObjectURL(u);
        return null;
      });
    };
  }, []);

  useEffect(() => {
    setConfirmed(false);
    setVideoStatus('idle');
    setVideoError(null);
    setOperationName(null);
    setVideoObjectUrl((u) => {
      if (u) URL.revokeObjectURL(u);
      return null;
    });
    abortRef.current = false;
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, [imageUrl]);

  const pollOnce = useCallback(async (op: string): Promise<'pending' | Blob> => {
    const res = await fetch(buildApiUrl(`/api/room-tour-video?op=${encodeURIComponent(op)}`));
    if (res.status === 202) return 'pending';
    if (res.status === 200) {
      const blob = await res.blob();
      return blob.size > 0 ? blob : 'pending';
    }
    let msg = res.statusText;
    try {
      const j = (await res.json()) as { error?: string };
      if (typeof j.error === 'string') msg = j.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg || 'Tour video request failed');
  }, []);

  const startGeneration = useCallback(async () => {
    setConfirmed(true);
    setVideoError(null);
    setVideoStatus('starting');
    abortRef.current = false;
    setVideoObjectUrl((u) => {
      if (u) URL.revokeObjectURL(u);
      return null;
    });

    try {
      const imageDataUrl = await ensureDataUrlForVideoApi(imageUrl);
      const res = await fetch(buildApiUrl('/api/room-tour-video'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataUrl }),
      });
      const data = (await res.json().catch(() => ({}))) as { operationName?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error || res.statusText || 'Could not start video generation');
      }
      if (!data.operationName) {
        throw new Error('Invalid response from server');
      }
      setOperationName(data.operationName);
      setVideoStatus('polling');

      const op = data.operationName;
      const loop = async () => {
        if (abortRef.current) return;
        try {
          const result = await pollOnce(op);
          if (result === 'pending') {
            pollTimerRef.current = setTimeout(() => void loop(), 10_000);
            return;
          }
          if (abortRef.current) return;
          const url = URL.createObjectURL(result);
          setVideoObjectUrl(url);
          setVideoStatus('ready');
        } catch (e) {
          if (!abortRef.current) {
            setVideoStatus('error');
            setVideoError(e instanceof Error ? e.message : 'Tour video failed');
          }
        }
      };
      void loop();
    } catch (e) {
      setVideoStatus('error');
      setVideoError(e instanceof Error ? e.message : 'Tour video failed');
    }
  }, [imageUrl, pollOnce]);

  useEffect(() => {
    if (startSignal == null) return;
    if (lastStartSignalRef.current === startSignal) return;
    lastStartSignalRef.current = startSignal;
    if (videoStatus === 'starting' || videoStatus === 'polling') return;
    void startGeneration();
  }, [startSignal, startGeneration, videoStatus]);

  const btnPrimary: React.CSSProperties = {
    padding: '0.55rem 1.15rem',
    fontSize: '0.9rem',
    fontWeight: 600,
    borderRadius: 10,
    border: '1px solid #0f766e',
    background: '#0d9488',
    color: '#fff',
    cursor: 'pointer',
    fontFamily: "'Inter', system-ui, sans-serif",
  };

  return (
    <section
      id={sectionId}
      style={{
        marginTop: 0,
        padding: '1.15rem 1.25rem',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.12)',
        background: 'linear-gradient(180deg, rgba(30,41,59,0.85) 0%, rgba(15,23,42,0.92) 100%)',
      }}
      aria-labelledby={showHeading ? 'room-immersive-tour-heading' : undefined}
    >
      {showHeading && (
        <h3
          id="room-immersive-tour-heading"
          style={{ fontSize: '1rem', margin: '0 0 0.35rem', color: '#f1f5f9', fontFamily: "'Inter', sans-serif" }}
        >
          360°-style room tour
        </h3>
      )}
      {!confirmed && videoStatus === 'idle' && (
        <p style={{ margin: '0 0 1rem', fontSize: '0.88rem', lineHeight: 1.5, color: 'rgba(248,250,252,0.75)', fontFamily: "'Inter', sans-serif" }}>
          When you are happy with your design above, confirm below. We will generate a short video with a smooth panoramic
          camera move using <strong style={{ color: '#e2e8f0' }}>Runway Gen-4 Turbo</strong> (uses your Runway API credits — see{' '}
          <a href="https://docs.dev.runwayml.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#5eead4' }}>
            Runway docs
          </a>
          ). This usually takes one to several minutes — keep this tab open.
        </p>
      )}
      {confirmed && videoStatus === 'starting' && (
        <p style={{ margin: '0 0 1rem', fontSize: '0.88rem', color: 'rgba(248,250,252,0.75)', fontFamily: "'Inter', sans-serif" }}>
          Starting tour video generation…
        </p>
      )}
      {videoStatus === 'polling' && (
        <p style={{ margin: '0 0 1rem', fontSize: '0.88rem', color: 'rgba(248,250,252,0.75)', fontFamily: "'Inter', sans-serif" }}>
          Generating your room tour video…
        </p>
      )}
      {videoStatus === 'ready' && videoObjectUrl && (
        <p style={{ margin: '0 0 1rem', fontSize: '0.88rem', color: 'rgba(248,250,252,0.75)', fontFamily: "'Inter', sans-serif" }}>
          Your tour video is ready below.
        </p>
      )}
      {videoStatus === 'error' && (
        <p style={{ margin: '0 0 1rem', fontSize: '0.88rem', color: 'rgba(248,250,252,0.75)', fontFamily: "'Inter', sans-serif" }}>
          Something went wrong. You can try again.
        </p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center' }}>
        {(() => {
          const busy = videoStatus === 'starting' || videoStatus === 'polling';
          const initial = !confirmed && videoStatus === 'idle';
          let label: ReactNode = 'Try again';
          if (initial) {
            label = "I'm happy with this design — create 360° tour video";
          } else if (busy) {
            label = <>{videoStatus === 'starting' ? 'Starting…' : 'Generating video…'}</>;
          } else if (videoStatus === 'ready') {
            label = 'Regenerate tour video';
          }
          return (
            <button
              type="button"
              disabled={busy}
              onClick={() => void startGeneration()}
              style={{
                ...btnPrimary,
                opacity: busy ? 0.65 : 1,
                cursor: busy ? 'not-allowed' : 'pointer',
              }}
            >
              {label}
            </button>
          );
        })()}
        {videoStatus === 'polling' && operationName && (
          <span style={{ fontSize: '0.8rem', color: 'rgba(248,250,252,0.5)', fontFamily: "'Inter', sans-serif" }}>
            Checking status every 10s — keep this tab open.
          </span>
        )}
      </div>

      {videoError && (
        <p style={{ color: '#fca5a5', fontSize: '0.88rem', marginTop: '0.75rem', marginBottom: 0 }} role="alert">
          {videoError}
        </p>
      )}

      {videoObjectUrl && videoStatus === 'ready' && (
        <div style={{ marginTop: '1rem' }}>
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: 'rgba(248,250,252,0.65)', fontFamily: "'Inter', sans-serif" }}>
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
              border: '1px solid rgba(255,255,255,0.12)',
              background: '#000',
            }}
          />
        </div>
      )}
    </section>
  );
}
