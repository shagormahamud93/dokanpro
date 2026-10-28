import { useNavigate } from 'react-router-dom'
import { ShoppingBag, Receipt, Wallet, TrendingUp, Plus, Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { SalesChart } from '@/components/dashboard/SalesChart'
import { TopProducts } from '@/components/dashboard/TopProducts'
import { PaymentSplit } from '@/components/dashboard/PaymentSplit'
import { RecentTransactions } from '@/components/dashboard/RecentTransactions'
import { useAuth } from '@/context/AuthContext'

function greeting(name: string) {
  const h = new Date().getHours()
  const part = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  return `${part}, ${name.split(' ')[0]} 👋`
}

export function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const today = new Date().toLocaleDateString('en-BD', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 p-6 lg:p-8">
      {/* Header strip */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h1 text-text">{greeting(user?.name ?? 'there')}</h1>
          <p className="mt-1 text-body text-text-muted">{today} · Shop is open</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="md" leftIcon={<Download className="h-4 w-4" />}>
            Export
          </Button>
          <Button
            size="md"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => navigate('/pos')}
          >
            New Sale
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Today's Sales"
          value="৳12,400"
          delta={12.4}
          tone="primary"
          icon={<TrendingUp className="h-5 w-5" />}
          trend={[8, 10, 9, 12, 11, 14, 16]}
        />
        <KpiCard
          label="Orders"
          value="23"
          delta={8.2}
          tone="success"
          icon={<Receipt className="h-5 w-5" />}
          trend={[3, 5, 4, 6, 8, 7, 9]}
        />
        <KpiCard
          label="Avg. Order Value"
          value="৳539"
          delta={-2.1}
          tone="accent"
          icon={<ShoppingBag className="h-5 w-5" />}
          trend={[12, 11, 13, 12, 10, 11, 10]}
        />
        <KpiCard
          label="Profit"
          value="৳3,720"
          delta={15.7}
          tone="warning"
          icon={<Wallet className="h-5 w-5" />}
          trend={[4, 6, 5, 7, 8, 9, 11]}
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SalesChart />
        </div>
        <PaymentSplit />
      </div>

      {/* Secondary row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <TopProducts />
        <div className="lg:col-span-2">
          <RecentTransactions />
        </div>
      </div>
    </div>
  )
}
