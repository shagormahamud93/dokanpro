import { useCallback, useMemo, useRef, useState } from 'react'
import { SearchBar, type SearchBarHandle } from '@/components/pos/SearchBar'
import { ProductGrid } from '@/components/pos/ProductGrid'
import { Cart } from '@/components/pos/Cart'
import { PaymentModal } from '@/components/pos/PaymentModal'
import { ShortcutsHelp } from '@/components/pos/ShortcutsHelp'
import { useCart } from '@/hooks/useCart'
import { useHotkeys, type HotkeyHandler } from '@/hooks/useHotkeys'
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner'
import { useProducts } from '@/hooks/useProducts'
import { useToast } from '@/context/ToastContext'
import { api, ApiError } from '@/lib/api'
import { formatCurrency } from '@/lib/format'
import type { PaymentMethod, Product } from '@/types'

interface PaymentDetails {
  method: PaymentMethod
  tendered?: number
  reference?: string
}

export function POS() {
  const [query, setQuery] = useState('')
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const cart = useCart()
  const searchRef = useRef<SearchBarHandle>(null)
  const toast = useToast()
  const { products, loading: productsLoading } = useProducts()

  // ── Lookups ─────────────────────────────────────────────────────────
  const productByBarcode = useMemo(() => {
    const map = new Map<string, Product>()
    for (const p of products) if (p.barcode) map.set(p.barcode, p)
    return map
  }, [products])

  const findFirstMatch = useCallback(
    (q: string): Product | undefined => {
      const needle = q.trim().toLowerCase()
      if (!needle) return undefined
      return products.find(
        (p) =>
          p.name.toLowerCase().includes(needle) ||
          p.nameBn?.toLowerCase().includes(needle) ||
          p.sku.toLowerCase().includes(needle) ||
          p.barcode?.includes(needle),
      )
    },
    [products],
  )

  // ── Add product → cart with feedback ────────────────────────────────
  const handleAddProduct = useCallback(
    (product: Product) => {
      if (product.stock <= 0) {
        toast.error('Out of stock', `${product.name} has no stock`)
        return
      }
      cart.addProduct(product)
    },
    [cart, toast],
  )

  // ── Search submit (Enter in search box) ─────────────────────────────
  const handleSearchEnter = useCallback(() => {
    const trimmed = query.trim()
    if (!trimmed) return
    if (/^\d{6,}$/.test(trimmed)) {
      const direct = productByBarcode.get(trimmed)
      if (direct) {
        handleAddProduct(direct)
        setQuery('')
        return
      }
    }
    const match = findFirstMatch(trimmed)
    if (match) {
      handleAddProduct(match)
      setQuery('')
    } else {
      toast.warning('No match', `Nothing matches "${trimmed}"`)
    }
  }, [query, productByBarcode, findFirstMatch, handleAddProduct, toast])

  // ── Hardware barcode scanner ────────────────────────────────────────
  useBarcodeScanner({
    onScan: (code) => {
      const product = productByBarcode.get(code)
      if (product) {
        handleAddProduct(product)
        setQuery('')
      } else {
        toast.warning('Unknown barcode', code)
      }
    },
    enabled: !paymentOpen && !helpOpen,
  })

  // ── Charge flow ─────────────────────────────────────────────────────
  const handleCharge = useCallback(() => {
    if (cart.lines.length === 0) return
    setPaymentOpen(true)
  }, [cart.lines.length])

  const handlePaymentSubmit = useCallback(
    async ({ method, tendered, reference }: PaymentDetails) => {
      const payload = {
        items: cart.lines.map((l) => ({
          productId: l.product.id,
          quantity: l.quantity,
        })),
        paymentMethod: method,
        discount: cart.discount,
        ...(tendered !== undefined && { tendered }),
        ...(reference && { paymentReference: reference }),
        clientId:
          (globalThis.crypto as Crypto | undefined)?.randomUUID?.() ??
          `pos-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      }

      try {
        await api.post('/api/orders', payload)
        // PaymentModal advances to its success stage on resolve.
        // Stock updates & toast trigger from socket events.
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : 'Failed to create order'
        toast.error('Order failed', msg)
        throw err
      }
    },
    [cart.lines, cart.discount, toast],
  )

  const handlePaymentComplete = useCallback(() => {
    toast.success('Order completed', `Charged ${formatCurrency(cart.total)}`)
    cart.clear()
    setPaymentOpen(false)
    searchRef.current?.focus()
  }, [cart, toast])

  const handleHold = useCallback(() => {
    if (cart.lines.length === 0) return
    cart.hold()
    toast.info('Cart held', 'Recall it any time from the Holds button')
  }, [cart, toast])

  // ── Hotkeys (global) ────────────────────────────────────────────────
  const hotkeys: HotkeyHandler[] = useMemo(
    () => [
      {
        key: 'F1',
        handler: (e) => {
          e.preventDefault()
          searchRef.current?.focus()
        },
        allowInInput: true,
      },
      {
        key: 'F3',
        handler: (e) => {
          e.preventDefault()
          const el = document.querySelector<HTMLInputElement>('input[placeholder="0"]')
          el?.focus()
          el?.select()
        },
        allowInInput: true,
      },
      {
        key: 'F4',
        handler: (e) => {
          e.preventDefault()
          handleHold()
        },
        allowInInput: true,
      },
      {
        key: 'Enter',
        handler: (e) => {
          if (cart.lines.length === 0 || paymentOpen) return
          e.preventDefault()
          handleCharge()
        },
      },
      { key: 'ArrowDown', handler: (e) => { e.preventDefault(); cart.moveSelection(1) } },
      { key: 'ArrowUp', handler: (e) => { e.preventDefault(); cart.moveSelection(-1) } },
      { key: '+', handler: () => cart.adjustSelected(1) },
      { key: '=', handler: () => cart.adjustSelected(1) },
      { key: '-', handler: () => cart.adjustSelected(-1) },
      { key: 'Delete', handler: () => cart.removeSelected() },
      {
        key: '?',
        shift: true,
        handler: (e) => {
          e.preventDefault()
          setHelpOpen(true)
        },
      },
    ],
    [cart, handleCharge, handleHold, paymentOpen],
  )

  useHotkeys(hotkeys, !paymentOpen && !helpOpen)

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <>
      <div className="grid h-[calc(100vh-4rem)] grid-cols-1 lg:grid-cols-[1fr_420px]">
        <section className="flex min-h-0 flex-col gap-4 border-r border-border p-6">
          <SearchBar
            ref={searchRef}
            value={query}
            onChange={setQuery}
            onEnter={handleSearchEnter}
          />
          <div className="min-h-0 flex-1">
            <ProductGrid
              products={products}
              query={query}
              loading={productsLoading}
              onAdd={handleAddProduct}
            />
          </div>
        </section>

        <Cart
          lines={cart.lines}
          selectedId={cart.selectedId}
          subtotal={cart.subtotal}
          discount={cart.discount}
          tax={cart.tax}
          total={cart.total}
          itemCount={cart.itemCount}
          held={cart.held}
          onSelect={cart.setSelectedId}
          onQuantityChange={cart.updateQuantity}
          onRemove={cart.remove}
          onClear={cart.clear}
          onDiscountChange={cart.setDiscount}
          onCharge={handleCharge}
          onHold={handleHold}
          onRecall={cart.recall}
          onDropHeld={cart.dropHeld}
          onShowHelp={() => setHelpOpen(true)}
        />
      </div>

      <PaymentModal
        open={paymentOpen}
        total={cart.total}
        onClose={() => setPaymentOpen(false)}
        onSubmit={handlePaymentSubmit}
        onComplete={handlePaymentComplete}
      />

      <ShortcutsHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  )
}
