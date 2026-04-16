import { createContext, useContext, useReducer, useCallback, useState } from 'react'
import type { AppState, DetectedComponent } from '../types'
import type { InteractionMode } from '../types'
import { reducer, initialState, createInitialComponents } from '../state/reducer'
import type { Action } from '../state/reducer'

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<Action>
  recordHistory: () => void
  selectComponent: (id: string) => void
  toggleComponent: (id: string) => void
  getSelectedComponents: () => DetectedComponent[]
  previewCutoutDataUrl: string | null
  setPreviewCutoutDataUrl: (url: string | null) => void
  interactionMode: InteractionMode
  setInteractionMode: (mode: InteractionMode) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [previewCutoutDataUrl, setPreviewCutoutDataUrl] = useState<string | null>(null)

  const recordHistory = useCallback(() => {
    dispatch({ type: 'RECORD_HISTORY' })
  }, [])

  const selectComponent = useCallback((id: string) => {
    setPreviewCutoutDataUrl(null)
    dispatch({ type: 'SELECT_COMPONENT', payload: id })
  }, [])

  const toggleComponent = useCallback((id: string) => {
    setPreviewCutoutDataUrl(null)
    dispatch({ type: 'TOGGLE_COMPONENT_SELECTION', payload: id })
  }, [])

  const setInteractionMode = useCallback((mode: InteractionMode) => {
    setPreviewCutoutDataUrl(null)
    dispatch({ type: 'SET_INTERACTION_MODE', payload: mode })
  }, [])

  const getSelectedComponents = useCallback(() => {
    return state.components.filter((c) => state.selection.activeComponentIds.includes(c.id))
  }, [state.components, state.selection.activeComponentIds])

  const value: AppContextValue = {
    state,
    dispatch,
    recordHistory,
    selectComponent,
    toggleComponent,
    getSelectedComponents,
    previewCutoutDataUrl,
    setPreviewCutoutDataUrl,
    interactionMode: state.selection.interactionMode,
    setInteractionMode,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

export { createInitialComponents }
