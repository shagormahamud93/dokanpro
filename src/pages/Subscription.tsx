import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  CreditCard,
  Hash,
  Image as ImageIcon,
  Receipt,
  Send,
  Smartphone,
  XCircle,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useSubscription, type SubscriptionStatus, type SubscriptionRecord } from '@/context/SubscriptionContext'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'
import { api, ApiError } from '@/lib/api'
import { FALLBACK_MERCHANT, FALLBACK_PLANS, type Plan } from '@/lib/subscriptionPlans'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

type Method = 'bkash' | 'nagad'

interface PlansResponse {
  plans: Plan[]
  merchant: { bkash: string; nagad: string }
}

const statusBadge: Record<SubscriptionStatus, { tone: 'success' | 'warning' | 'danger' | 'neutral'; label: string }> = {
  active: { tone: 'success', label: 'Active' },
  pending: { tone: 'warning', label: 'Pending approval' },
  expired: { tone: 'danger', label: 'Expired' },
  rejected: { tone: 'danger', label: 'Rejected' },
}

export function Subscription() {
  const { user } = useAuth()
  const { shop, current, pending, history, daysLeft, adminBypass, refetch } = useSubscription()
  const toast = useToast()

  const [plans, setPlans] = useState<Plan[]>(FALLBACK_PLANS)
  const [merchant, setMerchant] = useState(FALLBACK_MERCHANT)
  const [selectedPlanId, setSelectedPlanId] = useState<Plan['id']>('monthly')
  const [method, setMethod] = useState<Method>('bkash')
  const [trxId, setTrxId] = useState('')
  const [paidAmount, setPaidAmount] = useState('')
  const [screenshot, setScreenshot] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId) ?? plans[0],
    [plans, selectedPlanId],
  )

  // Sync paid amount when plan changes (default to expected amount)
  useEffect(() => {
    if (!paidAmount && selectedPlan) setPaidAmount(String(selectedPlan.amount))
  }, [selectedPlan, paidAmount])

  // Load plans from server (best-effort, fallback already set)
  useEffect(() => {
    let cancelled = false
    api
      .get<PlansResponse>('/api/subscriptions/plans')
      .then((res) => {
        if (cancelled) return
        if (res.plans?.length) setPlans(res.plans)
        if (res.merchant) setMerchant(res.merchant)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (submitting) return
    if (!trxId.trim()) {
      toast.error('Transaction ID is required')
      return
    }
    const paid = Number(paidAmount)
    if (!Number.isFinite(paid) || paid <= 0) {
      toast.error('Enter the amount you paid')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/api/subscriptions', {
        plan: selectedPlanId,
        paymentMethod: method,
        transactionId: trxId.trim(),
        paidAmount: paid,
        screenshot: screenshot.trim() || undefined,
      })
      toast.success('Payment submitted', 'Awaiting admin verification')
      setTrxId('')
      setScreenshot('')
      await refetch()
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Submission failed'
      toast.error('Submission failed', msg)
    } finally {
      setSubmitting(false)
    }
  }

  // SaaS admin: this page isn't relevant to them
  if (adminBypass && user?.role === 'admin') {
    return (
      <div className="mx-auto max-w-3xl p-6 lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Platform admin</CardTitle>
            <CardDescription>Admins do not require a subscription. Manage all shops from the admin panel.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => (window.location.href = '/admin/subscriptions')}>
              Go to admin panel
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const merchantNumber = method === 'bkash' ? merchant.bkash : merchant.nagad
  const blocked = !current || current.status !== 'active'

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 lg:p-8">
      <header>
        <h1 className="text-h1 text-text">Subscription</h1>
        <p className="mt-1 text-body text-text-muted">
          {shop?.name ? `For ${shop.name}` : 'Manage your shop subscription'}
        </p>
      </header>

      {/* Current status */}
      <StatusCard
        current={current}
        pending={pending}
        daysLeft={daysLeft}
        blocked={blocked}
      />

      {/* Submit payment — hidden if there's a pending request */}
      {!pending && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Submit payment</CardTitle>
              <CardDescription>
                Send money to the merchant number, then enter the transaction ID below.
                An admin will verify and activate your subscription.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-6">
              {/* Step 1 — choose plan */}
              <Step
                num={1}
                title="Choose a plan"
                desc="Pick the duration you want to pay for"
              >
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {plans.map((p) => {
                    const active = selectedPlanId === p.id
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => {
                          setSelectedPlanId(p.id)
                          setPaidAmount(String(p.amount))
                        }}
                        className={cn(
                          'flex flex-col items-start gap-1 rounded-md border px-4 py-3 text-left transition-all duration-150',
                          active
                            ? 'border-primary bg-primary-soft text-primary shadow-sm'
                            : 'border-border bg-surface text-text hover:border-text-faint',
                        )}
                      >
                        <span className="text-body font-semibold">{p.name}</span>
                        <span className="text-h3 tabular">{formatCurrency(p.amount)}</span>
                        <span className="text-caption">{p.description}</span>
                      </button>
                    )
                  })}
                </div>
              </Step>

              {/* Step 2 — choose method */}
              <Step
                num={2}
                title="Send the money"
                desc={`Open ${method === 'bkash' ? 'bKash' : 'Nagad'} and "Send Money" to the number below`}
              >
                <div className="grid grid-cols-2 gap-2">
                  {(['bkash', 'nagad'] as const).map((m) => {
                    const active = method === m
                    const label = m === 'bkash' ? 'bKash' : 'Nagad'
                    const color = m === 'bkash' ? 'bg-bkash' : 'bg-nagad'
                    return (
                      <button
                        type="button"
                        key={m}
                        onClick={() => setMethod(m)}
                        className={cn(
                          'flex h-14 items-center gap-3 rounded-sm border px-4 transition-all duration-150',
                          active
                            ? cn(color, 'border-transparent text-white shadow-md')
                            : 'border-border bg-surface text-text hover:border-text-faint',
                        )}
                      >
                        <Smartphone className="h-5 w-5" />
                        <span className="text-body-sm font-semibold">{label}</span>
                      </button>
                    )
                  })}
                </div>

                <div className="mt-3 flex items-center justify-between rounded-sm border border-dashed border-border bg-surface-2/50 px-4 py-3">
                  <div>
                    <p className="text-caption uppercase text-text-muted">
                      {method === 'bkash' ? 'bKash' : 'Nagad'} merchant number
                    </p>
                    <p className="mt-0.5 font-mono text-h3 tabular text-text">{merchantNumber}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(merchantNumber)
                      toast.success('Copied to clipboard')
                    }}
                    className="rounded-sm border border-border px-3 py-1.5 text-body-sm hover:bg-surface-2"
                  >
                    Copy
                  </button>
                </div>
              </Step>

              {/* Step 3 — enter trx info */}
              <Step
                num={3}
                title="Enter transaction info"
                desc="From your payment confirmation SMS"
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className="mb-1.5 block text-caption font-semibold uppercase text-text-muted">
                      Transaction ID
                    </span>
                    <Input
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                      leftIcon={<Hash className="h-4 w-4" />}
                      placeholder="e.g. 8KX2A91PQR"
                      size="lg"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-caption font-semibold uppercase text-text-muted">
                      Paid amount (BDT)
                    </span>
                    <Input
                      type="number"
                      min={0}
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      leftIcon={<CreditCard className="h-4 w-4" />}
                      placeholder={String(selectedPlan.amount)}
                      size="lg"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-caption font-semibold uppercase text-text-muted">
                      Screenshot URL (optional)
                    </span>
                    <Input
                      type="url"
                      value={screenshot}
                      onChange={(e) => setScreenshot(e.target.value)}
                      leftIcon={<ImageIcon className="h-4 w-4" />}
                      placeholder="https://..."
                      size="lg"
                    />
                  </label>
                </div>
              </Step>

              <div className="flex items-center justify-between border-t border-border pt-4">
                <p className="text-caption text-text-muted">
                  Plan: <span className="font-semibold text-text">{selectedPlan.name}</span> ·
                  Expected: <span className="font-semibold text-text">{formatCurrency(selectedPlan.amount)}</span>
                </p>
                <Button type="submit" size="lg" loading={submitting} leftIcon={<Send className="h-4 w-4" />}>
                  Submit for verification
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Recent submissions</CardTitle>
              <CardDescription>Last 10 payment records</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="overflow-x-auto">
              <table className="w-full text-body-sm">
                <thead>
                  <tr className="border-y border-border bg-surface-2/50 text-left">
                    <th className="px-5 py-2.5 text-overline uppercase text-text-muted">Date</th>
                    <th className="px-5 py-2.5 text-overline uppercase text-text-muted">Plan</th>
                    <th className="px-5 py-2.5 text-overline uppercase text-text-muted">Method</th>
                    <th className="px-5 py-2.5 text-overline uppercase text-text-muted">Trx ID</th>
                    <th className="px-5 py-2.5 text-overline uppercase text-text-muted">Status</th>
                    <th className="px-5 py-2.5 text-right text-overline uppercase text-text-muted">Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 text-text">{new Date(h.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-3 text-text capitalize">{h.plan}</td>
                      <td className="px-5 py-3 text-text capitalize">{h.paymentMethod}</td>
                      <td className="px-5 py-3 font-mono text-text-muted">{h.transactionId}</td>
                      <td className="px-5 py-3">
                        <Badge tone={statusBadge[h.status].tone}>{statusBadge[h.status].label}</Badge>
                      </td>
                      <td className="px-5 py-3 text-right tabular text-text">
                        {formatCurrency(h.paidAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────

function StatusCard({
  current,
  pending,
  daysLeft,
  blocked,
}: {
  current: SubscriptionRecord | null
  pending: SubscriptionRecord | null
  daysLeft: number | null
  blocked: boolean
}) {
  if (pending) {
    return (
      <Card className="border-warning/30 bg-warning-soft/30 dark:bg-warning/10">
        <CardContent className="flex items-start gap-4 p-5">
          <Clock className="mt-0.5 h-6 w-6 shrink-0 text-warning" />
          <div className="flex-1">
            <p className="text-body font-semibold text-text">Pending verification</p>
            <p className="mt-1 text-body-sm text-text-muted">
              Your payment of {formatCurrency(pending.paidAmount)} via{' '}
              <span className="font-semibold capitalize">{pending.paymentMethod}</span> with
              transaction <span className="font-mono">{pending.transactionId}</span> is awaiting
              admin verification. You'll be notified once it's approved.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (current?.status === 'active') {
    const urgent = (daysLeft ?? 99) <= 5
    return (
      <Card
        className={cn(
          urgent
            ? 'border-warning/30 bg-warning-soft/30 dark:bg-warning/10'
            : 'border-success/30 bg-success-soft/30 dark:bg-success/10',
        )}
      >
        <CardContent className="flex items-start gap-4 p-5">
          <CheckCircle2 className={cn('mt-0.5 h-6 w-6 shrink-0', urgent ? 'text-warning' : 'text-success')} />
          <div className="flex-1">
            <p className="text-body font-semibold text-text">
              {urgent ? `Expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}` : 'Subscription active'}
            </p>
            <p className="mt-1 text-body-sm text-text-muted">
              {current.endDate
                ? `Valid until ${new Date(current.endDate).toLocaleDateString()}`
                : 'No expiry on file'}
              {' · '}
              <span className="capitalize">{current.plan}</span> plan
            </p>
          </div>
          <Badge tone="success" dot>
            Active
          </Badge>
        </CardContent>
      </Card>
    )
  }

  if (blocked) {
    return (
      <Card className="border-danger/30 bg-danger-soft/30 dark:bg-danger/10">
        <CardContent className="flex items-start gap-4 p-5">
          {current?.status === 'rejected' ? (
            <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-danger" />
          ) : (
            <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-danger" />
          )}
          <div className="flex-1">
            <p className="text-body font-semibold text-text">
              {current?.status === 'rejected'
                ? 'Last payment was rejected'
                : current?.status === 'expired'
                  ? 'Subscription expired'
                  : 'No active subscription'}
            </p>
            <p className="mt-1 text-body-sm text-text-muted">
              {current?.status === 'rejected'
                ? current.rejectionReason || 'Please review the details and submit a new payment.'
                : 'Submit a payment below to activate your shop.'}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-5">
        <Receipt className="mt-0.5 h-6 w-6 shrink-0 text-text-muted" />
        <div className="flex-1">
          <p className="text-body font-semibold text-text">Get started</p>
          <p className="mt-1 text-body-sm text-text-muted">
            Choose a plan below to activate your shop subscription.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function Step({
  num,
  title,
  desc,
  children,
}: {
  num: number
  title: string
  desc: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-caption font-semibold text-white">
          {num}
        </span>
        <div>
          <p className="text-body font-semibold text-text">{title}</p>
          <p className="text-caption text-text-muted">{desc}</p>
        </div>
      </div>
      <div className="ml-10">{children}</div>
    </div>
  )
}
