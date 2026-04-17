'use client'

import { create } from 'zustand'
import { createFullWhiteMaskDataUrl } from './maskUtils'
import { mergeEditComponentList } from './editCatalogUtils'
import type {
  EditorMode,
  Selection,
  SelectionMode,
  EditTab,
  EditAttributeTab,
  CatalogVariation,
} from './types'

export interface RoomEditorState {
  mode: EditorMode
  /** Lift Subject–style: rectangle (draw box), click (point→SAM), hover, auto. */
  selectionMode: SelectionMode
  selection: Selection | null
  /** Preview cutout before Apply (for Preset/AI/Replace edits). */
  previewCutoutDataUrl: string | null
  /** Base image (current result) — never mutated. */
  originalImage: string | null
  /** Last confirmed state; never modified without explicit Apply. */
  workingImage: string | null
  /** Temporary modified image shown before Apply. */
  previewImage: string | null
  /** Last confirmed states for undo. */
  undoStack: string[]
  /** States restored by undo, for redo. */
  redoStack: string[]
  /** Edit mode options (color, material, style, palette, etc.). */
  editOptions: {
    color?: string
    material?: string
    style?: string
    text?: string
    /** Style id from StyleSelector (e.g. 'modern', 'minimalist') */
    selectedStyleId?: string
    /** Color palette id from ColorPaletteSelector (e.g. 'forest_inspired') */
    selectedColorPaletteId?: string
    /** Replace tab: preset id and description */
    replacementPresetId?: string
    replacementText?: string
    /** After Confirm in catalog edit: drives inpaint prompt */
    catalogEdit?: {
      apiComponent: string
      componentLabel: string
      variationId: string
      variationLabel: string
      variationDescription?: string
    }
  }
  /** Raw slugs from POST /api/detect-components */
  editDetectedSlugs: string[]
  editDetectionLoading: boolean
  editDetectionError: string | null
  /** Selected row id from mergeEditComponentList (e.g. wall, coffee-table) */
  editSelectedItemId: string | null
  editCatalogCache: Record<string, CatalogVariation[]>
  editCatalogLoading: boolean
  editCatalogError: string | null
  editAttributeTab: EditAttributeTab
  editPendingVariation: CatalogVariation | null
  /** Add mode: selected preset or upload URL. */
  addOption: { presetId?: string; uploadUrl?: string; text?: string }
  /** Replace mode: selected replacement. */
  replaceOption: { presetId?: string; uploadUrl?: string; text?: string }
  /** Active edit tab: preset | ai | replace */
  activeEditTab: EditTab
  /** In-flight preview API (Add / Replace / Erase / Edit from side panel or preview card). */
  previewLoading: boolean
  previewError: string | null
}

export interface RoomEditorActions {
  setMode: (mode: EditorMode) => void
  setSelectionMode: (mode: SelectionMode) => void
  setSelection: (sel: Selection | null) => void
  setPreviewCutoutDataUrl: (url: string | null) => void
  setActiveEditTab: (tab: EditTab) => void
  setOriginalImage: (url: string | null) => void
  setWorkingImage: (url: string | null) => void
  setPreviewImage: (url: string | null) => void
  setEditOptions: (opts: Partial<RoomEditorState['editOptions']>) => void
  setAddOption: (opts: Partial<RoomEditorState['addOption']>) => void
  setReplaceOption: (opts: Partial<RoomEditorState['replaceOption']>) => void
  /** Apply preview → workingImage, push previous to undo, clear selection & preview. */
  apply: () => void
  /** Discard preview, restore from workingImage if needed. */
  cancel: () => void
  undo: () => void
  redo: () => void
  /** Reset selection and preview when switching mode. */
  resetForModeChange: () => void
  setEditDetectedSlugs: (slugs: string[]) => void
  setEditDetectionLoading: (v: boolean) => void
  setEditDetectionError: (msg: string | null) => void
  setEditSelectedItemId: (id: string | null) => void
  setEditCatalogCacheEntry: (apiComponent: string, rows: CatalogVariation[]) => void
  setEditCatalogLoading: (v: boolean) => void
  setEditCatalogError: (msg: string | null) => void
  setEditAttributeTab: (tab: EditAttributeTab) => void
  setEditPendingVariation: (v: CatalogVariation | null) => void
  /** Full-frame mask + catalog prompt (or AI text tab). */
  confirmEditCatalogCustomization: () => Promise<void>
  setPreviewLoading: (v: boolean) => void
  setPreviewError: (msg: string | null) => void
}

const MAX_UNDO = 20

