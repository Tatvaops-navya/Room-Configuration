'use client'

import { useEffect } from 'react'
import { useRoomEditorStore } from '@/app/lib/room-editor/roomEditorStore'
import type { CustomAction } from '@/app/hooks/useCustomization'

/**
 * Keeps lift-style Add/Replace/Erase canvas aligned with the current result or locked layout.
 */
export function useRoomEditorImageSync(params: {
  selectedCustomAction: CustomAction
  generatedImage: string | null
  generatedImageOriginal: string | null
  lockedLayoutImage: string | null
}) {
  const { selectedCustomAction, generatedImage, generatedImageOriginal, lockedLayoutImage } = params
  useEffect(() => {
    if (selectedCustomAction !== 'add' && selectedCustomAction !== 'replace' && selectedCustomAction !== 'erase') return
    const fromResult = generatedImageOriginal ?? generatedImage
    const base = (typeof fromResult === 'string' && fromResult ? fromResult : null) ?? lockedLayoutImage
    if (!base) return
    const s = useRoomEditorStore.getState()
    s.setOriginalImage(base)
    s.setWorkingImage(base)
    s.setSelection(null)
    s.setPreviewImage(null)
    s.setPreviewCutoutDataUrl(null)
  }, [generatedImage, generatedImageOriginal, selectedCustomAction, lockedLayoutImage])
}
