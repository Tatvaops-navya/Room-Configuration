'use client'

import { useCustomizationStore } from '@/app/store/useCustomizationStore'

export type { CustomAction } from '@/app/store/useCustomizationStore'

/**
 * Single source of truth for wizard + post-result customization selections.
 * Subscribes with per-field selectors so unrelated updates minimize re-renders.
 */
export function useCustomization() {
  const selectedElementType = useCustomizationStore((s) => s.selectedElementType)
  const setSelectedElementType = useCustomizationStore((s) => s.setSelectedElementType)
  const customStyles = useCustomizationStore((s) => s.customStyles)
  const setCustomStyles = useCustomizationStore((s) => s.setCustomStyles)
  const customActions = useCustomizationStore((s) => s.customActions)
  const setCustomActions = useCustomizationStore((s) => s.setCustomActions)
  const selectedCustomAction = useCustomizationStore((s) => s.selectedCustomAction)
  const setSelectedCustomAction = useCustomizationStore((s) => s.setSelectedCustomAction)
  const customHistory = useCustomizationStore((s) => s.customHistory)
  const setCustomHistory = useCustomizationStore((s) => s.setCustomHistory)
  const eraseRegionSelection = useCustomizationStore((s) => s.eraseRegionSelection)
  const setEraseRegionSelection = useCustomizationStore((s) => s.setEraseRegionSelection)
  const eraseRegionConfirmed = useCustomizationStore((s) => s.eraseRegionConfirmed)
  const setEraseRegionConfirmed = useCustomizationStore((s) => s.setEraseRegionConfirmed)
  const componentEraseAwaitingConfirm = useCustomizationStore((s) => s.componentEraseAwaitingConfirm)
  const setComponentEraseAwaitingConfirm = useCustomizationStore((s) => s.setComponentEraseAwaitingConfirm)
  const externalCustomization = useCustomizationStore((s) => s.externalCustomization)
  const setExternalCustomization = useCustomizationStore((s) => s.setExternalCustomization)
  const selectedExternalCategory = useCustomizationStore((s) => s.selectedExternalCategory)
  const setSelectedExternalCategory = useCustomizationStore((s) => s.setSelectedExternalCategory)
  const externalCustomHistory = useCustomizationStore((s) => s.externalCustomHistory)
  const setExternalCustomHistory = useCustomizationStore((s) => s.setExternalCustomHistory)
  const resetCustomization = useCustomizationStore((s) => s.resetCustomization)

  return {
    selectedElementType,
    setSelectedElementType,
    customStyles,
    setCustomStyles,
    customActions,
    setCustomActions,
    selectedCustomAction,
    setSelectedCustomAction,
    customHistory,
    setCustomHistory,
    eraseRegionSelection,
    setEraseRegionSelection,
    eraseRegionConfirmed,
    setEraseRegionConfirmed,
    componentEraseAwaitingConfirm,
    setComponentEraseAwaitingConfirm,
    externalCustomization,
    setExternalCustomization,
    selectedExternalCategory,
    setSelectedExternalCategory,
    externalCustomHistory,
    setExternalCustomHistory,
    resetCustomization,
  }
}
