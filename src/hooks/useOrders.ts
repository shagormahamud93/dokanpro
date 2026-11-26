
import { useCallback, useEffect, useState } from 'react'
import { api, ApiError } from '@/lib/api'
import type { PaymentMethod } from '@/types'

export interface OrderItem {
  product: string
  name: string
  sku: string
  price: number
  quantity: number
  lineTotal: number
}

export interface Order {
  id: string
  orderNumber: string
  clientId?: string
  cashier?: {
    _id: string
    name: string
    email: string
    role: string
  }
  items: OrderItem[]
  subtotal: number
  discount: number
  tax: number
  total: number
  paymentMethod: PaymentMethod
  tendered?: number
  change?: number
  status: 'completed' | 'pending' | 'cancelled' | 'refunded'
  createdAt: string
  updatedAt: string
}

interface OrdersResponse {
  data: Order[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [meta, setMeta] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.get<OrdersResponse>(
        '/api/orders?page=1&limit=50',
      )

      setOrders(response.data)
      setMeta(response.meta)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Failed to load orders',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return {
    orders,
    loading,
    error,
    meta,
    refetch,
    setOrders,
  }
}
