export interface Plan {
  id: 'monthly' | 'quarterly' | 'yearly'
  name: string
  durationDays: number
  amount: number
  description: string
}

// Fallback used until the backend's /api/subscriptions/plans response loads.
export const FALLBACK_PLANS: Plan[] = [
  { id: 'monthly', name: 'Monthly', durationDays: 30, amount: 999, description: '1 month full access' },
  { id: 'quarterly', name: 'Quarterly', durationDays: 90, amount: 2499, description: '3 months — save ৳498' },
  { id: 'yearly', name: 'Yearly', durationDays: 365, amount: 8999, description: '12 months — save ৳2989' },
]

export const FALLBACK_MERCHANT = {
  bkash: '01711-000000',
  nagad: '01811-000000',
}
