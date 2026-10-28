import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, X } from 'lucide-react'
import { useSubscription } from '@/context/SubscriptionContext'
import { cn } from '@/lib/utils'

const WARN_AT_DAYS = 5

/**
 * Persistent banner shown above the page content when subscription is
 * about to expire (≤5 days). Dismissible per-session.
 */
export function ExpiryBanner() {
  const { current, daysLeft, adminBypass } = useSubscription()
  const [dismissed, setDismissed] = useState(false)

  if (
    adminBypass ||
    dismissed ||
    !current ||
    current.status !== 'active' ||
    daysLeft === null ||
    daysLeft > WARN_AT_DAYS
  ) {
    return null
  }

  const urgent = daysLeft <= 1

  return (
    <div
      className={cn(
        'flex items-center gap-3 border-b px-6 py-2.5 text-body-sm',
        urgent
          ? 'border-danger/30 bg-danger-soft text-danger dark:bg-danger/15'
          : 'border-warning/30 bg-warning-soft text-warning dark:bg-warning/15',
      )}
    >
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span className="flex-1">
        Your subscription expires{' '}
        <span className="font-semibold">
          {daysLeft === 0 ? 'today' : daysLeft === 1 ? 'tomorrow' : `in ${daysLeft} days`}
        </span>
        . Renew now to avoid interruption.
      </span>
      <Link
        to="/subscription"
        className="rounded-sm border border-current/30 px-3 py-1 font-semibold transition-colors hover:bg-current/10"
      >
        Renew
      </Link>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="inline-flex h-6 w-6 items-center justify-center rounded-sm hover:bg-current/10"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
