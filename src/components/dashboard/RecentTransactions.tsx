import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { recentTransactions } from '@/data/mockData'
import { formatCurrency, formatRelativeTime } from '@/lib/format'
import type { PaymentMethod } from '@/types'
import { ArrowRight } from 'lucide-react'

const methodLabel: Record<PaymentMethod, string> = {
  cash: 'Cash',
  bkash: 'bKash',
  nagad: 'Nagad',
  card: 'Card',
}

const methodTone: Record<PaymentMethod, 'success' | 'primary' | 'warning' | 'accent'> = {
  cash: 'success',
  bkash: 'accent',
  nagad: 'warning',
  card: 'primary',
}

export function RecentTransactions() {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Recent Transactions</CardTitle>
          <p className="mt-1 text-body-sm text-text-muted">Last 6 orders</p>
        </div>
        <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
          View all
        </Button>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div className="overflow-x-auto">
          <table className="w-full text-body-sm">
            <thead>
              <tr className="border-y border-border bg-surface-2/50 text-left">
                <th className="px-5 py-2.5 text-overline uppercase text-text-muted">Order</th>
                <th className="px-5 py-2.5 text-overline uppercase text-text-muted">Customer</th>
                <th className="px-5 py-2.5 text-overline uppercase text-text-muted">Items</th>
                <th className="px-5 py-2.5 text-overline uppercase text-text-muted">Payment</th>
                <th className="px-5 py-2.5 text-overline uppercase text-text-muted">Status</th>
                <th className="px-5 py-2.5 text-right text-overline uppercase text-text-muted">Total</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((t) => (
                <tr
                  key={t.id}
                  className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-surface-2/60"
                >
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-text">{t.orderNumber}</p>
                    <p className="text-caption text-text-muted">{formatRelativeTime(t.date)}</p>
                  </td>
                  <td className="px-5 py-3.5 text-text">{t.customer ?? <span className="text-text-faint">Walk-in</span>}</td>
                  <td className="px-5 py-3.5 tabular text-text-muted">{t.itemCount}</td>
                  <td className="px-5 py-3.5">
                    <Badge tone={methodTone[t.paymentMethod]} dot>
                      {methodLabel[t.paymentMethod]}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    {t.status === 'completed' ? (
                      <Badge tone="success">Completed</Badge>
                    ) : t.status === 'refunded' ? (
                      <Badge tone="danger">Refunded</Badge>
                    ) : (
                      <Badge tone="warning">Held</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold tabular text-text">
                    {formatCurrency(t.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
