import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { applyPresetToDataUrl } from '../../lib/canvasUtils'
import { isGeminiConfigured, geminiEditImageStyleVariations } from '../../lib/geminiApi'
import { AI_PLACEHOLDERS } from '../../lib/mockData'
import { addToast } from '../ToastContainer'
import { Sparkles } from 'lucide-react'

export function AIPanel() {
  const { state, dispatch, getSelectedComponents, recordHistory, previewCutoutDataUrl, setPreviewCutoutDataUrl } = useApp()
  const selected = getSelectedComponents()
  const [prompt, setPrompt] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [intensity, setIntensity] = useState(80)
  const [variations, setVariations] = useState<string[]>([])
  const [pendingVariation, setPendingVariation] = useState<string | null>(null)

  const placeholder = AI_PLACEHOLDERS[Math.floor(Math.random() * AI_PLACEHOLDERS.length)]
  const useGemini = isGeminiConfigured()

  const runAI = async () => {
    if (!prompt.trim() || selected.length === 0) return
    setIsProcessing(true)
    setVariations([])
    setPendingVariation(null)
    dispatch({ type: 'SET_EDITING', payload: { isProcessing: true, currentOperation: 'Generating style variations...', progress: 0 } })
    const comp = selected[0]
    const source = previewCutoutDataUrl || comp?.cutoutDataUrl || state.image.originalDataUrl
    if (!comp || !source) {
      setIsProcessing(false)
      dispatch({ type: 'SET_EDITING', payload: { isProcessing: false, progress: 100 } })
      return
    }
    try {
      if (useGemini) {
        const urls = await geminiEditImageStyleVariations(
          source,
          prompt.trim(),
          intensity,
          (current, total, label) => {
            dispatch({
              type: 'SET_EDITING',
              payload: { currentOperation: label, progress: Math.round((current / total) * 90) },
            })
          }
        )
        setVariations(urls)
      } else {
        const steps = ['Analyzing component...', 'Generating variation 1...', 'Generating variation 2...', 'Generating variation 3...']
        let step = 0
        const iv = setInterval(() => {
          step += 1
          dispatch({ type: 'SET_EDITING', payload: { currentOperation: steps[Math.min(step, 3)], progress: (step * 25) % 100 } })
          if (step >= 4) clearInterval(iv)
        }, 800)
        const v1 = await applyPresetToDataUrl(source, 'clean')
        const v2 = await applyPresetToDataUrl(source, 'vintage')
        const v3 = await applyPresetToDataUrl(source, 'neon')
        clearInterval(iv)
        setVariations([v1, v2, v3])
        addToast('Set VITE_IMAGE_GENERATION_API_KEY for AI style generation based on your description', 'info')
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'AI request failed'
      addToast(message, 'error')
    } finally {
      dispatch({ type: 'SET_EDITING', payload: { isProcessing: false, progress: 100 } })
      setIsProcessing(false)
    }
  }

  const selectVariation = (dataUrl: string) => {
    setPendingVariation(dataUrl)
    setPreviewCutoutDataUrl(dataUrl)
  }

  const applyVariation = () => {
    if (!pendingVariation) return
    if (selected.length === 0) return
    recordHistory()
    selected.forEach((c) => {
      dispatch({
        type: 'APPLY_AI',
        payload: { id: c.id, cutoutDataUrl: pendingVariation, prompt, intensity },
      })
    })
    setPendingVariation(null)
    setPreviewCutoutDataUrl(null)
    setVariations([])
    addToast('Style applied — main image updated', 'success')
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-[var(--neutral-500)] leading-relaxed">
        Describe how to modify the selected component. AI will generate variations.
      </p>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full px-4 py-3 rounded-[var(--radius-md)] border border-[var(--neutral-200)] text-sm placeholder:text-[var(--neutral-400)] focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-shadow"
        disabled={isProcessing}
      />
      <div>
        <label className="block text-sm font-semibold text-[var(--neutral-700)] mb-2">
          Intensity: {intensity}%
        </label>
        <input
          type="range"
          min={20}
          max={100}
          value={intensity}
          onChange={(e) => setIntensity(Number(e.target.value))}
          className="w-full"
          aria-label="Intensity"
        />
      </div>
      <button
        type="button"
        onClick={runAI}
        disabled={isProcessing}
        className="w-full py-3.5 rounded-[var(--radius-md)] bg-gradient-to-r from-[var(--secondary)] to-[#7C3AED] text-white font-semibold shadow-sm hover:shadow-md hover:brightness-105 disabled:opacity-70 transition-all flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            {state.editing.currentOperation}
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Generate
          </>
        )}
      </button>
      {variations.length > 0 && (
        <div className="space-y-3 pt-2">
          <p className="text-sm font-semibold text-[var(--neutral-900)]">Choose a variation</p>
          <p className="text-xs text-[var(--neutral-500)]">
            Select a variation to preview it on the right, then click Apply.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {variations.map((url, i) => (
              <button
                key={i}
                type="button"
                onClick={() => selectVariation(url)}
                className={`rounded-[var(--radius-md)] overflow-hidden border-2 hover:shadow-md transition-all duration-200 ${
                  pendingVariation === url ? 'border-[var(--primary)]' : 'border-[var(--neutral-200)] hover:border-[var(--primary)]'
                }`}
              >
                <img src={url} alt={`Variation ${i + 1}`} className="w-full aspect-square object-cover" />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={applyVariation}
            disabled={!pendingVariation || selected.length === 0}
            className="w-full py-3 rounded-[var(--radius-md)] bg-[var(--primary)] text-white font-semibold disabled:opacity-60"
          >
            Apply to Main Image
          </button>
        </div>
      )}
    </div>
  )
}
