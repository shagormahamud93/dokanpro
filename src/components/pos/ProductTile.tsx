import { memo } from 'react'
import { Plus } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import type { Product } from '@/types'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

interface ProductTileProps {
  product: Product
  onAdd: (p: Product) => void
}

function stockTone(stock: number): { tone: 'success' | 'warning' | 'danger'; label: string } {
  if (stock === 0) return { tone: 'danger', label: 'Out' }
  if (stock < 10) return { tone: 'warning', label: `${stock} left` }
  return { tone: 'success', label: `${stock} in` }
}

function ProductTileImpl({ product, onAdd }: ProductTileProps) {
  const { tone, label } = stockTone(product.stock)
  const initial = product.name.charAt(0).toUpperCase()
  const disabled = product.stock === 0

  return (
    <button
      type="button"
      onClick={() => onAdd(product)}
      disabled={disabled}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-md border border-border bg-surface text-left transition-all duration-150 will-change-transform',
        'hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md',
        'focus-ring active:scale-[0.98]',
        disabled && 'cursor-not-allowed opacity-60 hover:translate-y-0 hover:border-border hover:shadow-sm',
      )}
    >
      <div className="relative flex h-24 items-center justify-center bg-gradient-to-br from-primary-soft to-surface-2">
        <span className="text-display font-bold text-primary/40">{initial}</span>
        <span className="absolute right-2 top-2">
          <Badge tone={tone} dot>{label}</Badge>
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-body-sm font-medium text-text">
          {product.nameBn ?? product.name}
        </p>
        <p className="text-caption text-text-muted">{product.sku}</p>
        <div className="mt-1 flex items-end justify-between">
          <span className="tabular text-body font-bold text-text">
            {formatCurrency(product.price)}
          </span>
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100">
            <Plus className="h-4 w-4" />
          </span>
        </div>
      </div>
    </button>
  )
}

export const ProductTile = memo(ProductTileImpl)
