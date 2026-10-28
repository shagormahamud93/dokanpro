import { useState, useEffect, useRef } from 'react'
import { PauseCircle, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency, formatRelativeTime } from '@/lib/format'

interface HeldCart {
  id: string
  label: string
  total: number
  heldAt: Date
  lines: { product: { id: string }; quantity: number }[]
}

interface HoldCartsProps {
  held: HeldCart[]
  onRecall: (id: string) => void
  onDrop: (id: string) => void
}

export function HoldCarts({ held, onRecall, onDrop }: HoldCartsProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  if (held.length === 0) return null

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex h-10 items-center gap-2 rounded-sm border border-border bg-surface px-3 text-body-sm font-medium text-text-muted transition-colors hover:border-warning hover:text-warning',
          open && 'border-warning text-warning',
        )}
      >
        <PauseCircle className="h-4 w-4" />
        Holds
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-warning/15 px-1.5 text-caption font-semibold text-warning">
          {held.length}
        </span>
        <ChevronDown
          className={cn('h-4 w-4 transition-transform duration-150', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 animate-slide-up overflow-hidden rounded-md border border-border bg-surface shadow-lg">
          <div className="border-b border-border bg-surface-2/50 px-4 py-2.5">
            <p className="text-overline uppercase text-text-muted">Parked sales</p>
          </div>
          <ul className="max-h-80 overflow-y-auto p-1">
            {held.map((h) => (
              <li
                key={h.id}
                className="group flex items-center gap-3 rounded-sm p-3 transition-colors hover:bg-surface-2"
              >
                <button
                  type="button"
                  onClick={() => {
                    onRecall(h.id)
                    setOpen(false)
                  }}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate text-body-sm font-medium text-text">{h.label}</p>
                  <p className="text-caption text-text-muted">
                    {h.lines.length} items · {formatRelativeTime(h.heldAt)}
                  </p>
                </button>
                <span className="shrink-0 tabular text-body-sm font-semibold text-text">
                  {formatCurrency(h.total)}
                </span>
                <button
                  type="button"
                  aria-label="Discard held cart"
                  onClick={() => onDrop(h.id)}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-text-faint opacity-0 hover:bg-danger-soft hover:text-danger group-hover:opacity-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
