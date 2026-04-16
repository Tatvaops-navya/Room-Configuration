import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { applyVariationTintToDataUrl, cropToDataUrl, segmentObjectInCrop, featherMaskAlpha, applyCachedMaskToCrop, applyCachedMaskToFullImage, loadCatalogImageForReplacement } from '../../lib/canvasUtils'
import {
  transformComponentWithPreset,
  isImageModelConfigured,
} from '../../lib/imageModelApi'
import { isGeminiConfigured, geminiEditImage } from '../../lib/geminiApi'
import { buildPresetPrompt } from '../../lib/imageModelApi'
import {
  getVariationsByComponentType,
  COMPONENT_TYPE_LABELS,
  COLOR_SWATCH_HEX,
  getStyleName,
} from '../../data/productVariations'
import { SOFA_DATABASE } from '../../data/sofaDatabase'
import type { ComponentType, ProductVariation } from '../../types'
import { addToast } from '../ToastContainer'
import { RotateCcw, Loader2, Check, Sofa } from 'lucide-react'

export function PresetGrid() {
  const { state, dispatch, getSelectedComponents, previewCutoutDataUrl, setPreviewCutoutDataUrl } = useApp()
  const selected = getSelectedComponents()
  const [applyingVariationCode, setApplyingVariationCode] = useState<string | null>(null)
  const [pendingVariation, setPendingVariation] = useState<ProductVariation | null>(null)
  const [catalogLoadingId, setCatalogLoadingId] = useState<string | null>(null)
  const [catalogSearch, setCatalogSearch] = useState('')

  const componentType = selected[0]?.componentType
  const primary = selected[0] ?? null
  const filteredSofas = SOFA_DATABASE.filter(
    (s) =>
      !catalogSearch.trim() ||
      s.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      s.brand.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      s.color.toLowerCase().includes(catalogSearch.toLowerCase())
  )
  const variations = componentType ? getVariationsByComponentType(componentType) : []
  const appliedVariation = selected[0]?.appliedVariation

  const setComponentType = (type: ComponentType) => {
    setPendingVariation(null)
    setPreviewCutoutDataUrl(null)
    for (const comp of selected) {
      dispatch({
        type: 'UPDATE_COMPONENT',
        payload: { id: comp.id, updates: { componentType: type, appliedVariation: undefined } },
      })
    }
    addToast(`Set type to ${COMPONENT_TYPE_LABELS[type]}`, 'success')
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

  const runApplyVariation = async (variation: ProductVariation) => {
    if (!selected.length) return
    setApplyingVariationCode(variation.variationCode)
    try {
      const useGemini = isGeminiConfigured()
      const useImageModel = isImageModelConfigured()
      const comp = selected[0]
      const source = previewCutoutDataUrl || comp?.cutoutDataUrl || state.image.originalDataUrl
      if (!source) return
      let result: string
      if (useGemini) {
        result = await geminiEditImage(source, buildPresetPrompt(variation))
      } else if (useImageModel) {
        result = await transformComponentWithPreset(source, variation)
      } else {
        result = await applyVariationTintToDataUrl(source, variation.color, variation.finish)
      }
      setPreviewCutoutDataUrl(result)
      addToast(
        useGemini
          ? `Preview ready: ${variation.color} · ${variation.finish} (Gemini)`
          : useImageModel
            ? `Preview ready: ${variation.color} · ${variation.finish} (image model)`
            : `Preview ready: ${variation.color} · ${variation.finish}`,
        'info'
      )
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to apply preset'
      addToast(message, 'error')
    } finally {
      setApplyingVariationCode(null)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-[var(--neutral-700)] mb-2">
          Component type
        </label>
        <select
          value={componentType ?? ''}
          onChange={(e) =>
            setComponentType((e.target.value || undefined) as ComponentType)
          }
          className="w-full px-3 py-2.5 rounded-[var(--radius-sm)] border border-[var(--neutral-200)] bg-white text-[var(--neutral-900)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
        >
          <option value="">Select type…</option>
          {(Object.keys(COMPONENT_TYPE_LABELS) as ComponentType[]).map((t) => (
            <option key={t} value={t}>
              {COMPONENT_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <p className="text-xs text-[var(--neutral-500)] mt-1">
          Match the extracted object to see material options.
        </p>
      </div>

      {!componentType ? (
        <div className="py-6 text-center rounded-[var(--radius-md)] bg-[var(--neutral-50)] border border-[var(--neutral-200)]">
          <p className="text-sm text-[var(--neutral-500)]">
            Select a component type above to load material presets.
          </p>
        </div>
      ) : (
        <div>
          <h3 className="text-sm font-semibold text-[var(--neutral-800)] mb-1">
            {COMPONENT_TYPE_LABELS[componentType]} – pick a style
          </h3>
          <p className="text-xs text-[var(--neutral-500)] mb-3">
            Only the selected component will be reconfigured (color, material, texture). The rest of the room stays unchanged.
          </p>
          <div className="border border-[var(--neutral-200)] rounded-[var(--radius-md)] overflow-hidden">
            <div className="max-h-[320px] overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[var(--neutral-50)] border-b border-[var(--neutral-200)] z-10">
                  <tr>
                    <th className="px-3 py-2.5 text-xs font-semibold text-[var(--neutral-600)] uppercase tracking-wider w-10">
                      Color
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-[var(--neutral-600)] uppercase tracking-wider">
                      Style name
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-[var(--neutral-600)] uppercase tracking-wider">
                      Material
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-[var(--neutral-600)] uppercase tracking-wider">
                      Texture
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-[var(--neutral-600)] uppercase tracking-wider w-20 text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {variations.map((v) => {
                    const isApplying = applyingVariationCode === v.variationCode
                    const isApplied = appliedVariation?.variationCode === v.variationCode
                    const isPending = pendingVariation?.variationCode === v.variationCode
                    const swatchHex = COLOR_SWATCH_HEX[v.color] ?? '#e5e7eb'
                    return (
                      <tr
                        key={v.variationCode}
                        className={`
                          border-b border-[var(--neutral-100)] last:border-b-0
                          ${isApplied ? 'bg-[var(--primary-light)]' : isPending ? 'bg-[var(--neutral-100)]' : ''}
                          hover:bg-[var(--neutral-50)]
                        `}
                      >
                        <td className="px-3 py-2 align-middle">
                          <div
                            className="w-7 h-7 rounded-md border border-[var(--neutral-300)] shrink-0"
                            style={{ backgroundColor: swatchHex }}
                            title={v.color}
                          />
                        </td>
                        <td className="px-3 py-2 text-sm text-[var(--neutral-900)]">
                          {getStyleName(v)}
                        </td>
                        <td className="px-3 py-2 text-sm text-[var(--neutral-700)]">
                          {v.material}
                        </td>
                        <td className="px-3 py-2 text-sm text-[var(--neutral-700)]">
                          {v.texture}
                        </td>
                        <td className="px-3 py-2 text-right align-middle">
                          <button
                            type="button"
                            disabled={!!applyingVariationCode}
                            onClick={() => setPendingVariation(isPending ? null : v)}
                            className={`
                              inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium transition-colors
                              ${isApplied
                                ? 'bg-[var(--primary)] text-white cursor-default'
                                : isPending
                                  ? 'bg-[var(--primary)] text-white ring-2 ring-[var(--primary)] ring-offset-1'
                                  : 'bg-[var(--neutral-100)] text-[var(--neutral-800)] hover:bg-[var(--primary)] hover:text-white'}
                              disabled:opacity-60 disabled:pointer-events-none
                            `}
                          >
                            {isApplying ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : isApplied ? (
                              'Applied'
                            ) : isPending ? (
                              'Selected'
                            ) : (
                              'Select'
                            )}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
          {pendingVariation && (
            <button
              type="button"
              onClick={() => runApplyVariation(pendingVariation)}
              disabled={!!applyingVariationCode}
              className="w-full mt-3 py-3 rounded-[var(--radius-md)] bg-[var(--primary)] text-white font-semibold text-sm hover:bg-[var(--primary-dark)] disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-sm"
            >
              {applyingVariationCode ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Preparing preview…
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Preview {pendingVariation.color} · {pendingVariation.finish}
                </>
              )}
            </button>
          )}

          {componentType === 'sofa' && (
            <div className="mt-6 pt-5 border-t border-[var(--neutral-200)]">
              <h3 className="text-sm font-semibold text-[var(--neutral-800)] mb-1">
                Sofa database – replace with a product
              </h3>
              <p className="text-xs text-[var(--neutral-500)] mb-3">
                Pick a sofa from the catalog. The image background is removed so only the sofa is placed; only the selected region is updated. For best results, select the object you want to replace (e.g. existing sofa). Then click <strong>Apply to Main Image</strong> above.
              </p>
              <input
                type="search"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Search by name, brand, colour..."
                className="w-full mb-3 px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--neutral-200)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
              <div className="grid grid-cols-2 gap-2 max-h-[280px] overflow-auto">
                {filteredSofas.map((product) => {
                  const isLoading = catalogLoadingId === product.id
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => selectSofaFromCatalog(product)}
                      disabled={isLoading}
                      className="rounded-[var(--radius-md)] border border-[var(--neutral-200)] p-2 text-left hover:border-[var(--primary)] hover:bg-[var(--neutral-50)] transition-all disabled:opacity-70"
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
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setPendingVariation(null)
          setPreviewCutoutDataUrl(null)
          for (const comp of selected) {
            const original = state.image.originalDataUrl
            if (!original) continue
            const applyReset = (url: string) => {
              dispatch({
                type: 'UPDATE_COMPONENT_CUTOUT',
                payload: { id: comp.id, cutoutDataUrl: url },
              })
              dispatch({
                type: 'UPDATE_COMPONENT',
                payload: {
                  id: comp.id,
                  updates: { modifications: {}, appliedVariation: undefined },
                },
              })
            }
            if (comp.maskDataUrl) {
              applyCachedMaskToFullImage(original, comp.maskDataUrl)
                .then((fullUrl) => cropToDataUrl(fullUrl, comp.region))
                .then((cropped) => featherMaskAlpha(cropped, 2))
                .then(applyReset)
                .catch(() => {
                  cropToDataUrl(original, comp.region)
                    .then((cropUrl) =>
                      applyCachedMaskToCrop(cropUrl, comp.maskDataUrl!).then((u) => featherMaskAlpha(u, 2))
                    )
                    .then(applyReset)
                })
            } else {
              cropToDataUrl(original, comp.region)
                .then((cropUrl) =>
                  segmentObjectInCrop(cropUrl, comp.region.width / 2, comp.region.height / 2).then((u) =>
                    featherMaskAlpha(u, 2)
                  )
                )
                .then(applyReset)
            }
          }
          addToast('Reset to original', 'info')
        }}
        className="w-full py-2.5 rounded-[var(--radius-sm)] border border-[var(--neutral-200)] text-sm font-medium text-[var(--neutral-700)] hover:bg-[var(--neutral-50)] hover:border-[var(--neutral-300)] transition-colors flex items-center justify-center gap-2"
      >
        <RotateCcw className="w-4 h-4" />
        Reset to Original
      </button>
    </div>
  )
}
