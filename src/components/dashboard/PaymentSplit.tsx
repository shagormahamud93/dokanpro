import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { paymentSplitData } from '@/data/mockData'

export function PaymentSplit() {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Payment Methods</CardTitle>
          <p className="mt-1 text-body-sm text-text-muted">This week's split</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="relative h-40 w-40 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentSplitData}
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {paymentSplitData.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-caption text-text-muted">Total</p>
              <p className="text-h3 tabular text-text">100%</p>
            </div>
          </div>
          <ul className="flex-1 space-y-3">
            {paymentSplitData.map((d) => (
              <li key={d.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="text-body-sm text-text">{d.name}</span>
                </span>
                <span className="tabular text-body-sm font-semibold text-text">{d.value}%</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
