import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Hide close button — useful for success states */
  hideClose?: boolean
  /** Disable backdrop dismissal — useful while a payment is processing */
  dismissable?: boolean
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  hideClose,
  dismissable = true,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on Esc + lock body scroll while open
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissable) {
        e.stopPropagation()
        onClose()
      }
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    panelRef.current?.focus()
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose, dismissable])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 animate-fade-in bg-text/40 backdrop-blur-sm"
        onClick={dismissable ? onClose : undefined}
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          'relative w-full animate-slide-up overflow-hidden rounded-lg border border-border bg-surface shadow-lg outline-none',
          sizeMap[size],
        )}
      >
        {(title || !hideClose) && (
          <div className="flex items-start justify-between gap-4 border-b border-border p-5">
            <div className="min-w-0 flex-1">
              {title && <h2 className="text-h3 text-text">{title}</h2>}
              {description && (
                <p className="mt-1 text-body-sm text-text-muted">{description}</p>
              )}
            </div>
            {!hideClose && (
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        <div className="p-5">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-border bg-surface-2/40 p-5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
