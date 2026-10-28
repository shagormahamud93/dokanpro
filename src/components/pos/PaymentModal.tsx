import { useEffect, useMemo, useRef, useState } from 'react'
import { Banknote, Check, CreditCard, Printer, Smartphone, MessageSquare, Mail } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Kbd } from '@/components/ui/Kbd'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'
import type { PaymentMethod } from '@/types'

interface PaymentDetails {
  method: PaymentMethod
  tendered?: number
  reference?: string
}

interface PaymentModalProps {
  open: boolean
  total: number
  onClose: () => void
  onComplete: (method: PaymentMethod) => void
  /**
   * Submit the payment to the server. Resolves on success → modal advances
   * to the success stage. Rejects on failure → modal returns to input stage
   * (the page is responsible for surfacing the error toast).
   */
  onSubmit?: (details: PaymentDetails) => Promise<void>
}

type Stage = 'input' | 'processing' | 'success'

const methods: {
  id: PaymentMethod
  label: string
  icon: typeof Banknote
  color: string
  hotkey: string
}[] = [
  { id: 'cash', label: 'Cash', icon: Banknote, color: 'bg-success', hotkey: 'F9' },
  { id: 'bkash', label: 'bKash', icon: Smartphone, color: 'bg-bkash', hotkey: 'F10' },
  { id: 'nagad', label: 'Nagad', icon: Smartphone, color: 'bg-nagad', hotkey: 'F11' },
  { id: 'card', label: 'Card', icon: CreditCard, color: 'bg-primary', hotkey: 'F12' },
]

const QUICK_AMOUNTS = [500, 1000, 2000, 5000]

export function PaymentModal({ open, total, onClose, onComplete, onSubmit }: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [stage, setStage] = useState<Stage>('input')
  const [tendered, setTendered] = useState('')
  const [trxId, setTrxId] = useState('')

  const inputRef = useRef<HTMLInputElement>(null)

  const change = useMemo(() => {
    const t = Number(tendered) || 0
    return Math.max(0, t - total)
  }, [tendered, total])

  const canConfirm = useMemo(() => {
    if (method === 'cash') return Number(tendered) >= total
    if (method === 'bkash' || method === 'nagad') return trxId.trim().length >= 4
    return true
  }, [method, tendered, trxId, total])

  // Reset state on open / method change
  useEffect(() => {
    if (!open) return
    setStage('input')
    setTendered('')
    setTrxId('')
  }, [open])

  useEffect(() => {
    if (!open || stage !== 'input') return
    const id = window.setTimeout(() => inputRef.current?.focus(), 50)
    return () => window.clearTimeout(id)
  }, [open, method, stage])

  const handleConfirm = async () => {
    if (!canConfirm) return
    setStage('processing')
    try {
      if (onSubmit) {
        await onSubmit({
          method,
          tendered: method === 'cash' ? Number(tendered) || 0 : undefined,
          reference: method === 'bkash' || method === 'nagad' ? trxId.trim() : undefined,
        })
      }
      setStage('success')
    } catch {
      // Page surfaces the error via toast; rewind to input
      setStage('input')
    }
  }

  const handleDone = () => {
    onComplete(method)
    onClose()
  }

  // Modal-scoped Enter handler
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && stage === 'input' && canConfirm) {
        e.preventDefault()
        handleConfirm()
      }
      if (e.key === 'Enter' && stage === 'success') {
        e.preventDefault()
        handleDone()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      hideClose={stage !== 'input'}
      dismissable={stage === 'input'}
      title={
        stage === 'success' ? null : (
          <span className="flex items-center gap-2">
            Payment
            <span className="text-text-muted">·</span>
            <span className="tabular text-primary">{formatCurrency(total)}</span>
          </span>
        )
      }
      description={stage === 'input' ? 'Choose a method and confirm' : undefined}
    >
      {stage === 'success' ? (
        <SuccessView total={total} method={method} onDone={handleDone} />
      ) : (
        <div className="space-y-5">
          {/* Method picker */}
          <div className="grid grid-cols-2 gap-2">
            {methods.map((m) => {
              const active = method === m.id
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id)}
                  disabled={stage === 'processing'}
                  className={cn(
                    'group flex h-16 items-center gap-3 rounded-sm border px-4 transition-all duration-150 active:scale-[0.98]',
                    active
                      ? cn(m.color, 'border-transparent text-white shadow-md')
                      : 'border-border bg-surface text-text hover:border-text-faint hover:bg-surface-2',
                  )}
                >
                  <m.icon className="h-5 w-5 shrink-0" />
                  <span className="flex-1 text-left text-body font-semibold">{m.label}</span>
                  <Kbd className={cn(active && 'border-white/30 bg-white/15 text-white')}>
                    {m.hotkey}
                  </Kbd>
                </button>
              )
            })}
          </div>

          {/* Method-specific input */}
          <div className="rounded-sm border border-border bg-surface-2/40 p-4">
            {method === 'cash' && (
              <CashInput
                inputRef={inputRef}
                tendered={tendered}
                setTendered={setTendered}
                total={total}
                change={change}
              />
            )}
            {(method === 'bkash' || method === 'nagad') && (
              <MobileMoneyInput
                inputRef={inputRef}
                method={method}
                trxId={trxId}
                setTrxId={setTrxId}
              />
            )}
            {method === 'card' && <CardInput />}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-caption text-text-muted">
              Press <Kbd>Enter</Kbd> to confirm · <Kbd>Esc</Kbd> to cancel
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose} disabled={stage === 'processing'}>
                Cancel
              </Button>
              <Button
                size="lg"
                onClick={handleConfirm}
                loading={stage === 'processing'}
                disabled={!canConfirm}
              >
                Confirm {formatCurrency(total)}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}

