import { useState, useEffect } from 'react'
import { Copy, Download, EyeOff, Palette, Sparkles, Replace, Layers, Bug, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { addToast } from './ToastContainer'

export function CutoutPanel() {
  const { state, dispatch, getSelectedComponents } = useApp()
  const selected = getSelectedComponents()
  const [debugMask, setDebugMask] = useState(false)
  const [debugAlpha, setDebugAlpha] = useState(false)
  const [debugEdges, setDebugEdges] = useState(false)

  if (!state.image.source) return null

  return (
    <div className="flex flex-col h-full min-h-0">
      {state.components.length > 0 && (
        <div className="shrink-0 px-4 py-2 border-b border-[var(--neutral-200)] bg-[var(--neutral-50)]/50">
          <p className="text-[10px] font-semibold text-[var(--neutral-500)] uppercase tracking-widest mb-2">Components</p>
          <div className="flex flex-wrap gap-1.5">
            {state.components.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => dispatch({ type: 'TOGGLE_COMPONENT_SELECTION', payload: c.id })}
                className={`
                  flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 min-h-[32px]
                  ${state.selection.activeComponentIds.includes(c.id)
                    ? 'bg-[var(--primary)] text-white shadow-sm'
                    : 'bg-white border border-[var(--neutral-200)] text-[var(--neutral-700)] hover:border-[var(--neutral-300)]'}
                `}
              >
                <span className="truncate max-w-[80px]">{c.name}</span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); dispatch({ type: 'REMOVE_COMPONENT', payload: c.id }) }}
                  onKeyDown={(e) => e.key === 'Enter' && dispatch({ type: 'REMOVE_COMPONENT', payload: c.id })}
                  className="p-0.5 rounded hover:bg-black/10"
                  aria-label={`Remove ${c.name}`}
                >
                  ×
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {selected.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div className="max-w-[260px]">
            <div className="w-14 h-14 rounded-2xl bg-[var(--neutral-100)] flex items-center justify-center mx-auto mb-4 text-[var(--neutral-400)]">
              <Layers className="w-7 h-7" />
            </div>
            <p className="text-sm text-[var(--neutral-500)] leading-relaxed">
              Click any object in the room image — sofa, chair, table, lamp, etc. — to extract it. The component will appear here with a transparent background, ready for Preset, AI, or Replace.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-auto p-4 lg:p-5 space-y-5">
            <section>
              <p className="text-[10px] font-semibold text-[var(--neutral-500)] uppercase tracking-widest mb-2">Extracted component</p>
              {selected.map((comp) => (
                <CutoutCard
                  key={comp.id}
                  component={comp}
                  debugMask={debugMask}
                  debugAlpha={debugAlpha}
                  debugEdges={debugEdges}
                  onPreset={() => dispatch({ type: 'SET_ACTIVE_PANEL', payload: 'preset' })}
                  onAI={() => dispatch({ type: 'SET_ACTIVE_PANEL', payload: 'ai' })}
                  onReplace={() => dispatch({ type: 'SET_ACTIVE_PANEL', payload: 'replace' })}
                />
              ))}
            </section>
            {selected[0] && (
              <section>
                <p className="text-[10px] font-semibold text-[var(--neutral-500)] uppercase tracking-widest mb-2">Component info</p>
                <div className="rounded-xl border border-[var(--neutral-200)] bg-[var(--neutral-50)] p-4 shadow-sm">
                  <InfoRow label="Type" value={selected[0].name} />
                  <InfoRow label="Dimensions" value={`${selected[0].region.width} × ${selected[0].region.height} px`} />
                  <InfoRow label="Position" value={`X: ${selected[0].region.x}px, Y: ${selected[0].region.y}px`} />
                  <InfoRow label="Confidence" value={`${Math.round(selected[0].confidence * 100)}%`} />
                  <InfoRow label="Status" value="Ready to edit" />
                </div>
              </section>
            )}
            <section>
              <p className="text-[10px] font-semibold text-[var(--neutral-500)] uppercase tracking-widest mb-2">Quick actions</p>
              <div className="flex gap-2 flex-wrap">
                <ActionBtn icon={<Copy className="w-4 h-4" />} label="Copy" onClick={() => addToast('Copied to clipboard', 'success')} />
                <ActionBtn icon={<Download className="w-4 h-4" />} label="Download" onClick={() => selected[0] && downloadCutout(selected[0])} />
                <ActionBtn icon={<EyeOff className="w-4 h-4" />} label="Hide" onClick={() => selected[0] && dispatch({ type: 'TOGGLE_COMPONENT_SELECTION', payload: selected[0].id })} />
                <ActionBtn icon={<Trash2 className="w-4 h-4" />} label="Delete" onClick={() => selected[0] && dispatch({ type: 'REMOVE_COMPONENT', payload: selected[0].id })} destructive />
              </div>
            </section>
          {selected.length > 0 && (
            <div className="rounded-[var(--radius-md)] border border-[var(--neutral-200)] bg-[var(--neutral-50)]/50 p-3">
              <button
                type="button"
                onClick={() => setDebugMask((m) => !m)}
                className="flex items-center gap-2 text-xs font-medium text-[var(--neutral-600)] mb-2"
              >
                <Bug className="w-3.5 h-3.5" />
                Debug overlays
              </button>
              <div className="flex flex-wrap gap-3 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={debugMask} onChange={(e) => setDebugMask(e.target.checked)} className="rounded" />
                  Show segmentation mask
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={debugAlpha} onChange={(e) => setDebugAlpha(e.target.checked)} className="rounded" />
                  Show alpha matte
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={debugEdges} onChange={(e) => setDebugEdges(e.target.checked)} className="rounded" />
                  Show feathered edges
                </label>
              </div>
            </div>
          )}
          </div>
        </>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline gap-2 py-1.5 border-b border-[var(--neutral-200)]/60 last:border-0">
      <span className="text-xs text-[var(--neutral-500)] uppercase tracking-wide font-medium">{label}</span>
      <span className="text-sm font-semibold text-[var(--neutral-800)] font-mono tabular-nums">{value}</span>
    </div>
  )
}

function CutoutCard({
  component: comp,
  debugMask,
  debugAlpha,
  debugEdges,
  onPreset,
  onAI,
  onReplace,
}: {
  component: { id: string; name: string; region: { width: number; height: number; x?: number; y?: number }; confidence: number; cutoutDataUrl: string | null; maskDataUrl?: string | null }
  debugMask: boolean
  debugAlpha: boolean
  debugEdges: boolean
  onPreset: () => void
  onAI: () => void
  onReplace: () => void
}) {
  return (
    <div className="rounded-xl border-2 border-dashed border-[var(--neutral-200)] bg-gradient-to-b from-[var(--neutral-50)] to-white overflow-hidden shadow-md animate-fade-scale-in hover:shadow-lg hover:border-[var(--neutral-300)] transition-all duration-200 cutout-card">
      <div className="relative cutout-preview-rect checkered min-h-[200px] w-full flex items-center justify-center p-5 overflow-visible bg-[repeating-conic-gradient(#e5e7eb_0%_25%,#f9fafb_0%_50%)] bg-[length:8px_8px]">
        {comp.cutoutDataUrl ? (
          <>
            <img
              key={`${comp.id}-${comp.cutoutDataUrl.length}`}
              src={comp.cutoutDataUrl}
              alt={comp.name}
              className="max-w-full max-h-[360px] w-auto h-auto object-contain object-center block"
            />
            {(debugMask || debugAlpha || debugEdges) && (
              <div className="absolute inset-0 flex flex-col gap-1 items-center justify-center p-2 bg-black/60 rounded-[var(--radius-sm)] overflow-auto">
                {debugMask && comp.maskDataUrl && (
                  <>
                    <div className="text-[10px] text-white/90 uppercase tracking-wider">Segmentation mask</div>
                    <img src={comp.maskDataUrl} alt="Mask" className="max-w-full max-h-[120px] object-contain border border-white/30 rounded" />
                  </>
                )}
                {debugAlpha && (
                  <>
                    <div className="text-[10px] text-white/90 uppercase tracking-wider">Alpha matte</div>
                    <AlphaMatteView dataUrl={comp.cutoutDataUrl} className="max-w-full max-h-[120px] object-contain border border-white/30 rounded" />
                  </>
                )}
                {debugEdges && (
                  <>
                    <div className="text-[10px] text-white/90 uppercase tracking-wider">Feathered edges</div>
                    <FeatheredEdgesView dataUrl={comp.cutoutDataUrl} className="max-w-full max-h-[120px] object-contain border border-white/30 rounded" />
                  </>
                )}
              </div>
            )}
          </>
        ) : (
          <span className="text-[var(--neutral-400)] text-sm font-medium">Extracting…</span>
        )}
      </div>
      <div className="p-3 space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={onPreset}
            className="action-btn-preset flex items-center justify-center gap-2 h-12 rounded-xl text-white text-sm font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200"
          >
            <Palette className="w-[18px] h-[18px]" />
            Preset
          </button>
          <button
            type="button"
            onClick={onAI}
            className="action-btn-ai flex items-center justify-center gap-2 h-12 rounded-xl text-white text-sm font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200"
          >
            <Sparkles className="w-[18px] h-[18px]" />
            AI
          </button>
          <button
            type="button"
            onClick={onReplace}
            className="action-btn-replace flex items-center justify-center gap-2 h-12 rounded-xl text-white text-sm font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200"
          >
            <Replace className="w-[18px] h-[18px]" />
            Replace
          </button>
        </div>
      </div>
    </div>
  )
}

function AlphaMatteView({ dataUrl, className }: { dataUrl: string; className?: string }) {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    setSrc(null)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const id = ctx.getImageData(0, 0, canvas.width, canvas.height)
      for (let i = 0; i < id.data.length; i += 4) {
        const a = id.data[i + 3]
        id.data[i] = id.data[i + 1] = id.data[i + 2] = a
      }
      ctx.putImageData(id, 0, 0)
      setSrc(canvas.toDataURL('image/png'))
    }
    img.src = dataUrl
  }, [dataUrl])
  if (!src) return <span className="text-white/70 text-xs">Loading…</span>
  return <img src={src} alt="Alpha matte" className={className} />
}

