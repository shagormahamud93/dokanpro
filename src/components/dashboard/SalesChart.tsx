import { useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'
import { salesChartData } from '@/data/mockData'

const ranges = ['Day', 'Week', 'Month', 'Year'] as const
type Range = (typeof ranges)[number]

export function SalesChart() {
  const [active, setActive] = useState<Range>('Week')

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Sales Overview</CardTitle>
          <p className="mt-1 text-body-sm text-text-muted">Last 7 days performance</p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-sm bg-surface-2 p-1">
          {ranges.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setActive(r)}
              className={cn(
                'h-7 rounded-xs px-3 text-caption font-medium transition-colors',
                active === r ? 'bg-surface text-text shadow-sm' : 'text-text-muted hover:text-text',
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" vertical={false} />
              <XAxis
                dataKey="day"
                stroke="rgb(var(--text-muted))"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                stroke="rgb(var(--text-muted))"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                cursor={{ stroke: '#2563EB', strokeWidth: 1, strokeDasharray: '3 3' }}
                contentStyle={{
                  background: 'rgb(var(--surface))',
                  border: '1px solid rgb(var(--border))',
                  borderRadius: 12,
                  boxShadow: '0 12px 32px rgba(15,23,42,0.10)',
                  fontSize: 13,
                }}
                labelStyle={{ color: 'rgb(var(--text-muted))', marginBottom: 4 }}
                itemStyle={{ color: 'rgb(var(--text))', fontWeight: 600 }}
                formatter={(v) => [formatCurrency(Number(v)), 'Sales']}
              />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="#2563EB"
                strokeWidth={2.5}
                fill="url(#salesGradient)"
                activeDot={{ r: 5, strokeWidth: 2, stroke: 'rgb(var(--surface))' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