export const useRoomEditorStore = create<RoomEditorState & RoomEditorActions>((set, get) => ({
  mode: 'idle',
  selectionMode: 'rectangle',
  activeEditTab: 'preset',
  selection: null,
  previewCutoutDataUrl: null,
  originalImage: null,
  workingImage: null,
  previewImage: null,
  undoStack: [],
  redoStack: [],
  editOptions: {},
  addOption: {},
  replaceOption: {},
  editDetectedSlugs: [],
  editDetectionLoading: false,
  editDetectionError: null,
  editSelectedItemId: null,
  editCatalogCache: {},
  editCatalogLoading: false,
  editCatalogError: null,
  editAttributeTab: 'style',
  editPendingVariation: null,
  previewLoading: false,
  previewError: null,

  setPreviewLoading: (previewLoading) => set({ previewLoading }),
  setPreviewError: (previewError) => set({ previewError: previewError ?? null }),

  setMode: (mode) => {
    set({ mode, selectionMode: 'rectangle' })
    get().resetForModeChange()
  },

  setSelectionMode: (selectionMode) => set({ selectionMode, selection: null, previewCutoutDataUrl: null }),

  setSelection: (selection) => set({ selection }),

  setPreviewCutoutDataUrl: (previewCutoutDataUrl) => set({ previewCutoutDataUrl: previewCutoutDataUrl ?? null }),

  setActiveEditTab: (activeEditTab) => set({ activeEditTab }),

  setOriginalImage: (originalImage) => set({ originalImage }),

  setWorkingImage: (workingImage) => set({ workingImage: workingImage ?? null }),

  setPreviewImage: (previewImage) => set({ previewImage: previewImage ?? null }),

  setEditOptions: (opts) =>
    set((s) => ({ editOptions: { ...s.editOptions, ...opts } })),

  setAddOption: (opts) =>
    set((s) => ({ addOption: { ...s.addOption, ...opts } })),

  setReplaceOption: (opts) =>
    set((s) => ({ replaceOption: { ...s.replaceOption, ...opts } })),

  apply: () => {
    const { previewImage, workingImage, undoStack, redoStack } = get()
    if (!previewImage) return
    const nextUndo = workingImage
      ? [...undoStack.slice(-(MAX_UNDO - 1)), workingImage]
      : undoStack
    set((s) => ({
      workingImage: previewImage,
      previewImage: null,
      selection: null,
      undoStack: nextUndo,
      redoStack: [],
      editOptions: { ...s.editOptions, catalogEdit: undefined },
      previewError: null,
      previewLoading: false,
    }))
  },

  cancel: () => {
    set({ previewImage: null, previewError: null, previewLoading: false })
  },

  undo: () => {
    const { undoStack, redoStack, workingImage } = get()
    if (undoStack.length === 0 || !workingImage) return
    const prev = undoStack[undoStack.length - 1]
    const nextUndo = undoStack.slice(0, -1)
    const nextRedo = [workingImage, ...redoStack].slice(0, MAX_UNDO)
    set({
      workingImage: prev,
      previewImage: null,
      selection: null,
      undoStack: nextUndo,
      redoStack: nextRedo,
    })
  },

  redo: () => {
    const { redoStack, workingImage } = get()
    if (redoStack.length === 0 || !workingImage) return
    const next = redoStack[0]
    const nextRedo = redoStack.slice(1)
    const nextUndo = [...get().undoStack.slice(-(MAX_UNDO - 1)), workingImage]
    set({
      workingImage: next,
      previewImage: null,
      selection: null,
      undoStack: nextUndo,
      redoStack: nextRedo,
    })
  },

  resetForModeChange: () => {
    const m = get().mode
    if (m === 'edit') {
      set({
        selection: null,
        previewImage: null,
        previewCutoutDataUrl: null,
        previewError: null,
        previewLoading: false,
      })
      return
    }
    set({
      selection: null,
      previewImage: null,
      previewCutoutDataUrl: null,
      previewError: null,
      previewLoading: false,
      editDetectedSlugs: [],
      editDetectionLoading: false,
      editDetectionError: null,
      editSelectedItemId: null,
      editCatalogCache: {},
      editCatalogLoading: false,
      editCatalogError: null,
      editAttributeTab: 'style',
      editPendingVariation: null,
      editOptions: { ...get().editOptions, catalogEdit: undefined },
    })
  },

  setEditDetectedSlugs: (editDetectedSlugs) => set({ editDetectedSlugs }),

  setEditDetectionLoading: (editDetectionLoading) => set({ editDetectionLoading }),

  setEditDetectionError: (editDetectionError) => set({ editDetectionError }),

  setEditSelectedItemId: (editSelectedItemId) =>
    set((s) => ({
      editSelectedItemId,
      editPendingVariation: null,
      previewImage: null,
      selection: null,
      editOptions: { ...s.editOptions, catalogEdit: undefined },
    })),

  setEditCatalogCacheEntry: (apiComponent, rows) =>
    set((s) => ({
      editCatalogCache: { ...s.editCatalogCache, [apiComponent]: rows },
    })),

  setEditCatalogLoading: (editCatalogLoading) => set({ editCatalogLoading }),

  setEditCatalogError: (editCatalogError) => set({ editCatalogError }),

  setEditAttributeTab: (editAttributeTab) => set({ editAttributeTab }),

  setEditPendingVariation: (editPendingVariation) => set({ editPendingVariation }),

  confirmEditCatalogCustomization: async () => {
    const {
      workingImage,
      editAttributeTab,
      editOptions,
      editPendingVariation,
      editSelectedItemId,
      editDetectedSlugs,
    } = get()
    if (!workingImage || !editSelectedItemId) return

    const list = mergeEditComponentList(editDetectedSlugs)
    const item = list.find((i) => i.id === editSelectedItemId)
    if (!item) return

    const mask = await createFullWhiteMaskDataUrl(workingImage)
    if (!mask) return

    const nextSelection: Selection = {
      type: 'area',
      boundingBox: { x: 0, y: 0, width: 1, height: 1 },
      maskDataUrl: mask,
    }

    if (editAttributeTab === 'ai') {
      const text = editOptions.text?.trim()
      if (!text) return
      set({
        selection: nextSelection,
        previewImage: null,
        editOptions: {
          ...get().editOptions,
          catalogEdit: undefined,
          text,
        },
      })
      return
    }

    if (!editPendingVariation) return

    set({
      selection: nextSelection,
      previewImage: null,
      editOptions: {
        ...get().editOptions,
        catalogEdit: {
          apiComponent: item.apiComponent,
          componentLabel: item.label,
          variationId: editPendingVariation.id,
          variationLabel: editPendingVariation.label,
          variationDescription: editPendingVariation.description,
        },
      },
    })
  },
}))
