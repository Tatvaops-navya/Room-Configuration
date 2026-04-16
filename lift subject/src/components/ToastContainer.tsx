import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

export interface ToastItem {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

const toasts: ToastItem[] = []
const listeners: Array<(t: ToastItem[]) => void> = []

export function addToast(message: string, type: ToastItem['type'] = 'info') {
  const id = `toast-${Date.now()}`
  toasts.unshift({ id, message, type })
  if (toasts.length > 5) toasts.pop()
  listeners.forEach((l) => l([...toasts]))
}

export function ToastContainer() {
  const [items, setItems] = useState<ToastItem[]>([])

  useEffect(() => {
    listeners.push(setItems)
    return () => {
      const i = listeners.indexOf(setItems)
      if (i >= 0) listeners.splice(i, 1)
    }
  }, [])

  const remove = useCallback((id: string) => {
    const idx = toasts.findIndex((t) => t.id === id)
    if (idx >= 0) {
      toasts.splice(idx, 1)
      listeners.forEach((l) => l([...toasts]))
    }
  }, [])

  if (items.length === 0) return null

  const config = {
    success: { icon: CheckCircle2, bg: 'bg-[var(--success)]', text: 'text-white' },
    error: { icon: XCircle, bg: 'bg-red-500', text: 'text-white' },
    info: { icon: Info, bg: 'bg-[var(--neutral-700)]', text: 'text-white' },
  }

  return (
    <div
      className="fixed top-5 right-5 z-[100] flex flex-col gap-3 max-w-sm"
      role="region"
      aria-label="Notifications"
    >
      {items.map((t) => {
        const { icon: Icon, bg, text } = config[t.type]
        return (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] shadow-[var(--shadow-modal)] animate-fade-scale-in ${bg} ${text}`}
          >
            <Icon className="w-5 h-5 shrink-0 opacity-90" />
            <span className="text-sm font-medium flex-1">{t.message}</span>
            <button
              type="button"
              onClick={() => remove(t.id)}
              className="p-1 rounded-[var(--radius-sm)] opacity-80 hover:opacity-100 hover:bg-white/20 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
