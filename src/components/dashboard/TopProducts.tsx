import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { topProductsData } from '@/data/mockData'

export function TopProducts() {
  const max = Math.max(...topProductsData.map((p) => p.sales))

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Top Products</CardTitle>
          <p className="mt-1 text-body-sm text-text-muted">Best sellers this week</p>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {topProductsData.map((p, idx) => (
            <li key={p.name}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-3">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary-soft text-caption font-semibold text-primary">
                    {idx + 1}
                  </span>
                  <span className="text-body-sm text-text">{p.name}</span>
                </span>
                <span className="tabular text-body-sm font-semibold text-text">{p.sales}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                  style={{ width: `${(p.sales / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
