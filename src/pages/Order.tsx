
import { useMemo, useState } from 'react'
import {
  RefreshCw,
  Search,
  ShoppingBag,
  Eye,
} from 'lucide-react'

import { useOrders } from '@/hooks/useOrders'
import { formatCurrency } from '@/lib/format'

interface OrderProps {
  title: string
}

export function Order({ title }: OrderProps) {
  const { orders, loading, error, refetch } = useOrders()

  const [query, setQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(query.toLowerCase()) ||
        order.cashier?.name.toLowerCase().includes(query.toLowerCase()) ||
        order.items.some((item) =>
          item.name.toLowerCase().includes(query.toLowerCase()),
        )

      const matchesStatus =
        selectedStatus === 'all' ||
        order.status === selectedStatus

      return matchesSearch && matchesStatus
    })
  }, [orders, query, selectedStatus])

  return (
    <div className="mx-auto max-w-[1440px] p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-h1 text-text">{title}</h1>
          <p className="mt-2 text-body-sm text-text-muted">
            Manage and track your store orders.
          </p>
        </div>

        <button
          onClick={refetch}
          disabled={loading}
          className="flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm hover:bg-surface"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Total Orders" value={orders.length} />
        <StatCard
          title="Completed"
          value={orders.filter((o) => o.status === 'completed').length}
        />
        <StatCard
          title="Total Sales"
          value={formatCurrency(
            orders
              .filter((o) => o.status === 'completed')
              .reduce((sum, o) => sum + o.total, 0),
          )}
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search order, cashier or product..."
            className="w-full rounded-md border border-border bg-surface py-2.5 pl-10 pr-4 text-sm outline-none"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {error && (
        <div className="mt-5 rounded-md border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-500">
          {error}
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-md border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-background">
            <tr className="text-text-muted">
              <th className="p-4">Order</th>
              <th className="p-4">Cashier</th>
              <th className="p-4">Items</th>
              <th className="p-4">Payment</th>
              <th className="p-4">Total</th>
              <th className="p-4">Status</th>
              <th className="p-4">Date</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-10 text-center text-text-muted">
                  Loading orders...
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-10 text-center text-text-muted">
                  <ShoppingBag className="mx-auto mb-2 h-8 w-8" />
                  No orders found.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-background/50">
                  <td className="p-4 font-medium text-text">
                    {order.orderNumber}
                  </td>

                  <td className="p-4">
                    {order.cashier?.name ?? 'Unknown'}
                  </td>

                  <td className="p-4">
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                    {' '}items
                  </td>

                  <td className="p-4 capitalize">
                    {order.paymentMethod}
                  </td>

                  <td className="p-4 font-medium">
                    {formatCurrency(order.total)}
                  </td>

                  <td className="p-4">
                    <span className="rounded-full bg-primary-soft px-3 py-1 text-xs capitalize text-primary">
                      {order.status}
                    </span>
                  </td>

                  <td className="p-4 whitespace-nowrap text-text-muted">
                    {new Date(order.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm text-text-muted">
        Showing {filteredOrders.length} of {orders.length} orders
      </p>
    </div>
  )
}

function StatCard({
  title,
  value,
}: {
  title: string
  value: string | number
}) {
  return (
    <div className="rounded-md border border-border bg-surface p-5">
      <p className="text-sm text-text-muted">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-text">{value}</p>
    </div>
  )
}
