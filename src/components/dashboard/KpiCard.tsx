import type { ReactNode } from 'react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  label: string
  value: string
  delta: number
  icon: ReactNode
  tone?: 'primary' | 'success' | 'warning' | 'accent'
  trend?: number[]
}

const toneAccent: Record<NonNullable<KpiCardProps['tone']>, string> = {
  primary: 'from-primary/15 to-transparent text-primary',
  success: 'from-success/15 to-transparent text-success',
  warning: 'from-warning/15 to-transparent text-warning',
  accent: 'from-accent/15 to-transparent text-accent',
}

const strokeMap: Record<NonNullable<KpiCardProps['tone']>, string> = {
  primary: '#2563EB',
  success: '#10B981',
  warning: '#F97316',
  accent: '#F59E0B',
}

export function KpiCard({ label, value, delta, icon, tone = 'primary', trend = [4, 6, 5, 8, 7, 10, 12] }: KpiCardProps) {
  const positive = delta >= 0
  const data = trend.map((v, i) => ({ i, v }))

  return (
    <div className="group relative overflow-hidden rounded-md border border-border bg-surface p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className={cn('absolute inset-x-0 top-0 h-24 bg-gradient-to-b opacity-50', toneAccent[tone])} />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-body-sm text-text-muted">{label}</p>
          <p className="mt-2 text-display tabular text-text">{value}</p>
        </div>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-sm bg-surface-2', toneAccent[tone].split(' ').pop())}>
          {icon}
        </div>
      </div>

      <div className="relative mt-4 flex items-end justify-between">
        <div
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-caption font-semibold',
            positive ? 'bg-success-soft text-success dark:bg-success/15' : 'bg-danger-soft text-danger dark:bg-danger/15',
          )}
        >
          {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {Math.abs(delta)}%
        </div>
        <div className="h-10 w-24 -mr-1 -mb-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`spark-${tone}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={strokeMap[tone]} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={strokeMap[tone]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={strokeMap[tone]} strokeWidth={2} fill={`url(#spark-${tone})`} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
