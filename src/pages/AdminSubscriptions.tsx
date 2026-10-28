import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  Inbox,
  Plus,
  RefreshCw,
  Search,
  X,
  XCircle,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useSocketEvent } from '@/context/SocketContext'
import { api, ApiError } from '@/lib/api'
import { formatCurrency, formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'

type Status = 'pending' | 'active' | 'expired' | 'rejected'
type Filter = 'all' | Status

interface AdminSubscription {
  id: string
  plan: string
  amount: number
  paidAmount: number
  paymentMethod: string
  transactionId: string
  screenshot?: string
  status: Status
  startDate?: string
  endDate?: string
  rejectionReason?: string
  notes?: string
  createdAt: string
  daysRemaining?: number
  shop?: {
    id: string
    name: string
    phone?: string
    owner?: { name: string; email: string; phone?: string }
  }
  verifiedBy?: { name: string; email: string }
}

const STATUS_TONE: Record<Status, 'success' | 'warning' | 'danger' | 'neutral'> = {
  active: 'success',
  pending: 'warning',
  expired: 'danger',
  rejected: 'danger',
}

const STATUS_LABEL: Record<Status, string> = {
  active: 'Active',
  pending: 'Pending',
  expired: 'Expired',
  rejected: 'Rejected',
}

export function AdminSubscriptions() {
  const { user } = useAuth()
  const toast = useToast()

  const [filter, setFilter] = useState<Filter>('pending')
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<AdminSubscription[]>([])
  const [summary, setSummary] = useState<Record<Status, number>>({
    pending: 0,
    active: 0,
    expired: 0,
    rejected: 0,
  })
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)

  const [rejectTarget, setRejectTarget] = useState<AdminSubscription | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const [extendTarget, setExtendTarget] = useState<AdminSubscription | null>(null)
  const [extendDays, setExtendDays] = useState('30')

  const isAdmin = user?.role === 'admin'

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      if (filter !== 'all') qs.set('status', filter)
      if (query.trim()) qs.set('q', query.trim())
      qs.set('limit', '100')
      const res = await api.get<AdminSubscription[]>(`/api/admin/subscriptions?${qs}`)
      // api.get returns the data field; we need meta too — use raw fetch fallback
      setItems(res)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load'
      toast.error('Failed to load', msg)
    } finally {
      setLoading(false)
    }
  }, [filter, query, toast])

  // Use a separate fetch for the meta/summary block (one extra call kept simple)
  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/admin/subscriptions?limit=1`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('dokanpro-token') ?? ''}`,
          },
        },
      )
      const json = await res.json()
      if (json?.meta?.summary) setSummary(json.meta.summary)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    if (!isAdmin) return
    fetchList()
    fetchSummary()
  }, [isAdmin, fetchList, fetchSummary])

  // Live updates for new submissions / state changes
  useSocketEvent('subscription:submitted', () => {
    toast.info('New subscription request')
    fetchList()
    fetchSummary()
  })
  useSocketEvent('subscription:updated', () => {
    fetchSummary()
  })

  const onApprove = async (sub: AdminSubscription) => {
    setActionId(sub.id)
    try {
      await api.post(`/api/admin/subscriptions/${sub.id}/approve`)
      toast.success('Approved', `${sub.shop?.name ?? 'Shop'} is now active`)
      await fetchList()
      await fetchSummary()
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Approval failed'
      toast.error('Approval failed', msg)
    } finally {
      setActionId(null)
    }
  }

  const onReject = async () => {
    if (!rejectTarget) return
    setActionId(rejectTarget.id)
    try {
      await api.post(`/api/admin/subscriptions/${rejectTarget.id}/reject`, {
        reason: rejectReason.trim(),
      })
      toast.success('Rejected', `${rejectTarget.shop?.name ?? 'Shop'} notified`)
      setRejectTarget(null)
      setRejectReason('')
      await fetchList()
      await fetchSummary()
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Rejection failed'
      toast.error('Rejection failed', msg)
    } finally {
      setActionId(null)
    }
  }

  const onExtend = async () => {
    if (!extendTarget) return
    const days = Number(extendDays)
    if (!Number.isFinite(days) || days <= 0) {
      toast.error('Enter a positive number of days')
      return
    }
    setActionId(extendTarget.id)
    try {
      await api.post(`/api/admin/subscriptions/${extendTarget.id}/extend`, { days })
      toast.success('Subscription extended', `+${days} days`)
      setExtendTarget(null)
      setExtendDays('30')
      await fetchList()
      await fetchSummary()
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Extension failed'
      toast.error('Extension failed', msg)
    } finally {
      setActionId(null)
    }
  }

  const filterButtons: { value: Filter; label: string; tone?: 'warning' | 'success' | 'danger' }[] = useMemo(
    () => [
      { value: 'pending', label: `Pending (${summary.pending})`, tone: 'warning' },
      { value: 'active', label: `Active (${summary.active})`, tone: 'success' },
      { value: 'expired', label: `Expired (${summary.expired})`, tone: 'danger' },
      { value: 'rejected', label: `Rejected (${summary.rejected})`, tone: 'danger' },
      { value: 'all', label: 'All' },
    ],
    [summary],
  )

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-body text-text">Admin access required</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 p-6 lg:p-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h1 text-text">Subscription requests</h1>
          <p className="mt-1 text-body text-text-muted">
            Verify manual bKash / Nagad payments and activate shops
          </p>
        </div>
        <Button
          variant="outline"
          leftIcon={<RefreshCw className="h-4 w-4" />}
          onClick={() => {
            fetchList()
            fetchSummary()
          }}
        >
          Refresh
        </Button>
      </header>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryTile label="Pending" value={summary.pending} icon={Clock} tone="warning" />
        <SummaryTile label="Active" value={summary.active} icon={CheckCircle2} tone="success" />
        <SummaryTile label="Expired" value={summary.expired} icon={XCircle} tone="danger" />
        <SummaryTile label="Rejected" value={summary.rejected} icon={XCircle} tone="neutral" />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-text-muted" />
            <CardTitle className="text-h3">Filter</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex flex-1 flex-wrap gap-2">
              {filterButtons.map((b) => (
                <button
                  key={b.value}
                  type="button"
                  onClick={() => setFilter(b.value)}
                  className={cn(
                    'h-9 rounded-full border px-4 text-body-sm font-medium transition-colors',
                    filter === b.value
                      ? 'border-primary bg-primary text-white shadow-sm'
                      : 'border-border bg-surface text-text-muted hover:border-text-faint hover:text-text',
                  )}
                >
                  {b.label}
                </button>
              ))}
            </div>
            <div className="lg:w-64">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchList()}
                placeholder="Search transaction ID..."
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>{items.length} request{items.length === 1 ? '' : 's'}</CardTitle>
            <CardDescription>
              {filter === 'pending' ? 'Awaiting verification' : `Filter: ${filter}`}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {loading ? (
            <div className="px-5 py-12 text-center text-body-sm text-text-muted">Loading…</div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-5 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-2">
                <Inbox className="h-6 w-6 text-text-muted" />
              </div>
              <p className="text-body font-medium text-text">Nothing here</p>
              <p className="text-body-sm text-text-muted">
                {filter === 'pending' ? 'No pending requests' : 'No matching records'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-body-sm">
                <thead>
                  <tr className="border-y border-border bg-surface-2/50 text-left">
                    <th className="px-5 py-2.5 text-overline uppercase text-text-muted">Shop</th>
                    <th className="px-5 py-2.5 text-overline uppercase text-text-muted">Plan</th>
                    <th className="px-5 py-2.5 text-overline uppercase text-text-muted">Method</th>
                    <th className="px-5 py-2.5 text-overline uppercase text-text-muted">Trx ID</th>
                    <th className="px-5 py-2.5 text-overline uppercase text-text-muted">Paid</th>
                    <th className="px-5 py-2.5 text-overline uppercase text-text-muted">Status</th>
                    <th className="px-5 py-2.5 text-overline uppercase text-text-muted">Submitted</th>
                    <th className="px-5 py-2.5 text-right text-overline uppercase text-text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((sub) => {
                    const busy = actionId === sub.id
                    return (
                      <tr key={sub.id} className="border-b border-border last:border-0 hover:bg-surface-2/40">
                        <td className="px-5 py-3">
                          <p className="font-medium text-text">{sub.shop?.name ?? '—'}</p>
                          {sub.shop?.owner?.email && (
                            <p className="text-caption text-text-muted">{sub.shop.owner.email}</p>
                          )}
                        </td>
                        <td className="px-5 py-3 capitalize text-text">{sub.plan}</td>
                        <td className="px-5 py-3 capitalize">
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-caption font-semibold',
                              sub.paymentMethod === 'bkash'
                                ? 'bg-bkash/15 text-bkash'
                                : 'bg-nagad/15 text-nagad',
                            )}
                          >
                            {sub.paymentMethod}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-text-muted">{sub.transactionId}</span>
                            {sub.screenshot && (
                              <a
                                href={sub.screenshot}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-6 w-6 items-center justify-center rounded-sm text-text-muted hover:bg-surface-2 hover:text-primary"
                                aria-label="View screenshot"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3 tabular text-text">{formatCurrency(sub.paidAmount)}</td>
                        <td className="px-5 py-3">
                          <Badge tone={STATUS_TONE[sub.status]}>{STATUS_LABEL[sub.status]}</Badge>
                        </td>
                        <td className="px-5 py-3 text-text-muted">
                          {formatRelativeTime(new Date(sub.createdAt))}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {sub.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  loading={busy}
                                  leftIcon={<Check className="h-3.5 w-3.5" />}
                                  onClick={() => onApprove(sub)}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  leftIcon={<X className="h-3.5 w-3.5" />}
                                  onClick={() => {
                                    setRejectTarget(sub)
                                    setRejectReason('')
                                  }}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            {(sub.status === 'active' || sub.status === 'expired') && (
                              <Button
                                size="sm"
                                variant="outline"
                                leftIcon={<Plus className="h-3.5 w-3.5" />}
                                onClick={() => {
                                  setExtendTarget(sub)
                                  setExtendDays('30')
                                }}
                              >
                                Extend
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject modal */}
      <Modal
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title="Reject payment"
        description="The shop owner will see this reason and can submit a new payment."
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={onReject} loading={actionId === rejectTarget?.id}>
              Confirm rejection
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {rejectTarget && (
            <div className="rounded-sm border border-border bg-surface-2/40 p-3 text-body-sm">
              <p className="text-text">{rejectTarget.shop?.name}</p>
              <p className="text-caption text-text-muted">
                Trx <span className="font-mono">{rejectTarget.transactionId}</span> ·{' '}
                {formatCurrency(rejectTarget.paidAmount)}
              </p>
            </div>
          )}
          <label className="block">
            <span className="mb-1.5 block text-caption font-semibold uppercase text-text-muted">
              Reason
            </span>
            <Input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Transaction ID not found in merchant statement"
            />
          </label>
        </div>
      </Modal>

      {/* Extend modal */}
      <Modal
        open={!!extendTarget}
        onClose={() => setExtendTarget(null)}
        title="Extend subscription"
        description={
          extendTarget?.endDate
            ? `Current expiry: ${new Date(extendTarget.endDate).toLocaleDateString()}`
            : 'No current expiry'
        }
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setExtendTarget(null)}>
              Cancel
            </Button>
            <Button onClick={onExtend} loading={actionId === extendTarget?.id}>
              Add days
            </Button>
          </>
        }
      >
        <label className="block">
          <span className="mb-1.5 block text-caption font-semibold uppercase text-text-muted">
            Days to add
          </span>
          <Input
            type="number"
            min={1}
            value={extendDays}
            onChange={(e) => setExtendDays(e.target.value)}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {[7, 30, 90, 365].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setExtendDays(String(d))}
                className="h-8 rounded-sm border border-border bg-surface px-3 text-body-sm hover:border-primary hover:text-primary"
              >
                +{d}d
              </button>
            ))}
          </div>
        </label>
      </Modal>
    </div>
  )
}

function SummaryTile({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string
  value: number
  icon: typeof Clock
  tone: 'warning' | 'success' | 'danger' | 'neutral'
}) {
  const toneClass: Record<typeof tone, string> = {
    warning: 'bg-warning-soft text-warning dark:bg-warning/15',
    success: 'bg-success-soft text-success dark:bg-success/15',
    danger: 'bg-danger-soft text-danger dark:bg-danger/15',
    neutral: 'bg-surface-2 text-text-muted',
  }
  return (
    <div className="rounded-md border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-body-sm text-text-muted">{label}</p>
        <span className={cn('flex h-8 w-8 items-center justify-center rounded-sm', toneClass[tone])}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 text-h1 tabular text-text">{value}</p>
    </div>
  )
}
