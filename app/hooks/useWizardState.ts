'use client'

import { useEffect, useRef, type DependencyList } from 'react'
import { useCustomizationStore } from '@/app/store/useCustomizationStore'
import type { ConfigType } from '@/app/types/config'
import {
  clearWizardStateStorage,
  loadWizardStateRaw,
  reconcilePersistedWizardUI,
  safeParsePersisted,
  trySaveWizardState,
  type PersistedConfigType,
  type PersistedWizardV1,
  WIZARD_PERSIST_VERSION,
  WIZARD_STATE_PERSISTENCE_ENABLED,
} from '@/app/utils/persistState'
import type { VastuPreferences } from '@/app/components/VastuQuestionnaire'
import type { ExternalCategory, ExternalCustomizationState } from '@/app/utils/externalCustomizationPresets'

type HydrationApplier = {
  setConfigType: (v: ConfigType) => void
  setConfigMode: (v: 'purpose' | 'arrangement' | 'customization') => void
  setWizardStep: (v: 1 | 2 | 3 | 4) => void
  setLayoutReferenceImageIndex: (v: number | null) => void
  setImages: (v: string[]) => void
  setSelectedStyle: (v: string | null) => void
  setSelectedColorPalette: (v: string | null) => void
  setFullRoomText: (v: string) => void
  setFullRoomReferenceImages: (v: string[]) => void
  setVastuEnabled: (v: boolean) => void
  setVastuPreferences: (v: VastuPreferences) => void
  setGeneratedImage: (v: string | null) => void
  setGeneratedImageOriginal: (v: string | null) => void
  setShowWatermark: (v: boolean) => void
}

function customizationToPersist(): PersistedWizardV1['customization'] {
  const s = useCustomizationStore.getState()
  return {
    selectedElementType: s.selectedElementType,
    customStyles: { ...s.customStyles },
    customActions: { ...s.customActions },
    selectedCustomAction: s.selectedCustomAction,
    customHistory: s.customHistory.map((h) => ({ ...h })),
    eraseRegionSelection: s.eraseRegionSelection ? { ...s.eraseRegionSelection } : null,
    eraseRegionConfirmed: s.eraseRegionConfirmed,
    componentEraseAwaitingConfirm: s.componentEraseAwaitingConfirm,
    externalCustomization: { ...s.externalCustomization },
    selectedExternalCategory: s.selectedExternalCategory,
    externalCustomHistory: s.externalCustomHistory.map((h) => ({ ...h })),
  }
}

function applyCustomizationHydrate(c: PersistedWizardV1['customization']) {
  useCustomizationStore.setState({
    selectedElementType: c.selectedElementType,
    customStyles: { ...c.customStyles },
    customActions: { ...c.customActions },
    selectedCustomAction: c.selectedCustomAction,
    customHistory: c.customHistory.map((h) => ({ ...h })),
    eraseRegionSelection: c.eraseRegionSelection ? { ...c.eraseRegionSelection } : null,
    eraseRegionConfirmed: c.eraseRegionConfirmed,
    componentEraseAwaitingConfirm: c.componentEraseAwaitingConfirm,
    externalCustomization: c.externalCustomization as ExternalCustomizationState,
    selectedExternalCategory: c.selectedExternalCategory as ExternalCategory | null,
    externalCustomHistory: c.externalCustomHistory as ExternalCustomizationState[],
  })
}

export type WizardStatePersistenceOptions = {
  apply: HydrationApplier
  deps: DependencyList
  getSnapshot: () => Omit<PersistedWizardV1, 'v' | 'customization'>
}

/**
 * When persistence is on: one-time hydrate from localStorage + debounced save.
 * When off: clears any old key and does not restore. Does not call generate APIs.
 */
export function useWizardState(options: WizardStatePersistenceOptions) {
  const { apply, deps, getSnapshot } = options
  const hydratedRef = useRef(false)
  const skipSaveRef = useRef(true)
  const getSnapshotRef = useRef(getSnapshot)
  getSnapshotRef.current = getSnapshot

  useEffect(() => {
    if (hydratedRef.current) return
    hydratedRef.current = true
    if (!WIZARD_STATE_PERSISTENCE_ENABLED) {
      clearWizardStateStorage()
      skipSaveRef.current = false
      return
    }
    const raw = loadWizardStateRaw()
    const data = safeParsePersisted(raw)
    if (!data || data.v !== WIZARD_PERSIST_VERSION) {
      skipSaveRef.current = false
      return
    }
    if (data.configType != null) apply.setConfigType(data.configType as ConfigType)
    if (data.configMode != null) apply.setConfigMode(data.configMode)
    if (data.images != null) apply.setImages(data.images)
    const reconciled = reconcilePersistedWizardUI(
      (data.configType ?? null) as PersistedConfigType,
      data.wizardStep ?? 1,
      data.images ?? [],
      data.layoutReferenceImageIndex
    )
    apply.setLayoutReferenceImageIndex(reconciled.layoutReferenceImageIndex)
    apply.setWizardStep(reconciled.wizardStep)
    if (data.selectedStyle !== undefined) apply.setSelectedStyle(data.selectedStyle ?? null)
    if (data.selectedColorPalette !== undefined) apply.setSelectedColorPalette(data.selectedColorPalette ?? null)
    if (data.fullRoomText != null) apply.setFullRoomText(data.fullRoomText)
    if (data.fullRoomReferenceImages != null) apply.setFullRoomReferenceImages(data.fullRoomReferenceImages)
    if (data.vastuEnabled != null) apply.setVastuEnabled(data.vastuEnabled)
    if (data.vastuPreferences != null) apply.setVastuPreferences(data.vastuPreferences)
    if (data.generatedImage !== undefined) apply.setGeneratedImage(data.generatedImage ?? null)
    if (data.generatedImageOriginal !== undefined) {
      apply.setGeneratedImageOriginal(data.generatedImageOriginal ?? null)
    }
    if (data.showWatermark != null) apply.setShowWatermark(data.showWatermark)
    if (data.customization != null) applyCustomizationHydrate(data.customization)
    skipSaveRef.current = false
  }, [])

  useEffect(() => {
    if (!WIZARD_STATE_PERSISTENCE_ENABLED || skipSaveRef.current) return
    const t = window.setTimeout(() => {
      const base = getSnapshotRef.current()
      trySaveWizardState({
        v: WIZARD_PERSIST_VERSION,
        ...base,
        customization: customizationToPersist(),
      })
    }, 900)
    return () => window.clearTimeout(t)
  }, deps)
}
