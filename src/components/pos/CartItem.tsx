import { memo, useEffect, useRef } from 'react'
import { Minus, Plus, X } from 'lucide-react'
import type { CartLine } from '@/types'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

interface CartItemProps {
  line: CartLine
  selected: boolean
  onSelect: (id: string) => void
  onQuantityChange: (id: string, qty: number) => void
  onRemove: (id: string) => void
}

function CartItemImpl({ line, selected, onSelect, onQuantityChange, onRemove }: CartItemProps) {
  const { product, quantity } = line
  const lineTotal = product.price * quantity
  const initial = product.name.charAt(0).toUpperCase()
  const ref = useRef<HTMLDivElement>(null)

  // Auto-scroll into view when keyboard navigation lands on it
  useEffect(() => {
    if (selected) ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selected])

  return (
    <div
      ref={ref}
      onClick={() => onSelect(product.id)}
      className={cn(
        'group flex cursor-pointer items-center gap-3 rounded-sm px-2 py-2.5 transition-colors',
        selected ? 'bg-primary-soft ring-1 ring-primary/30' : 'hover:bg-surface-2/60',
      )}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-gradient-to-br from-primary-soft to-surface-2 font-bold text-primary/60">
        {initial}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-body-sm font-medium text-text">
          {product.nameBn ?? product.name}
        </p>
        <p className="text-caption tabular text-text-muted">
          {formatCurrency(product.price)} × {quantity}
        </p>
      </div>

      <div className="flex items-center gap-1 rounded-sm border border-border bg-surface">
        <button
          type="button"
          aria-label="Decrease"
          onClick={(e) => {
            e.stopPropagation()
            onQuantityChange(product.id, quantity - 1)
          }}
          className="inline-flex h-8 w-8 items-center justify-center text-text-muted hover:text-text"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-6 text-center text-body-sm font-semibold tabular text-text">
          {quantity}
        </span>
        <button
          type="button"
          aria-label="Increase"
          onClick={(e) => {
            e.stopPropagation()
            onQuantityChange(product.id, quantity + 1)
          }}
          className="inline-flex h-8 w-8 items-center justify-center text-text-muted hover:text-text"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="w-20 shrink-0 text-right text-body-sm font-bold tabular text-text">
        {formatCurrency(lineTotal)}
      </div>

      <button
        type="button"
        aria-label="Remove"
        onClick={(e) => {
          e.stopPropagation()
          onRemove(product.id)
        }}
        className={cn(
          'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-text-faint transition-all hover:bg-danger-soft hover:text-danger',
          selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        )}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export const CartItem = memo(CartItemImpl)