// ────────────────────────────────────────────────────────────────────────

function CashInput({
  inputRef,
  tendered,
  setTendered,
  total,
  change,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>
  tendered: string
  setTendered: (v: string) => void
  total: number
  change: number
}) {
  return (
    <div className="space-y-3">
      <label className="block text-caption font-semibold uppercase text-text-muted">
        Tendered amount
      </label>
      <div className="flex h-14 items-center rounded-sm border-2 border-primary/30 bg-surface px-4 focus-within:border-primary">
        <span className="mr-2 text-h2 text-text-muted">৳</span>
        <input
          ref={inputRef}
          type="number"
          inputMode="numeric"
          value={tendered}
          onChange={(e) => setTendered(e.target.value)}
          placeholder="0"
          className="flex-1 border-0 bg-transparent text-h2 font-bold tabular text-text placeholder:text-text-faint focus:outline-none focus:ring-0"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_AMOUNTS.map((amt) => (
          <button
            key={amt}
            type="button"
            onClick={() => setTendered(String(amt))}
            className="h-9 rounded-sm border border-border bg-surface px-3 text-body-sm font-medium text-text transition-colors hover:border-primary hover:bg-primary-soft hover:text-primary"
          >
            ৳{amt.toLocaleString()}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setTendered(String(total))}
          className="h-9 rounded-sm border border-primary bg-primary-soft px-3 text-body-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white"
        >
          Exact
        </button>
      </div>

      <div className="flex items-baseline justify-between rounded-sm bg-surface px-4 py-3">
        <span className="text-body-sm text-text-muted">Change to return</span>
        <span
          className={cn(
            'tabular text-h2 font-bold',
            change > 0 ? 'text-success' : 'text-text-muted',
          )}
        >
          {formatCurrency(change)}
        </span>
      </div>
    </div>
  )
}

function MobileMoneyInput({
  inputRef,
  method,
  trxId,
  setTrxId,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>
  method: 'bkash' | 'nagad'
  trxId: string
  setTrxId: (v: string) => void
}) {
  const isBkash = method === 'bkash'
  return (
    <div className="space-y-3">
      <label className="block text-caption font-semibold uppercase text-text-muted">
        {isBkash ? 'bKash' : 'Nagad'} Transaction ID
      </label>
      <input
        ref={inputRef}
        value={trxId}
        onChange={(e) => setTrxId(e.target.value.toUpperCase())}
        placeholder="e.g. 8KX2A91PQR"
        className="block h-12 w-full rounded-sm border-2 border-border bg-surface px-3 font-mono text-body-lg text-text placeholder:text-text-faint focus:border-primary focus:outline-none focus:ring-0"
      />
      <p className="text-caption text-text-muted">
        Customer sends to merchant number ·{' '}
        <span className={cn('font-semibold', isBkash ? 'text-bkash' : 'text-nagad')}>
          01712-345678
        </span>
      </p>
    </div>
  )
}

function CardInput() {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-primary-soft text-primary">
        <CreditCard className="h-5 w-5" />
      </div>
      <div>
        <p className="text-body font-semibold text-text">Insert / Tap card on terminal</p>
        <p className="text-caption text-text-muted">
          Press confirm once the terminal approves the transaction
        </p>
      </div>
    </div>
  )
}

function SuccessView({
  total,
  method,
  onDone,
}: {
  total: number
  method: PaymentMethod
  onDone: () => void
}) {
  const [countdown, setCountdown] = useState(4)

  useEffect(() => {
    const id = window.setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 0)), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (countdown === 0) onDone()
  }, [countdown, onDone])

  return (
    <div className="flex flex-col items-center gap-5 py-4 text-center">
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full bg-success/30" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-success text-white shadow-lg">
          <Check className="h-10 w-10" strokeWidth={3} />
        </div>
      </div>

      <div>
        <p className="text-h2 text-text">Payment received</p>
        <p className="mt-1 text-body-sm text-text-muted">
          {formatCurrency(total)} · {method === 'bkash' ? 'bKash' : method === 'nagad' ? 'Nagad' : method}
        </p>
      </div>

      <div className="flex w-full flex-wrap justify-center gap-2">
        <Button variant="outline" leftIcon={<Printer className="h-4 w-4" />}>
          Print
        </Button>
        <Button variant="outline" leftIcon={<MessageSquare className="h-4 w-4" />}>
          SMS
        </Button>
        <Button variant="outline" leftIcon={<Mail className="h-4 w-4" />}>
          Email
        </Button>
      </div>

      <Button size="lg" fullWidth onClick={onDone}>
        New Sale ({countdown}s)
      </Button>
    </div>
  )
}
