import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Download, Copy } from 'lucide-react'

export function ExportTab() {
  const { state } = useApp()
  const [format, setFormat] = useState<'png' | 'jpg' | 'webp'>('png')
  const [quality, setQuality] = useState(90)
  const [resolution, setResolution] = useState<'original' | '2x' | '0.5x'>('original')

  const handleDownloadFull = () => {
    if (state.image.source) {
      const a = document.createElement('a')
      a.href = state.image.source
      a.download = `export.${format}`
      a.click()
    }
  }

  const handleCopy = () => {
    if (state.image.source) {
      fetch(state.image.source)
        .then((r) => r.blob())
        .then((blob) => {
          const item = new ClipboardItem({ [blob.type]: blob })
          navigator.clipboard.write([item])
        })
        .catch(() => {})
    }
  }

  return (
    <div className="editor-tab-content space-y-4">
      <div>
        <p className="editor-label mb-2" style={{ color: 'var(--text-secondary)' }}>
          FORMAT
        </p>
        <div className="space-y-2">
          {(['png', 'jpg', 'webp'] as const).map((f) => (
            <label key={f} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="format"
                checked={format === f}
                onChange={() => setFormat(f)}
                className="accent-[var(--preset)]"
              />
              <span className="editor-body capitalize">{f}</span>
              {f === 'png' && <span className="editor-small text-tertiary">(Transparency)</span>}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="editor-label mb-2" style={{ color: 'var(--text-secondary)' }}>
          QUALITY
        </p>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={50}
            max={100}
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
            className="flex-1 h-2 rounded-full accent-[var(--preset)]"
          />
          <span className="editor-mono w-10">{quality}%</span>
        </div>
      </div>

      <div>
        <p className="editor-label mb-2" style={{ color: 'var(--text-secondary)' }}>
          RESOLUTION
        </p>
        <div className="space-y-2">
          {(
            [
              { value: 'original' as const, label: 'Original', dims: state.image.width && state.image.height ? `${state.image.width}×${state.image.height}` : '' },
              { value: '2x' as const, label: '2× Scale', dims: state.image.width && state.image.height ? `${state.image.width * 2}×${state.image.height * 2}` : '' },
              { value: '0.5x' as const, label: '0.5× Scale', dims: state.image.width && state.image.height ? `${Math.floor(state.image.width / 2)}×${Math.floor(state.image.height / 2)}` : '' },
            ] as const
          ).map(({ value, label, dims }) => (
            <label key={value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="resolution"
                checked={resolution === value}
                onChange={() => setResolution(value)}
                className="accent-[var(--preset)]"
              />
              <span className="editor-body">{label}</span>
              {dims && <span className="editor-mono text-tertiary">({dims})</span>}
            </label>
          ))}
        </div>
      </div>

      <div className="pt-2 space-y-2">
        <button
          type="button"
          onClick={handleDownloadFull}
          className="w-full h-12 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: 'var(--success)' }}
        >
          <Download className="w-5 h-5" />
          Download Full Image
        </button>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {}}
            className="flex-1 min-w-[120px] h-10 rounded-lg border editor-small font-semibold flex items-center justify-center gap-1.5"
            style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          >
            <Download className="w-4 h-4" />
            Cutout Only
          </button>
          <button
            type="button"
            onClick={() => {}}
            className="flex-1 min-w-[120px] h-10 rounded-lg border editor-small font-semibold flex items-center justify-center gap-1.5"
            style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          >
            <Download className="w-4 h-4" />
            All Components
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="h-10 px-4 rounded-lg border flex items-center justify-center gap-1.5"
            style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            aria-label="Copy to clipboard"
          >
            <Copy className="w-4 h-4" />
            Copy
          </button>
        </div>
      </div>
    </div>
  )
}
