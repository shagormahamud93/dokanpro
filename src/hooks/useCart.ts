import { useCallback, useMemo, useState } from 'react'
import type { CartLine, Product } from '@/types'

interface HeldCart {
  id: string
  label: string
  lines: CartLine[]
  discount: number
  total: number
  heldAt: Date
}

const TAX_RATE = 0.05

export function useCart() {
  const [lines, setLines] = useState<CartLine[]>([])
  const [discount, setDiscount] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [held, setHeld] = useState<HeldCart[]>([])

  const addProduct = useCallback((product: Product) => {
    if (product.stock <= 0) return
    setLines((prev) => {
      const existing = prev.find((l) => l.product.id === product.id)
      if (existing) {
        return prev.map((l) =>
          l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l,
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
    setSelectedId(product.id)
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setLines((prev) => {
      if (quantity <= 0) return prev.filter((l) => l.product.id !== productId)
      return prev.map((l) => (l.product.id === productId ? { ...l, quantity } : l))
    })
  }, [])

  const remove = useCallback((productId: string) => {
    setLines((prev) => prev.filter((l) => l.product.id !== productId))
    setSelectedId((curr) => (curr === productId ? null : curr))
  }, [])

  const clear = useCallback(() => {
    setLines([])
    setDiscount(0)
    setSelectedId(null)
  }, [])

  const moveSelection = useCallback((dir: 1 | -1) => {
    setLines((prev) => {
      if (prev.length === 0) return prev
      setSelectedId((curr) => {
        if (!curr) return prev[dir === 1 ? 0 : prev.length - 1].product.id
        const idx = prev.findIndex((l) => l.product.id === curr)
        const next = (idx + dir + prev.length) % prev.length
        return prev[next].product.id
      })
      return prev
    })
  }, [])

  const adjustSelected = useCallback(
    (delta: number) => {
      if (!selectedId) return
      setLines((prev) =>
        prev
          .map((l) =>
            l.product.id === selectedId
              ? { ...l, quantity: Math.max(0, l.quantity + delta) }
              : l,
          )
          .filter((l) => l.quantity > 0),
      )
    },
    [selectedId],
  )

  const removeSelected = useCallback(() => {
    if (!selectedId) return
    remove(selectedId)
  }, [remove, selectedId])

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0),
    [lines],
  )

  const tax = useMemo(
    () => Math.round(Math.max(0, subtotal - discount) * TAX_RATE),
    [subtotal, discount],
  )

  const total = Math.max(0, subtotal - discount + tax)
  const itemCount = useMemo(() => lines.reduce((sum, l) => sum + l.quantity, 0), [lines])

  const hold = useCallback(
    (label?: string) => {
      if (lines.length === 0) return
      const snapshot: HeldCart = {
        id: `H-${Date.now()}`,
        label: label || `Hold #${held.length + 1}`,
        lines,
        discount,
        total,
        heldAt: new Date(),
      }
      setHeld((prev) => [snapshot, ...prev])
      clear()
    },
    [lines, discount, total, held.length, clear],
  )

  const recall = useCallback((id: string) => {
    setHeld((prev) => {
      const found = prev.find((h) => h.id === id)
      if (!found) return prev
      setLines(found.lines)
      setDiscount(found.discount)
      setSelectedId(null)
      return prev.filter((h) => h.id !== id)
    })
  }, [])

  const dropHeld = useCallback((id: string) => {
    setHeld((prev) => prev.filter((h) => h.id !== id))
  }, [])

  return {
    lines,
    selectedId,
    setSelectedId,
    addProduct,
    updateQuantity,
    remove,
    clear,
    moveSelection,
    adjustSelected,
    removeSelected,
    discount,
    setDiscount,
    subtotal,
    tax,
    total,
    itemCount,
    held,
    hold,
    recall,
    dropHeld,
  }
}
