import { useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { addToast } from '../components/ToastContainer'
import { compositeComponentsOntoImage, getMaskCoverageInRegion, MIN_MASK_COVERAGE, applyMaterialToCutout } from '../lib/canvasUtils'
import { CutoutPreview } from './CutoutPreview'
import { ComponentInfoCard } from './ComponentInfoCard'
import { SidebarActionBar } from './SidebarActionBar'
import { EditorTabs } from './EditorTabs'

const MATERIAL_IDS = ['wood', 'marble', 'fabric', 'leather', 'metal', 'glass', 'plastic'] as const

function downloadCutout(name: string, cutoutDataUrl: string | null) {
  if (!cutoutDataUrl) return
  const a = document.createElement('a')
  a.href = cutoutDataUrl
  a.download = `${name.replace(/\s+/g, '-').toLowerCase()}-cutout.png`
  a.click()
}

export function EditorSidebar() {
  const { state, dispatch, getSelectedComponents, selectComponent, previewCutoutDataUrl, setPreviewCutoutDataUrl, recordHistory, interactionMode } = useApp()
  const selected = getSelectedComponents()
  const primary = selected[0] ?? null
  const components = state.components
  const activeComponentIds = state.selection.activeComponentIds
  const hasPendingPreview =
    Boolean(previewCutoutDataUrl) &&
    Boolean(primary) &&
    previewCutoutDataUrl !== primary?.cutoutDataUrl

  useEffect(() => {
    setPreviewCutoutDataUrl(null)
  }, [primary?.id, setPreviewCutoutDataUrl])

  const handleDuplicate = () => {
    if (!primary) return
    dispatch({
      type: 'DUPLICATE_COMPONENT',
      payload: primary.id,
    })
    addToast('Component duplicated', 'success')
  }

  const handleResetSelection = () => {
    dispatch({ type: 'DESELECT_ALL' })
    addToast('Selection cleared', 'info')
  }

  const applyPreviewToMainImage = async () => {
    if (!previewCutoutDataUrl || selected.length === 0) return
    const original = state.image.originalDataUrl
    const { width, height } = state.image
    if (!original || !width || !height) return
    if (import.meta.env.DEV) {
      console.log('AI generated image received')
    }
    for (const c of selected) {
      if (c.maskDataUrl) {
        const coverage = await getMaskCoverageInRegion(c.maskDataUrl, c.region, width, height)
        if (coverage < MIN_MASK_COVERAGE) {
          addToast(
            `Object mask covers ${Math.round(coverage * 100)}% of selection (need ≥${Math.round(MIN_MASK_COVERAGE * 100)}%). Use a tighter selection or re-extract the component.`,
            'error'
          )
          return
        }
      }
    }
    recordHistory()
    dispatch({
      type: 'SET_EDITING',
      payload: { isProcessing: true, currentOperation: 'Applying to main image...', progress: 40 },
    })
    const selectedIds = new Set(selected.map((c) => c.id))
    for (const c of selected) {
      if (import.meta.env.DEV) {
        console.log('Applying modification to component:', c.id, 'boundingBox:', c.region)
      }
    }
    // Build scene: base + components with generated image attached to selected; composite using mask + boundingBox.
    const componentsWithPreview = state.components.map((c) =>
      selectedIds.has(c.id)
        ? { cutoutDataUrl: previewCutoutDataUrl, maskDataUrl: c.maskDataUrl, region: c.region }
        : { cutoutDataUrl: c.cutoutDataUrl, maskDataUrl: c.maskDataUrl, region: c.region }
    )
    try {
      const newDisplayUrl = await compositeComponentsOntoImage(original, width, height, componentsWithPreview)
      dispatch({ type: 'SET_DISPLAY_IMAGE', payload: newDisplayUrl })
      const updates = selected.map((c) => ({ id: c.id, cutoutDataUrl: previewCutoutDataUrl }))
      dispatch({ type: 'UPDATE_COMPONENTS_CUTOUTS', payload: updates })
      setPreviewCutoutDataUrl(null)
      if (import.meta.env.DEV) {
        console.log('Scene state updated: component modifiedImage attached, canvas redraw triggered')
      }
      addToast('Applied to main image', 'success')
    } catch (err) {
      console.error('Apply to main image failed', err)
      addToast('Failed to apply to main image', 'error')
    } finally {
      dispatch({
        type: 'SET_EDITING',
        payload: { isProcessing: false, currentOperation: '', progress: 100 },
      })
    }
  }

  return (
    <aside
      style={{
        width: '100%',
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        padding: '24px',
      }}
    >
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          paddingRight: '4px',
        }}
      >
        {/* Component switcher: select which component to edit. Prevents overlay/mask from previous component. */}
        {components.length > 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Select component
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {components.map((c) => {
                const isActive = activeComponentIds.includes(c.id)
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectComponent(c.id)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: isActive ? '2px solid #0ea5e9' : '1px solid #e5e7eb',
                      background: isActive ? '#e0f2fe' : '#ffffff',
                      color: isActive ? '#0369a1' : '#374151',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {c.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* 1. Component Preview */}
        <CutoutPreview component={primary} previewDataUrl={previewCutoutDataUrl} />
        {hasPendingPreview && (
          <button
            type="button"
            onClick={applyPreviewToMainImage}
            style={{
              width: '100%',
              height: '44px',
              border: 'none',
              borderRadius: '10px',
              background: 'linear-gradient(to right, #0ea5e9, #06b6d4)',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(14, 165, 233, 0.28)',
            }}
          >
            Apply To Main Image
          </button>
        )}

        {/* 2. Component Info */}
        <ComponentInfoCard component={primary} />

        {/* 3. Action bar: Download, Duplicate, Delete, Reset */}
        <SidebarActionBar
          onDownloadCutout={() => primary && downloadCutout(primary.name, primary.cutoutDataUrl)}
          onDuplicate={handleDuplicate}
          onDelete={() => primary && dispatch({ type: 'REMOVE_COMPONENT', payload: primary.id })}
          onResetSelection={handleResetSelection}
          disabled={!primary}
        />

        {/* Material panel: when mode is material and component selected */}
        {interactionMode === 'material' && primary?.cutoutDataUrl && (
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
              Material
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {MATERIAL_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={async () => {
                    if (!primary?.cutoutDataUrl) return
                    try {
                      const url = await applyMaterialToCutout(primary.cutoutDataUrl, id)
                      setPreviewCutoutDataUrl(url)
                      addToast(`Preview: ${id}`, 'info')
                    } catch (e) {
                      console.error(e)
                      addToast('Material preview failed', 'error')
                    }
                  }}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    background: '#fff',
                    color: '#374151',
                    fontSize: 13,
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    cursor: 'pointer',
                  }}
                >
                  {id}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 4. Mode tabs + 5. Dynamic content */}
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
          <EditorTabs />
        </div>
      </div>
    </aside>
  )
}
