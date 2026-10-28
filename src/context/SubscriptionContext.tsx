import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '@/lib/api'
import { useAuth } from './AuthContext'
import { useSocketEvent } from './SocketContext'
import { useToast } from './ToastContext'

export type SubscriptionStatus = 'pending' | 'active' | 'expired' | 'rejected'

export interface SubscriptionRecord {
  id: string
  shop: string
  plan: 'monthly' | 'quarterly' | 'yearly'
  amount: number
  paidAmount: number
  paymentMethod: 'bkash' | 'nagad'
  transactionId: string
  screenshot?: string
  status: SubscriptionStatus
  startDate?: string
  endDate?: string
  daysRemaining?: number
  rejectionReason?: string
  notes?: string
  createdAt: string
  updatedAt: string
  verifiedAt?: string
}

export interface ShopRecord {
  id: string
  name: string
  phone?: string
  address?: string
}

interface MeResponse {
  shop?: ShopRecord
  current?: SubscriptionRecord | null
  pending?: SubscriptionRecord | null
  history?: SubscriptionRecord[]
  adminBypass?: boolean
  noShop?: boolean
}

interface SubscriptionContextValue {
  shop: ShopRecord | null
  current: SubscriptionRecord | null
  pending: SubscriptionRecord | null
  history: SubscriptionRecord[]
  /** Effective access: true → app is unlocked, false → blocked. */
  isActive: boolean
  /** True for SaaS admins — they bypass billing. */
  adminBypass: boolean
  loading: boolean
  daysLeft: number | null
  refetch: () => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null)

function computeDaysLeft(sub: SubscriptionRecord | null | undefined): number | null {
  if (!sub?.endDate) return null
  const ms = new Date(sub.endDate).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)))
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth()
  const toast = useToast()

  const [data, setData] = useState<MeResponse>({})
  const [loading, setLoading] = useState(false)

  const refetch = useCallback(async () => {
    if (!token || !user) {
      setData({})
      return
    }
    setLoading(true)
    try {
      const me = await api.get<MeResponse>('/api/subscriptions/me')
      setData(me)
    } catch {
      // swallow — auth context handles 401, and 402 won't fire here
    } finally {
      setLoading(false)
    }
  }, [token, user])

  // Initial + on auth change
  useEffect(() => {
    refetch()
  }, [refetch])

  // Refetch when api client signals 402
  useEffect(() => {
    const onRequired = () => {
      refetch()
    }
    window.addEventListener('subscription:required', onRequired)
    return () => window.removeEventListener('subscription:required', onRequired)
  }, [refetch])

  // Real-time socket events
  useSocketEvent<SubscriptionRecord>('subscription:approved', (sub) => {
    toast.success('Subscription active', `Valid until ${new Date(sub.endDate ?? '').toLocaleDateString()}`)
    refetch()
  })
  useSocketEvent<SubscriptionRecord>('subscription:rejected', (sub) => {
    toast.error('Payment rejected', sub.rejectionReason || 'Please review and resubmit')
    refetch()
  })
  useSocketEvent<SubscriptionRecord>('subscription:expired', () => {
    toast.warning('Subscription expired', 'Renew to keep using the POS')
    refetch()
  })
  useSocketEvent<SubscriptionRecord>('subscription:extended', (sub) => {
    toast.info('Subscription extended', `New expiry: ${new Date(sub.endDate ?? '').toLocaleDateString()}`)
    refetch()
  })

  const value: SubscriptionContextValue = useMemo(() => {
    const isAdmin = user?.role === 'admin'
    const adminBypass = !!data.adminBypass || isAdmin
    const current = data.current ?? null
    const isActive = adminBypass || current?.status === 'active'
    return {
      shop: data.shop ?? null,
      current,
      pending: data.pending ?? null,
      history: data.history ?? [],
      isActive,
      adminBypass,
      loading,
      daysLeft: computeDaysLeft(current),
      refetch,
    }
  }, [data, user, loading, refetch])

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext)
  if (!ctx) throw new Error('useSubscription must be inside SubscriptionProvider')
  return ctx
}
