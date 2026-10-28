import { memo } from 'react'
import { ShoppingBag, UserPlus, Trash2, Tag, ChevronRight, PauseCircle, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Kbd } from '@/components/ui/Kbd'
import { CartItem } from './CartItem'
import { HoldCarts } from './HoldCarts'
import type { CartLine } from '@/types'
import { formatCurrency } from '@/lib/format'

interface HeldCart {
  id: string
  label: string
  total: number
  heldAt: Date
  lines: CartLine[]
}

interface CartProps {
  lines: CartLine[]
  selectedId: string | null
  subtotal: number
  discount: number
  tax: number
  total: number
  itemCount: number
  held: HeldCart[]
  onSelect: (id: string) => void
  onQuantityChange: (id: string, qty: number) => void
  onRemove: (id: string) => void
  onClear: () => void
  onDiscountChange: (v: number) => void
  onCharge: () => void
  onHold: () => void
  onRecall: (id: string) => void
  onDropHeld: (id: string) => void
  onShowHelp: () => void
}

function CartImpl(props: CartProps) {
  const {
    lines,
    selectedId,
    subtotal,
    discount,
    tax,
    total,
    itemCount,
    held,
    onSelect,
    onQuantityChange,
    onRemove,
    onClear,
    onDiscountChange,
    onCharge,
    onHold,
    onRecall,
    onDropHeld,
    onShowHelp,
  } = props
  const empty = lines.length === 0

  return (
    <aside className="flex h-full flex-col bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-border p-5">
        <div>
          <p className="text-h3 text-text">Current Sale</p>
          <p className="text-caption text-text-muted">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <HoldCarts held={held} onRecall={onRecall} onDrop={onDropHeld} />
          <button
            type="button"
            aria-label="Keyboard shortcuts"
            onClick={onShowHelp}
            className="inline-flex h-10 w-10 items-center justify-center rounded-sm text-text-muted hover:bg-surface-2 hover:text-text"
          >
            <HelpCircle className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      {/* Customer row */}
      <div className="border-b border-border px-5 py-3">
        <button
          type="button"
          className="inline-flex w-full items-center gap-2 rounded-sm border border-dashed border-border bg-surface-2/40 px-3 py-2 text-body-sm text-text-muted transition-colors hover:border-primary hover:bg-primary-soft hover:text-primary"
        >
          <UserPlus className="h-4 w-4" />
          Add customer
          <Kbd className="ml-auto">F2</Kbd>
        </button>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-2">
              <ShoppingBag className="h-7 w-7 text-text-muted" />
            </div>
            <div>
              <p className="text-body font-medium text-text">Cart is empty</p>
              <p className="mt-1 text-body-sm text-text-muted">
                পণ্য স্ক্যান বা সার্চ করে শুরু করুন
              </p>
            </div>
            <p className="mt-2 text-caption text-text-muted">
              Press <Kbd>F1</Kbd> to focus search · <Kbd>?</Kbd> for shortcuts
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {lines.map((line) => (
              <CartItem
                key={line.product.id}
                line={line}
                selected={selectedId === line.product.id}
                onSelect={onSelect}
                onQuantityChange={onQuantityChange}
                onRemove={onRemove}
              />
            ))}
          </div>
        )}
      </div>

      {/* Totals + actions */}
      {!empty && (
        <div className="space-y-4 border-t border-border p-5">
          {/* Discount */}
          <div className="flex items-center gap-2 rounded-sm border border-border bg-surface-2/50 px-3 py-2">
            <Tag className="h-4 w-4 text-text-muted" />
            <span className="text-body-sm text-text-muted">Discount</span>
            <input
              type="number"
              min={0}
              value={discount || ''}
              onChange={(e) => onDiscountChange(Number(e.target.value) || 0)}
              placeholder="0"
              className="ml-auto w-24 border-0 bg-transparent text-right text-body-sm font-semibold tabular text-text placeholder:text-text-faint focus:outline-none focus:ring-0"
            />
            <span className="text-body-sm text-text-muted">৳</span>
            <Kbd>F3</Kbd>
          </div>

          {/* Totals */}
          <div className="space-y-1.5 text-body-sm">
            <div className="flex justify-between text-text-muted">
              <span>Subtotal</span>
              <span className="tabular text-text">{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-text-muted">
                <span>Discount</span>
                <span className="tabular text-danger">−{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-text-muted">
              <span>Tax (5%)</span>
              <span className="tabular text-text">{formatCurrency(tax)}</span>
            </div>
            <div className="mt-3 flex items-baseline justify-between border-t border-border pt-3">
              <span className="text-h3 text-text">Total</span>
              <span className="text-display tabular text-text">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Charge */}
          <Button
            size="xl"
            fullWidth
            rightIcon={<ChevronRight className="h-5 w-5" />}
            onClick={onCharge}
            className="font-semibold"
          >
            Charge {formatCurrency(total)}
          </Button>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onHold}
              className="inline-flex items-center gap-1.5 text-caption text-text-muted hover:text-warning"
            >
              <PauseCircle className="h-3.5 w-3.5" />
              Hold <Kbd className="ml-1">F4</Kbd>
            </button>
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1.5 text-caption text-text-muted hover:text-danger"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}

export const Cart = memo(CartImpl)