function FeatheredEdgesView({ dataUrl, className }: { dataUrl: string; className?: string }) {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    setSrc(null)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const id = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const w = canvas.width
      const h = canvas.height
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4
          const a = id.data[i + 3]
          const isEdge = a > 10 && a < 245
          id.data[i] = isEdge ? 255 : 0
          id.data[i + 1] = 0
          id.data[i + 2] = 0
        }
      }
      ctx.putImageData(id, 0, 0)
      setSrc(canvas.toDataURL('image/png'))
    }
    img.src = dataUrl
  }, [dataUrl])
  if (!src) return <span className="text-white/70 text-xs">Loading…</span>
  return <img src={src} alt="Feathered edges" className={className} />
}

function ActionBtn({
  icon,
  label,
  onClick,
  destructive,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  destructive?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex items-center justify-center gap-2 min-h-[40px] min-w-[40px] py-2 px-4 rounded-lg border text-sm font-medium transition-all duration-200
        ${destructive
          ? 'border-[var(--neutral-200)] text-[var(--neutral-600)] hover:bg-red-50 hover:border-red-200 hover:text-red-600'
          : 'bg-white border-[var(--neutral-200)] text-[var(--neutral-700)] hover:bg-[var(--neutral-50)] hover:border-[var(--neutral-300)] hover:shadow-sm'}
      `}
      aria-label={label}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

function downloadCutout(comp: { name: string; cutoutDataUrl: string | null }) {
  if (!comp.cutoutDataUrl) return
  const a = document.createElement('a')
  a.href = comp.cutoutDataUrl
  a.download = `${comp.name.replace(/\s+/g, '-').toLowerCase()}-cutout.png`
  a.click()
}
