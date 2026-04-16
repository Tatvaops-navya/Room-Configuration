import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { STOCK_ITEMS } from '../../lib/mockData'
import { SOFA_DATABASE } from '../../data/sofaDatabase'
import { loadCatalogImageForReplacement } from '../../lib/canvasUtils'
import { isGeminiConfigured, geminiGenerateImage } from '../../lib/geminiApi'
import { addToast } from '../ToastContainer'
import { Search, ImagePlus, Sparkles, Loader2, Sofa } from 'lucide-react'

export function ReplacePanel() {
  const { dispatch, getSelectedComponents, recordHistory, previewCutoutDataUrl, setPreviewCutoutDataUrl } = useApp()
  const selected = getSelectedComponents()
  const primary = selected[0] ?? null
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'catalog' | 'stock' | 'upload' | 'ai'>('catalog')
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [pendingAiReplacement, setPendingAiReplacement] = useState<string | null>(null)
  const [catalogLoadingId, setCatalogLoadingId] = useState<string | null>(null)
  const [catalogSearch, setCatalogSearch] = useState('')
  const useGemini = isGeminiConfigured()

  const filtered = STOCK_ITEMS.filter(
    (s) => !search.trim() || s.name.toLowerCase().includes(search.toLowerCase())
  )
  const filteredSofas = SOFA_DATABASE.filter(
    (s) =>
      !catalogSearch.trim() ||
      s.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      s.brand.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      s.color.toLowerCase().includes(catalogSearch.toLowerCase())
  )

  const replaceWith = (sourceLabel: string, dataUrl?: string) => {
    if (selected.length === 0) return
    recordHistory()
    selected.forEach((c) => {
      const url = dataUrl ?? previewCutoutDataUrl ?? c.cutoutDataUrl ?? ''
      dispatch({
        type: 'REPLACE_COMPONENT',
        payload: { id: c.id, cutoutDataUrl: url, source: sourceLabel },
      })
    })
    setPreviewCutoutDataUrl(null)
    addToast(`Replaced with ${sourceLabel}`, 'success')
  }

  const selectSofaFromCatalog = async (product: (typeof SOFA_DATABASE)[0]) => {
    if (!primary || product.images.length === 0) return
    const { region } = primary
    const w = Math.max(1, Math.round(region.width))
    const h = Math.max(1, Math.round(region.height))
    setCatalogLoadingId(product.id)
    try {
      const dataUrl = await loadCatalogImageForReplacement(product.images[0], w, h)
      setPreviewCutoutDataUrl(dataUrl)
      addToast(`Preview: ${product.name}. Click "Apply to Main Image" to replace only the selected area.`, 'info')
    } catch (e) {
      console.error(e)
      addToast('Could not load sofa image. The image host may block cross-origin requests.', 'error')
    } finally {
      setCatalogLoadingId(null)
    }
  }

  const tabStyle = (t: string) =>
    `flex-1 py-2.5 rounded-[var(--radius-sm)] text-sm font-semibold transition-colors ${
      tab === t ? 'bg-[var(--neutral-200)] text-[var(--neutral-900)]' : 'text-[var(--neutral-500)] hover:text-[var(--neutral-700)]'
    }`

  return (
    <div className="space-y-5">
      <div className="flex gap-1 p-1 rounded-[var(--radius-md)] bg-[var(--neutral-100)] flex-wrap">
        <button type="button" onClick={() => setTab('catalog')} className={tabStyle('catalog')}>
          Sofa catalog
        </button>
        <button type="button" onClick={() => setTab('stock')} className={tabStyle('stock')}>
          Stock
        </button>
        <button type="button" onClick={() => setTab('upload')} className={tabStyle('upload')}>
          Upload
        </button>
        <button type="button" onClick={() => setTab('ai')} className={tabStyle('ai')}>
          AI
        </button>
      </div>
      {tab === 'catalog' && (
        <>
          <p className="text-sm text-[var(--neutral-600)]">
            Choose a sofa to replace the selected area. The product image background is removed so only the sofa is placed; only the selected part changes. For best results, select the object to replace (e.g. existing sofa). Then click <strong>Apply to Main Image</strong> in the sidebar.
          </p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--neutral-400)]" />
            <input
              type="search"
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              placeholder="Search by name, brand, colour..."
              className="w-full pl-10 pr-4 py-2.5 rounded-[var(--radius-md)] border border-[var(--neutral-200)] text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-[320px] overflow-auto">
            {filteredSofas.map((product) => {
              const isLoading = catalogLoadingId === product.id
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => selectSofaFromCatalog(product)}
                  disabled={isLoading}
                  className="rounded-[var(--radius-md)] border border-[var(--neutral-200)] p-2 text-left hover:border-[var(--primary)] hover:bg-[var(--neutral-50)] hover:shadow-sm transition-all disabled:opacity-70"
                >
                  <div className="relative aspect-[4/3] rounded-[var(--radius-sm)] bg-[var(--neutral-100)] mb-2 overflow-hidden flex items-center justify-center">
                    {product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <Sofa className="w-8 h-8 text-[var(--neutral-400)]" />
                    )}
                    {isLoading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-[var(--radius-sm)]">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-[var(--neutral-900)] truncate" title={product.name}>
                    {product.name}
                  </p>
                  <p className="text-xs text-[var(--neutral-500)]">
                    {product.brand} · {product.color}
                  </p>
                  <p className="text-xs font-medium text-[var(--primary)]">₹{product.price.toLocaleString('en-IN')}</p>
                </button>
              )
            })}
          </div>
          {filteredSofas.length === 0 && (
            <p className="text-sm text-[var(--neutral-500)]">No sofas match your search.</p>
          )}
        </>
      )}
      {tab === 'stock' && (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--neutral-400)]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for alternatives..."
              className="w-full pl-10 pr-4 py-2.5 rounded-[var(--radius-md)] border border-[var(--neutral-200)] text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-auto">
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => replaceWith(item.name)}
                className="rounded-[var(--radius-md)] border border-[var(--neutral-200)] p-3 text-left hover:border-[var(--primary)] hover:bg-[var(--neutral-50)] hover:shadow-sm transition-all"
              >
                <div className="aspect-[4/3] rounded-[var(--radius-sm)] bg-[var(--neutral-100)] mb-2 flex items-center justify-center text-[var(--neutral-400)]">
                  <ImagePlus className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-[var(--neutral-900)] truncate">{item.name}</p>
                <p className="text-xs text-[var(--neutral-500)]">{item.category}</p>
              </button>
            ))}
          </div>
        </>
      )}
      {tab === 'upload' && (
        <div className="border-2 border-dashed border-[var(--neutral-300)] rounded-[var(--radius-md)] p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-[var(--neutral-100)] flex items-center justify-center mx-auto mb-3 text-[var(--neutral-500)]">
            <ImagePlus className="w-6 h-6" />
          </div>
          <p className="text-sm text-[var(--neutral-600)] font-medium">Upload an alternative image</p>
          <p className="text-xs text-[var(--neutral-500)] mt-1">Drag & drop or click to upload (mock)</p>
        </div>
      )}
      {tab === 'ai' && (
        <div className="space-y-4">
          {useGemini ? (
            <>
              <p className="text-sm text-[var(--neutral-600)]">
                Describe the replacement (e.g. &quot;Modern grey fabric armchair&quot;, &quot;Oak wood coffee table&quot;). Gemini will generate an image and replace the selected component.
              </p>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. Generate a modern leather sofa in navy blue"
                rows={2}
                className="w-full px-4 py-3 rounded-[var(--radius-md)] border border-[var(--neutral-200)] text-sm placeholder:text-[var(--neutral-400)] focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
                disabled={aiGenerating}
              />
              <button
                type="button"
                onClick={async () => {
                  if (!aiPrompt.trim() || selected.length === 0) return
                  setAiGenerating(true)
                  try {
                    const dataUrl = await geminiGenerateImage(
                      `Product image, isolated on transparent or white background: ${aiPrompt}. High quality, realistic, suitable for interior design.`
                    )
                    setPendingAiReplacement(dataUrl)
                    setPreviewCutoutDataUrl(dataUrl)
                  } catch (e) {
                    addToast(e instanceof Error ? e.message : 'AI generation failed', 'error')
                  } finally {
                    setAiGenerating(false)
                  }
                }}
                disabled={aiGenerating || !aiPrompt.trim() || selected.length === 0}
                className="w-full py-3 rounded-[var(--radius-md)] bg-gradient-to-r from-[var(--secondary)] to-[#7C3AED] text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {aiGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate
                  </>
                )}
              </button>
              {pendingAiReplacement && (
                <button
                  type="button"
                  onClick={() => {
                    replaceWith('AI generated', pendingAiReplacement)
                    setPendingAiReplacement(null)
                    setPreviewCutoutDataUrl(null)
                    setAiPrompt('')
                  }}
                  className="w-full py-3 rounded-[var(--radius-md)] bg-[var(--primary)] text-white font-semibold"
                >
                  Apply to Main Image
                </button>
              )}
            </>
          ) : (
            <div className="border-2 border-dashed border-[var(--neutral-300)] rounded-[var(--radius-md)] p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-[var(--neutral-100)] flex items-center justify-center mx-auto mb-3 text-[var(--neutral-500)]">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-sm text-[var(--neutral-600)] font-medium">AI replace requires API key</p>
              <p className="text-xs text-[var(--neutral-500)] mt-1">Set VITE_IMAGE_GENERATION_API_KEY in .env to use Gemini for AI-generated replacements.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
