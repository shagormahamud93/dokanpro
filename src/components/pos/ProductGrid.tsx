import { memo, useMemo, useState } from 'react'
import { Loader2, PackageSearch } from 'lucide-react'
import { ProductTile } from './ProductTile'
import type { Product } from '@/types'
import { cn } from '@/lib/utils'

interface ProductGridProps {
  products: Product[]
  query: string
  loading?: boolean
  onAdd: (p: Product) => void
}

function deriveCategories(products: Product[]): string[] {
  const set = new Set<string>(['All'])
  for (const p of products) set.add(p.category)
  return [...set]
}

function ProductGridImpl({ products, query, loading, onAdd }: ProductGridProps) {
  const [activeCategory, setActiveCategory] = useState<string>('All')

  const categories = useMemo(() => deriveCategories(products), [products])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => {
      if (activeCategory !== 'All' && p.category !== activeCategory) return false
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        p.nameBn?.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode?.includes(q)
      )
    })
  }, [products, query, activeCategory])

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 overflow-x-auto pb-4">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setActiveCategory(c)}
            className={cn(
              'h-9 shrink-0 rounded-full border px-4 text-body-sm font-medium transition-colors duration-150',
              activeCategory === c
                ? 'border-primary bg-primary text-white shadow-sm'
                : 'border-border bg-surface text-text-muted hover:border-text-faint hover:text-text',
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="-mx-2 flex-1 overflow-y-auto px-2">
        {loading ? (
          <div className="grid grid-cols-2 gap-3 pb-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-44 animate-pulse rounded-md border border-border bg-surface-2/40"
              />
            ))}
            <div className="col-span-full flex items-center justify-center gap-2 py-2 text-body-sm text-text-muted">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading products…
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-2">
              <PackageSearch className="h-6 w-6 text-text-muted" />
            </div>
            <p className="text-body font-medium text-text">No products found</p>
            <p className="text-body-sm text-text-muted">
              {products.length === 0
                ? 'Run the backend seed script to add products'
                : 'Try adjusting your search or category'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 pb-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((p) => (
              <ProductTile key={p.id} product={p} onAdd={onAdd} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export const ProductGrid = memo(ProductGridImpl)
