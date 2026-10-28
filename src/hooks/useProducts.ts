import { useCallback, useEffect, useState } from 'react'
import { api, ApiError } from '@/lib/api'
import { useSocketEvent } from '@/context/SocketContext'
import type { Product } from '@/types'

interface ApiProduct {
  id?: string
  _id?: string
  name: string
  nameBn?: string
  sku: string
  barcode?: string
  category: string
  price: number
  stock: number
  unit: 'pcs' | 'kg' | 'ltr' | 'dz'
  image?: string
}

const normalize = (p: ApiProduct): Product => ({
  id: p.id ?? p._id ?? '',
  name: p.name,
  nameBn: p.nameBn,
  sku: p.sku,
  barcode: p.barcode,
  category: p.category,
  price: p.price,
  stock: p.stock,
  unit: p.unit,
  image: p.image,
})

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await api.get<ApiProduct[]>('/api/products?limit=200')
      setProducts(list.map(normalize))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  // Real-time stock updates
  useSocketEvent<{ productId: string; stock: number }>('stock:updated', (payload) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === payload.productId ? { ...p, stock: payload.stock } : p)),
    )
  })

  // Real-time product edits (admin updating price/etc.)
  useSocketEvent<ApiProduct>('product:updated', (payload) => {
    const next = normalize(payload)
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === next.id)
      if (idx === -1) return [...prev, next]
      const copy = prev.slice()
      copy[idx] = next
      return copy
    })
  })

  return { products, loading, error, refetch, setProducts }
}
