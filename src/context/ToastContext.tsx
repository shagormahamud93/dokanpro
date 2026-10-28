import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastTone = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: number
  tone: ToastTone
  title: string
  description?: string
  duration: number
}

interface ToastContextValue {
  show: (t: Omit<Toast, 'id' | 'duration'> & { duration?: number }) => number
  success: (title: string, description?: string) => number
  error: (title: string, description?: string) => number
  info: (title: string, description?: string) => number
  warning: (title: string, description?: string) => number
  dismiss: (id: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let toastCounter = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef(new Map<number, number>())

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const show = useCallback<ToastContextValue['show']>(
    ({ tone, title, description, duration = 4000 }) => {
      const id = ++toastCounter
      setToasts((prev) => [...prev, { id, tone, title, description, duration }].slice(-5))
      const t = window.setTimeout(() => dismiss(id), duration)
      timers.current.set(id, t)
      return id
    },
    [dismiss],
  )

  const value: ToastContextValue = {
    show,
    success: (title, description) => show({ tone: 'success', title, description }),
    error: (title, description) => show({ tone: 'error', title, description, duration: 6000 }),
    info: (title, description) => show({ tone: 'info', title, description }),
    warning: (title, description) => show({ tone: 'warning', title, description }),
    dismiss,
  }

  useEffect(() => {
    return () => {
      timers.current.forEach((t) => window.clearTimeout(t))
      timers.current.clear()
    }
  }, [])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}

// ────────────────────────────────────────────────────────────────────
// Viewport

const toneStyles: Record<ToastTone, { bar: string; icon: typeof CheckCircle2; text: string }> = {
  success: { bar: 'bg-success', icon: CheckCircle2, text: 'text-success' },
  error: { bar: 'bg-danger', icon: AlertCircle, text: 'text-danger' },
  warning: { bar: 'bg-warning', icon: AlertTriangle, text: 'text-warning' },
  info: { bar: 'bg-primary', icon: Info, text: 'text-primary' },
}

function ToastViewport({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  if (toasts.length === 0) return null
  return createPortal(
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2 sm:right-6 sm:top-6">
      {toasts.map((t) => {
        const { bar, icon: Icon, text } = toneStyles[t.tone]
        return (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto relative flex animate-slide-up items-start gap-3 overflow-hidden rounded-md border border-border bg-surface p-4 pr-10 shadow-lg"
          >
            <span className={cn('absolute inset-y-0 left-0 w-1', bar)} />
            <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', text)} />
            <div className="min-w-0 flex-1">
              <p className="text-body-sm font-semibold text-text">{t.title}</p>
              {t.description && (
                <p className="mt-0.5 text-caption text-text-muted">{t.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              aria-label="Dismiss"
              className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-sm text-text-muted hover:bg-surface-2 hover:text-text"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      })}
    </div>,
    document.body,
  )
}
