import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useSubscription } from '@/context/SubscriptionContext'

interface Props {
  children: React.ReactNode
}

/**
 * Blocks access to billable features when the shop's subscription is not
 * active. SaaS admins always pass. Redirects to /subscription with the
 * intended destination preserved.
 */
export function SubscriptionGuard({ children }: Props) {
  const { isActive, adminBypass, loading } = useSubscription()
  const location = useLocation()

  if (loading && !adminBypass) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    )
  }

  if (!isActive) {
    return <Navigate to="/subscription" replace state={{ from: location }} />
  }

  return <>{children}</>
}
