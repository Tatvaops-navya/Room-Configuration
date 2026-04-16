import type { AppState, DetectedComponent, HistoryEntry, Region } from '../types'
import { getNextAccentColor, resetAccentIndex } from '../lib/canvasUtils'
import { COMPONENT_NAMES } from '../lib/mockData'

const MAX_HISTORY = 10

function cloneComponents(components: DetectedComponent[]): DetectedComponent[] {
  return components.map((c) => ({
    ...c,
    region: { ...c.region },
    modifications: { ...c.modifications },
    appliedVariation: c.appliedVariation ? { ...c.appliedVariation } : undefined,
  }))
}

export const initialState: AppState = {
  image: {
    source: null,
    file: null,
    width: 0,
    height: 0,
    originalDataUrl: null,
    displayDataUrl: null,
  },
  components: [],
  hoverDetected: [],
  selection: {
    activeComponentIds: [],
    activePanel: null,
    previewMode: 'after',
    interactionMode: 'rectangle',
  },
  editing: {
    isAnalyzing: false,
    isExtracting: false,
    isProcessing: false,
    currentOperation: '',
    progress: 0,
  },
  history: { undo: [], redo: [] },
}

export type Action =
  | { type: 'SET_IMAGE'; payload: { source: string; file: File | null; width: number; height: number; originalDataUrl: string } }
  | { type: 'CLEAR_IMAGE' }
  | { type: 'SET_COMPONENTS'; payload: DetectedComponent[] }
  | { type: 'SELECT_COMPONENT'; payload: string }
  | { type: 'TOGGLE_COMPONENT_SELECTION'; payload: string }
  | { type: 'SELECT_MULTIPLE'; payload: string[] }
  | { type: 'DESELECT_ALL' }
  | { type: 'SET_ACTIVE_PANEL'; payload: AppState['selection']['activePanel'] }
  | { type: 'SET_PREVIEW_MODE'; payload: AppState['selection']['previewMode'] }
  | { type: 'SET_INTERACTION_MODE'; payload: AppState['selection']['interactionMode'] }
  | { type: 'SET_EDITING'; payload: Partial<AppState['editing']> }
  | { type: 'UPDATE_COMPONENT_CUTOUT'; payload: { id: string; cutoutDataUrl: string } }
  | { type: 'UPDATE_COMPONENTS_CUTOUTS'; payload: Array<{ id: string; cutoutDataUrl: string }> }
  | { type: 'UPDATE_COMPONENT'; payload: { id: string; updates: Partial<DetectedComponent> } }
  | { type: 'APPLY_PRESET'; payload: { id: string; cutoutDataUrl: string; presetName: string } }
  | { type: 'APPLY_AI'; payload: { id: string; cutoutDataUrl: string; prompt: string; intensity: number } }
  | { type: 'REPLACE_COMPONENT'; payload: { id: string; cutoutDataUrl: string; source: string } }
  | { type: 'REMOVE_COMPONENT'; payload: string }
  | { type: 'DUPLICATE_COMPONENT'; payload: string }
  | { type: 'REORDER_COMPONENTS'; payload: string[] }
  | { type: 'ADD_EXTRACTED_COMPONENT'; payload: { cutoutDataUrl: string; region: Region; name?: string; maskDataUrl?: string } }
  | { type: 'ADD_EXTRACTED_COMPONENTS'; payload: Array<{ cutoutDataUrl: string; region: Region; name?: string; maskDataUrl?: string }> }
  | { type: 'SET_DISPLAY_IMAGE'; payload: string | null }
  | { type: 'SET_HOVER_DETECTED'; payload: AppState['hoverDetected'] }
  | { type: 'CLEAR_HOVER_DETECTED' }
  | { type: 'REMOVE_HOVER_DETECTED'; payload: string }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RECORD_HISTORY' }

function currentEntry(state: AppState): HistoryEntry {
  return {
    components: cloneComponents(state.components),
    image: { ...state.image },
    timestamp: Date.now(),
  }
}

