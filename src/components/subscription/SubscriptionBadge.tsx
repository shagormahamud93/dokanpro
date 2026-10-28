import { Link } from 'react-router-dom'
import { Sparkles, Clock, AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react'
import { useSubscription } from '@/context/SubscriptionContext'
import { cn } from '@/lib/utils'

/**
 * Compact subscription state pill rendered in the Topbar.
 * Hidden for SaaS admins (they bypass billing entirely).
 */
export function SubscriptionBadge() {
  const { current, pending, daysLeft, adminBypass } = useSubscription()

  if (adminBypass) {
    return (
      <span className="hidden items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1.5 text-caption font-medium text-primary md:inline-flex">
        <ShieldCheck className="h-3.5 w-3.5" />
        Admin
      </span>
    )
  }

  if (pending) {
    return (
      <Link
        to="/subscription"
        className="hidden items-center gap-1.5 rounded-full bg-warning-soft px-3 py-1.5 text-caption font-medium text-warning hover:bg-warning/15 md:inline-flex dark:bg-warning/15"
      >
        <Clock className="h-3.5 w-3.5" />
        Pending approval
      </Link>
    )
  }

  if (!current || current.status !== 'active') {
    return (
      <Link
        to="/subscription"
        className="hidden items-center gap-1.5 rounded-full bg-danger-soft px-3 py-1.5 text-caption font-medium text-danger hover:bg-danger/15 md:inline-flex dark:bg-danger/15"
      >
        <AlertTriangle className="h-3.5 w-3.5" />
        Renew now
      </Link>
    )
  }

  const urgent = (daysLeft ?? 99) <= 5

  return (
    <Link
      to="/subscription"
      className={cn(
        'hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-caption font-medium transition-colors md:inline-flex',
        urgent
          ? 'bg-warning-soft text-warning hover:bg-warning/15 dark:bg-warning/15'
          : 'bg-success-soft text-success hover:bg-success/15 dark:bg-success/15',
      )}
    >
      {urgent ? <Sparkles className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
      {daysLeft !== null ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} left` : 'Active'}
    </Link>
  )
}
