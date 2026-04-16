/**
 * Versioned localStorage persistence for the room configuration wizard.
 * Large base64 payloads may exceed quota — we degrade gracefully (metadata only).
 */

import type { VastuPreferences } from '@/app/components/VastuQuestionnaire'

export const WIZARD_PERSIST_VERSION = 1 as const
export const WIZARD_STORAGE_KEY = 'ai-room-config-wizard-v1'

/** When false, the wizard does not read/write localStorage — every full reload starts from step 1. */
export const WIZARD_STATE_PERSISTENCE_ENABLED = false

export function clearWizardStateStorage(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(WIZARD_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

/** Mirrors page `ConfigType` without importing page (avoids circular deps). */
export type PersistedConfigType = 'internal' | 'external' | 'vastu' | null

/** Subset of customization store (no functions) for JSON persistence */
export type PersistedCustomizationSlice = {
  selectedElementType: string | null
  customStyles: Record<string, string | null>
  customActions: Record<string, 'edit' | 'add' | 'replace' | 'erase' | null>
  selectedCustomAction: 'edit' | 'add' | 'replace' | 'erase'
  customHistory: Record<string, string | null>[]
  eraseRegionSelection: { x: number; y: number; width: number; height: number } | null
  eraseRegionConfirmed: boolean
  componentEraseAwaitingConfirm: string | null
  externalCustomization: Record<string, string | null>
  selectedExternalCategory: string | null
  externalCustomHistory: Record<string, string | null>[]
}

export type PersistedWizardV1 = {
  v: typeof WIZARD_PERSIST_VERSION
  configType: PersistedConfigType
  configMode: 'purpose' | 'arrangement' | 'customization'
  wizardStep: 1 | 2 | 3 | 4
  layoutReferenceImageIndex: number | null
  images: string[]
  selectedStyle: string | null
  selectedColorPalette: string | null
  fullRoomText: string
  fullRoomReferenceImages: string[]
  vastuEnabled: boolean
  vastuPreferences: VastuPreferences
  generatedImage: string | null
  generatedImageOriginal: string | null
  showWatermark: boolean
  customization: PersistedCustomizationSlice
}

const MAX_SERIALIZE_CHARS = 4_500_000

export function safeParsePersisted(raw: string | null): Partial<PersistedWizardV1> | null {
  if (raw == null || raw === '') return null
  try {
    const data = JSON.parse(raw) as unknown
    if (!data || typeof data !== 'object') return null
    const o = data as { v?: number }
    if (o.v !== WIZARD_PERSIST_VERSION) return null
    return data as Partial<PersistedWizardV1>
  } catch {
    return null
  }
}

export function trySaveWizardState(payload: PersistedWizardV1): void {
  if (typeof window === 'undefined' || !WIZARD_STATE_PERSISTENCE_ENABLED) return
  try {
    let json = JSON.stringify(payload)
    if (json.length > MAX_SERIALIZE_CHARS) {
      json = JSON.stringify({
        ...payload,
        images: [],
        fullRoomReferenceImages: [],
        generatedImage: null,
        generatedImageOriginal: null,
        _truncated: true,
      } satisfies PersistedWizardV1 & { _truncated?: boolean })
    }
    window.localStorage.setItem(WIZARD_STORAGE_KEY, json)
  } catch {
    try {
      const minimal: PersistedWizardV1 = {
        ...payload,
        images: [],
        fullRoomReferenceImages: [],
        generatedImage: null,
        generatedImageOriginal: null,
      }
      window.localStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify({ ...minimal, _truncated: true }))
    } catch {
      /* ignore quota */
    }
  }
}

export function loadWizardStateRaw(): string | null {
  if (typeof window === 'undefined' || !WIZARD_STATE_PERSISTENCE_ENABLED) return null
  try {
    return window.localStorage.getItem(WIZARD_STORAGE_KEY)
  } catch {
    return null
  }
}

/**
 * After hydrate, align step + layout index with real data. Prevents "stuck" on layout/configure
 * when images were dropped (localStorage quota) but metadata (step, style) was kept.
 */
export function reconcilePersistedWizardUI(
  configType: PersistedConfigType,
  wizardStep: 1 | 2 | 3 | 4 | null | undefined,
  images: string[] | null | undefined,
  layoutReferenceImageIndex: number | null | undefined
): { wizardStep: 1 | 2 | 3 | 4; layoutReferenceImageIndex: number | null } {
  const stepIn = (wizardStep ?? 1) as 1 | 2 | 3 | 4
  const imgs = images ?? []

  if (configType == null) {
    return { wizardStep: 1, layoutReferenceImageIndex: null }
  }

  const minImages = configType === 'external' ? 3 : 4

  let layout = layoutReferenceImageIndex ?? null
  if (layout != null && (layout < 0 || layout >= imgs.length)) {
    layout = null
  }

  if (imgs.length < minImages) {
    if (imgs.length === 0) layout = null
    const wizardStepOut = stepIn > 2 ? 2 : stepIn
    return { wizardStep: wizardStepOut, layoutReferenceImageIndex: layout }
  }

  if (layout == null && stepIn > 3) {
    return { wizardStep: 3, layoutReferenceImageIndex: null }
  }

  return { wizardStep: stepIn, layoutReferenceImageIndex: layout }
}