function pushHistory(undo: HistoryEntry[], state: AppState): HistoryEntry[] {
  return [currentEntry(state), ...undo].slice(0, MAX_HISTORY)
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_IMAGE': {
      resetAccentIndex()
      return {
        ...state,
        image: {
          source: action.payload.source,
          file: action.payload.file,
          width: action.payload.width,
          height: action.payload.height,
          originalDataUrl: action.payload.originalDataUrl,
          displayDataUrl: action.payload.originalDataUrl,
        },
        components: [],
        hoverDetected: [],
        selection: initialState.selection,
        editing: { ...state.editing, isAnalyzing: true, currentOperation: 'Analyzing image...', progress: 0 },
      }
    }
    case 'SET_DISPLAY_IMAGE':
      return {
        ...state,
        image: { ...state.image, displayDataUrl: action.payload },
      }
    case 'CLEAR_IMAGE':
      return initialState

    case 'SET_COMPONENTS':
      return {
        ...state,
        components: action.payload,
        editing: { ...state.editing, isAnalyzing: false, currentOperation: '', progress: 100 },
      }

    case 'SELECT_COMPONENT':
      return {
        ...state,
        selection: {
          ...state.selection,
          activeComponentIds: [action.payload],
          activePanel: 'preset',
        },
        editing: { ...state.editing, isProcessing: false, currentOperation: '', progress: 100 },
      }

    case 'TOGGLE_COMPONENT_SELECTION': {
      const ids = state.selection.activeComponentIds
      const exists = ids.includes(action.payload)
      const activeComponentIds = exists ? ids.filter((id) => id !== action.payload) : [action.payload]
      return {
        ...state,
        selection: { ...state.selection, activeComponentIds },
        editing: { ...state.editing, isProcessing: false, currentOperation: '', progress: 100 },
      }
    }

    case 'SELECT_MULTIPLE':
      return { ...state, selection: { ...state.selection, activeComponentIds: action.payload } }

    case 'DESELECT_ALL':
      return { ...state, selection: { ...state.selection, activeComponentIds: [] } }

    case 'SET_ACTIVE_PANEL':
      return { ...state, selection: { ...state.selection, activePanel: action.payload } }

    case 'SET_PREVIEW_MODE':
      return { ...state, selection: { ...state.selection, previewMode: action.payload } }

    case 'SET_INTERACTION_MODE':
      return {
        ...state,
        selection: { ...state.selection, interactionMode: action.payload },
        hoverDetected: action.payload !== 'hover' ? [] : state.hoverDetected,
      }

    case 'SET_HOVER_DETECTED':
      return { ...state, hoverDetected: action.payload }

    case 'CLEAR_HOVER_DETECTED':
      return { ...state, hoverDetected: [] }

    case 'REMOVE_HOVER_DETECTED':
      return {
        ...state,
        hoverDetected: state.hoverDetected.filter((h) => h.id !== action.payload),
      }

    case 'SET_EDITING':
      return { ...state, editing: { ...state.editing, ...action.payload } }

    case 'UPDATE_COMPONENT_CUTOUT':
      return {
        ...state,
        components: state.components.map((c) =>
          c.id === action.payload.id ? { ...c, cutoutDataUrl: action.payload.cutoutDataUrl } : c
        ),
      }

    case 'UPDATE_COMPONENTS_CUTOUTS': {
      const updates = new Map(action.payload.map((u) => [u.id, u.cutoutDataUrl]))
      return {
        ...state,
        components: state.components.map((c) =>
          updates.has(c.id) ? { ...c, cutoutDataUrl: updates.get(c.id)! } : c
        ),
      }
    }

    case 'UPDATE_COMPONENT':
      return {
        ...state,
        components: state.components.map((c) =>
          c.id === action.payload.id ? { ...c, ...action.payload.updates } : c
        ),
      }

    case 'APPLY_PRESET': {
      const components = state.components.map((c) =>
        c.id === action.payload.id
          ? {
              ...c,
              cutoutDataUrl: action.payload.cutoutDataUrl,
              modifications: {
                ...c.modifications,
                preset: { name: action.payload.presetName, appliedAt: Date.now() },
              },
            }
          : c
      )
      return {
        ...state,
        components,
        history: { ...state.history, redo: [] },
      }
    }

    case 'APPLY_AI':
    case 'REPLACE_COMPONENT': {
      const cutoutDataUrl = action.payload.cutoutDataUrl
      const components = state.components.map((c) =>
        c.id === action.payload.id
          ? {
              ...c,
              cutoutDataUrl,
              modifications:
                action.type === 'APPLY_AI'
                  ? { ...c.modifications, ai: { prompt: (action as { payload: { prompt: string; intensity: number } }).payload.prompt, result: '', intensity: (action as { payload: { intensity: number } }).payload.intensity } }
                  : { ...c.modifications, replacement: { source: (action.payload as { source: string }).source, position: c.region } },
            }
          : c
      )
      return { ...state, components, history: { ...state.history, redo: [] } }
    }

    case 'REMOVE_COMPONENT': {
      const nextIds = state.selection.activeComponentIds.filter((id) => id !== action.payload)
      return {
        ...state,
        components: state.components.filter((c) => c.id !== action.payload),
        selection: {
          ...state.selection,
          activeComponentIds: nextIds,
          activePanel: nextIds.length > 0 ? state.selection.activePanel : null,
        },
      }
    }

    case 'ADD_EXTRACTED_COMPONENT': {
      const { cutoutDataUrl, region, name, maskDataUrl } = action.payload
      const id = `extracted-${Date.now()}`
      const component: DetectedComponent = {
        id,
        name: name ?? `Component ${state.components.length + 1}`,
        region,
        confidence: 0.95,
        cutoutDataUrl,
        originalCutoutDataUrl: cutoutDataUrl,
        maskDataUrl: maskDataUrl ?? null,
        isSelected: false,
        modifications: {},
        accentColor: getNextAccentColor(),
      }
      return {
        ...state,
        components: [...state.components, component],
        selection: { ...state.selection, activeComponentIds: [id], activePanel: 'preset' },
        editing: { ...state.editing, isExtracting: false, isProcessing: false, currentOperation: '', progress: 100 },
      }
    }

    case 'ADD_EXTRACTED_COMPONENTS': {
      const payload = action.payload
      if (payload.length === 0) return state
      const newComponents: DetectedComponent[] = payload.map((p, i) => ({
        id: `extracted-${Date.now()}-${i}`,
        name: p.name ?? `Component ${state.components.length + i + 1}`,
        region: p.region,
        confidence: 0.9,
        cutoutDataUrl: p.cutoutDataUrl,
        originalCutoutDataUrl: p.cutoutDataUrl,
        maskDataUrl: p.maskDataUrl ?? null,
        isSelected: false,
        modifications: {},
        accentColor: getNextAccentColor(),
      }))
      return {
        ...state,
        components: [...state.components, ...newComponents],
        selection: { ...state.selection, activeComponentIds: [], activePanel: null },
        editing: { ...state.editing, isExtracting: false, isProcessing: false, currentOperation: '', progress: 100 },
      }
    }

    case 'DUPLICATE_COMPONENT': {
      const comp = state.components.find((c) => c.id === action.payload)
      if (!comp) return state
      const newId = `extracted-${Date.now()}`
      const duplicate: DetectedComponent = {
        ...comp,
        id: newId,
        name: `${comp.name} (copy)`,
        modifications: {},
        appliedVariation: undefined,
        accentColor: getNextAccentColor(),
      }
      return {
        ...state,
        components: [...state.components, duplicate],
        selection: { ...state.selection, activeComponentIds: [newId], activePanel: 'preset' },
      }
    }

    case 'REORDER_COMPONENTS': {
      const order = new Map(action.payload.map((id, i) => [id, i]))
      const components = [...state.components].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
      return { ...state, components }
    }

    case 'RECORD_HISTORY':
      return {
        ...state,
        history: { ...state.history, undo: pushHistory(state.history.undo, state) },
      }

    case 'UNDO': {
      const [entry, ...rest] = state.history.undo
      if (!entry) return state
      return {
        ...state,
        components: entry.components,
        image: entry.image,
        history: {
          undo: rest,
          redo: [currentEntry(state), ...state.history.redo].slice(0, MAX_HISTORY),
        },
      }
    }

    case 'REDO': {
      const [entry, ...rest] = state.history.redo
      if (!entry) return state
      return {
        ...state,
        components: entry.components,
        image: entry.image,
        history: {
          undo: [currentEntry(state), ...state.history.undo].slice(0, MAX_HISTORY),
          redo: rest,
        },
      }
    }

    default:
      return state
  }
}

export function createInitialComponents(
  regions: { x: number; y: number; width: number; height: number }[]
): DetectedComponent[] {
  return regions.map((region, i) => ({
    id: `comp-${i + 1}`,
    name: COMPONENT_NAMES[i % COMPONENT_NAMES.length] ?? `Component ${i + 1}`,
    region,
    confidence: 0.85 + Math.random() * 0.12,
    cutoutDataUrl: null,
    maskDataUrl: null,
    isSelected: false,
    modifications: {},
    accentColor: getNextAccentColor(),
  }))
}
