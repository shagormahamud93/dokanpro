// Subscription plan catalog. Amounts are in BDT.
export const PLANS = {
  monthly: {
    id: 'monthly',
    name: 'Monthly',
    durationDays: 30,
    amount: 999,
    description: '1 month full access',
  },
  quarterly: {
    id: 'quarterly',
    name: 'Quarterly',
    durationDays: 90,
    amount: 2499,
    description: '3 months — save ৳498',
  },
  yearly: {
    id: 'yearly',
    name: 'Yearly',
    durationDays: 365,
    amount: 8999,
    description: '12 months — save ৳2989',
  },
}

export const PLAN_IDS = Object.keys(PLANS)
export const isValidPlan = (id) => Object.prototype.hasOwnProperty.call(PLANS, id)

export const PAYMENT_METHODS = ['bkash', 'nagad']
export const isValidPaymentMethod = (m) => PAYMENT_METHODS.includes(m)

export const SUBSCRIPTION_STATUSES = ['pending', 'active', 'expired', 'rejected']

// Merchant numbers shown to shop owners in the submit form.
// Override via .env in production.
export const MERCHANT = {
  bkash: process.env.BKASH_MERCHANT || '01711-000000',
  nagad: process.env.NAGAD_MERCHANT || '01811-000000',
}
