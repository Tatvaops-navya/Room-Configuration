'use client'

import { create } from 'zustand'
import type { Dispatch, SetStateAction } from 'react'
import type { EraseRegion } from '@/app/components/EraseRegionSelector'
import type { ExternalCategory, ExternalCustomizationState } from '@/app/utils/externalCustomizationPresets'
import { getInitialExternalCustomization } from '@/app/utils/externalCustomizationPresets'

export type CustomAction = 'edit' | 'add' | 'replace' | 'erase'

type SetRecord = Dispatch<SetStateAction<Record<string, string | null>>>
type SetExtHist = Dispatch<SetStateAction<ExternalCustomizationState[]>>

export interface CustomizationStoreState {
  selectedElementType: string | null
  setSelectedElementType: (v: string | null | ((prev: string | null) => string | null)) => void
  customStyles: Record<string, string | null>
  setCustomStyles: SetRecord
  customActions: Record<string, CustomAction | null>
  setCustomActions: Dispatch<SetStateAction<Record<string, CustomAction | null>>>
  selectedCustomAction: CustomAction
  setSelectedCustomAction: (v: CustomAction | ((prev: CustomAction) => CustomAction)) => void
  customHistory: Record<string, string | null>[]
  setCustomHistory: Dispatch<SetStateAction<Record<string, string | null>[]>>
  eraseRegionSelection: EraseRegion | null
  setEraseRegionSelection: (v: EraseRegion | null | ((prev: EraseRegion | null) => EraseRegion | null)) => void
  eraseRegionConfirmed: boolean
  setEraseRegionConfirmed: (v: boolean | ((prev: boolean) => boolean)) => void
  componentEraseAwaitingConfirm: string | null
  setComponentEraseAwaitingConfirm: (v: string | null | ((prev: string | null) => string | null)) => void
  externalCustomization: ExternalCustomizationState
  setExternalCustomization: Dispatch<SetStateAction<ExternalCustomizationState>>
  selectedExternalCategory: ExternalCategory | null
  setSelectedExternalCategory: (
    v: ExternalCategory | null | ((prev: ExternalCategory | null) => ExternalCategory | null)
  ) => void
  externalCustomHistory: ExternalCustomizationState[]
  setExternalCustomHistory: SetExtHist
  resetCustomization: () => void
}

const initialCustomization = (): Pick<
  CustomizationStoreState,
  | 'selectedElementType'
  | 'customStyles'
  | 'customActions'
  | 'selectedCustomAction'
  | 'customHistory'
  | 'eraseRegionSelection'
  | 'eraseRegionConfirmed'
  | 'componentEraseAwaitingConfirm'
  | 'externalCustomization'
  | 'selectedExternalCategory'
  | 'externalCustomHistory'
> => ({
  selectedElementType: null,
  customStyles: {},
  customActions: {},
  selectedCustomAction: 'edit',
  customHistory: [],
  eraseRegionSelection: null,
  eraseRegionConfirmed: false,
  componentEraseAwaitingConfirm: null,
  externalCustomization: getInitialExternalCustomization(),
  selectedExternalCategory: null,
  externalCustomHistory: [],
})

export const useCustomizationStore = create<CustomizationStoreState>((set) => ({
  ...initialCustomization(),
  setSelectedElementType: (v) =>
    set((s) => ({ selectedElementType: typeof v === 'function' ? (v as (p: string | null) => string | null)(s.selectedElementType) : v })),
  setCustomStyles: (updater) =>
    set((s) => ({
      customStyles: typeof updater === 'function' ? (updater as (p: Record<string, string | null>) => Record<string, string | null>)(s.customStyles) : updater,
    })),
  setCustomActions: (updater) =>
    set((s) => ({
      customActions:
        typeof updater === 'function'
          ? (updater as (p: Record<string, CustomAction | null>) => Record<string, CustomAction | null>)(s.customActions)
          : updater,
    })),
  setSelectedCustomAction: (v) =>
    set((s) => ({
      selectedCustomAction: typeof v === 'function' ? (v as (p: CustomAction) => CustomAction)(s.selectedCustomAction) : v,
    })),
  setCustomHistory: (updater) =>
    set((s) => ({
      customHistory: typeof updater === 'function' ? (updater as (p: Record<string, string | null>[]) => Record<string, string | null>[])(s.customHistory) : updater,
    })),
  setEraseRegionSelection: (v) =>
    set((s) => ({
      eraseRegionSelection:
        typeof v === 'function' ? (v as (p: EraseRegion | null) => EraseRegion | null)(s.eraseRegionSelection) : v,
    })),
  setEraseRegionConfirmed: (v) =>
    set((s) => ({
      eraseRegionConfirmed: typeof v === 'function' ? (v as (p: boolean) => boolean)(s.eraseRegionConfirmed) : v,
    })),
  setComponentEraseAwaitingConfirm: (v) =>
    set((s) => ({
      componentEraseAwaitingConfirm:
        typeof v === 'function'
          ? (v as (p: string | null) => string | null)(s.componentEraseAwaitingConfirm)
          : v,
    })),
  setExternalCustomization: (updater) =>
    set((s) => ({
      externalCustomization:
        typeof updater === 'function'
          ? (updater as (p: ExternalCustomizationState) => ExternalCustomizationState)(s.externalCustomization)
          : updater,
    })),
  setSelectedExternalCategory: (v) =>
    set((s) => ({
      selectedExternalCategory:
        typeof v === 'function'
          ? (v as (p: ExternalCategory | null) => ExternalCategory | null)(s.selectedExternalCategory)
          : v,
    })),
  setExternalCustomHistory: (updater) =>
    set((s) => ({
      externalCustomHistory:
        typeof updater === 'function'
          ? (updater as (p: ExternalCustomizationState[]) => ExternalCustomizationState[])(s.externalCustomHistory)
          : updater,
    })),
  resetCustomization: () => set(initialCustomization()),
}))
