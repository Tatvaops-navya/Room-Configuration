import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { X } from 'lucide-react'

export function ComparisonView({ onClose }: { onClose: () => void }) {
  const { state } = useApp()
  const [slider, setSlider] = useState(50)
  const original = state.image.originalDataUrl
  const current = state.image.source
  if (!original || !current) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col"
      role="dialog"
      aria-label="Before and after comparison"
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <div className="shrink-0 flex items-center justify-between px-6 py-4 bg-[var(--neutral-900)]/95 border-b border-white/10">
        <h2 className="font-['Inter',sans-serif] font-semibold text-white">Before / After</h2>
        <button
          type="button"
          onClick={onClose}
          className="p-2.5 rounded-[var(--radius-sm)] text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 min-h-0">
        <div className="relative w-full max-w-4xl aspect-video max-h-[80vh] rounded-[var(--radius-lg)] overflow-hidden bg-[var(--neutral-900)] shadow-2xl">
          <img
            src={original}
            alt="Original"
            className="absolute inset-0 w-full h-full object-contain"
          />
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - slider}% 0 0)` }}
          >
            <img
              src={current}
              alt="Edited"
              className="absolute inset-0 w-full h-full object-contain"
            />
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={slider}
            onChange={(e) => setSlider(Number(e.target.value))}
            className="absolute bottom-5 left-5 right-5 h-2 rounded-full bg-white/20 accent-[var(--primary)]"
            aria-label="Comparison slider"
          />
          <div className="absolute top-4 left-4 px-3 py-1.5 rounded-[var(--radius-sm)] bg-black/50 text-white text-sm font-medium backdrop-blur-sm">
            Before
          </div>
          <div className="absolute top-4 right-4 px-3 py-1.5 rounded-[var(--radius-sm)] bg-black/50 text-white text-sm font-medium backdrop-blur-sm">
            After
          </div>
        </div>
      </div>
    </div>
  )
}
