import { useEffect } from 'react'
import { useApp } from '../context/AppContext'

export function useKeyboardShortcuts() {
  const { state, dispatch } = useApp()

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Escape') (e.target as HTMLElement).blur()
        return
      }
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const mod = isMac ? e.metaKey : e.ctrlKey
      if (mod && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) dispatch({ type: 'REDO' })
        else dispatch({ type: 'UNDO' })
        return
      }
      if (mod && e.key === 'y') {
        e.preventDefault()
        dispatch({ type: 'REDO' })
        return
      }
      if (e.key === 'Escape') {
        dispatch({ type: 'SET_ACTIVE_PANEL', payload: null })
        dispatch({ type: 'DESELECT_ALL' })
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        state.selection.activeComponentIds.forEach((id) => {
          dispatch({ type: 'REMOVE_COMPONENT', payload: id })
        })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [dispatch, state.selection.activeComponentIds])
}
