'use client'

import { useRoomEditorStore } from './roomEditorStore'
import {
  editRegion,
  eraseRegion,
  editCutout,
} from './roomEditorApi'
import { compositeCutoutsOntoImage } from './cutoutUtils'
import { isEffectivelyFullImageSelection } from './maskUtils'
import { getPaletteInstruction } from '@/app/utils/promptBuilder'
import { buildEditCatalogPrompt } from './editCatalogPrompt'
import { buildReplaceWithPhrase } from './replacePrompt'

function getImageDimensions(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
    img.onerror = reject
    img.src = dataUrl
  })
}

function buildPreviewPrompt(): string {
  const {
    mode,
    editOptions,
    activeEditTab,
    addOption,
    replaceOption,
  } = useRoomEditorStore.getState()
  const parts: string[] = []
  if (mode === 'edit') {
    const ce = editOptions.catalogEdit
    if (ce) {
      return buildEditCatalogPrompt({
        componentLabel: ce.componentLabel,
        variationLabel: ce.variationLabel,
        variationDescription: ce.variationDescription,
      })
    }
    if (editOptions.text?.trim()) {
      return `${editOptions.text.trim()} Apply only where relevant; keep all other areas of the room unchanged. Photorealistic, consistent lighting.`
    }
    if (activeEditTab === 'preset') {
      if (editOptions.selectedStyleId) {
        const styleName =
          editOptions.selectedStyleId.charAt(0).toUpperCase() +
          editOptions.selectedStyleId.slice(1).replace(/_/g, ' ')
        parts.push(`Apply ${styleName} style to the selected region`)
      }
      if (editOptions.selectedColorPaletteId) {
        parts.push(getPaletteInstruction(editOptions.selectedColorPaletteId))
      }
      if (editOptions.color) parts.push(`Change color to ${editOptions.color}`)
      if (editOptions.material) parts.push(`Change material to ${editOptions.material}`)
      if (editOptions.style) parts.push(`Apply style: ${editOptions.style}`)
    }
    if (activeEditTab === 'replace') {
      parts.push(
        buildReplaceWithPhrase(editOptions.replacementText, editOptions.replacementPresetId)
      )
    }
  }
  if (mode === 'replace') {
    return buildReplaceWithPhrase(replaceOption.text, replaceOption.presetId)
  }
  if (mode === 'add') {
    const t = addOption.text || addOption.presetId || 'a new object'
    parts.push(
      `Change only the selected area in this interior photo to add: ${t}. Keep every other surface, object, layout, and lighting unchanged. Photorealistic, seamless blend.`
    )
  }
  if (mode === 'erase') {
    parts.push('Remove the selected object and naturally fill the area')
  }
  return parts.filter(Boolean).join('. ') || (mode === 'erase' ? 'Remove this object' : 'Modify the selected region')
}

/** Shared by PreviewPanel and side-panel action buttons (Add / Replace / Erase). */
export async function runRoomEditorPreview(): Promise<void> {
  const {
    workingImage,
    selection,
    mode,
    setPreviewImage,
  } = useRoomEditorStore.getState()

  if (!workingImage || !selection?.maskDataUrl) {
    const msg =
      mode === 'add'
        ? 'Please select an area to place the object.'
        : 'Select an area on the image first.'
    useRoomEditorStore.setState({ previewError: msg, previewLoading: false })
    return
  }

  if (
    mode === 'add' &&
    selection.boundingBox &&
    isEffectivelyFullImageSelection(selection.boundingBox)
  ) {
    useRoomEditorStore.setState({
      previewError:
        'Please select a smaller area on the image where the object should go (not the entire room).',
      previewLoading: false,
    })
    return
  }

  if (mode === 'add') {
    const { addOption } = useRoomEditorStore.getState()
    const hasIntent = Boolean(addOption.text?.trim() || addOption.presetId)
    if (!hasIntent) {
      useRoomEditorStore.setState({
        previewError: 'Choose a preset, catalog item, or type what to add before generating.',
        previewLoading: false,
      })
      return
    }
  }

  useRoomEditorStore.setState({ previewLoading: true, previewError: null })
  const prompt = buildPreviewPrompt()

  const cutoutUrl = selection.cutoutDataUrl
  const regionPx = selection.regionPx
  // Catalog / AI edit uses masked inpaint via `editRegion` → `/api/edit` (same as replace).
  // Optional cutout path is edit-only (lift-subject style). Replace always uses `editRegion` like
  // normal edit — only the mask differs (user-selected region vs full-frame after Confirm).
  const useCutoutFlow =
    mode === 'edit' && Boolean(cutoutUrl && regionPx && selection.maskDataUrl && prompt)

  try {
    if (useCutoutFlow && cutoutUrl && regionPx) {
      const cutoutResult = await editCutout(cutoutUrl, prompt)
      if (!cutoutResult.ok) {
        useRoomEditorStore.setState({ previewError: cutoutResult.error, previewLoading: false })
        return
      }
      const { w, h } = await getImageDimensions(workingImage)
      const composited = await compositeCutoutsOntoImage(workingImage, w, h, [
        {
          cutoutDataUrl: cutoutResult.imageUrl,
          maskDataUrl: selection.maskDataUrl!,
          region: regionPx,
        },
      ])
      setPreviewImage(composited)
      useRoomEditorStore.setState({ previewLoading: false })
      return
    }

    let result
    // Edit/Replace/Add now share the same placement path (`editRegion` inpaint).
    // Difference is only the mask source:
    // - edit: usually full-frame/object workflow
    // - replace/add: user-selected region
    if (mode === 'edit' || mode === 'replace' || mode === 'add') {
      result = await editRegion(workingImage, selection.maskDataUrl, prompt || undefined)
    } else if (mode === 'erase') {
      result = await eraseRegion(workingImage, selection.maskDataUrl)
    } else {
      useRoomEditorStore.setState({ previewLoading: false })
      return
    }

    if (result.ok) {
      setPreviewImage(result.imageUrl)
      useRoomEditorStore.setState({ previewLoading: false })
    } else {
      useRoomEditorStore.setState({ previewError: result.error, previewLoading: false })
    }
  } catch (err) {
    useRoomEditorStore.setState({
      previewError: err instanceof Error ? err.message : 'Preview failed',
      previewLoading: false,
    })
  }
}
