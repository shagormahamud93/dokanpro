const BDT = new Intl.NumberFormat('en-BD', {
  style: 'currency',
  currency: 'BDT',
  maximumFractionDigits: 0,
})

const BDT_DECIMAL = new Intl.NumberFormat('en-BD', {
  style: 'currency',
  currency: 'BDT',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatCurrency(value: number, withDecimals = false) {
  return (withDecimals ? BDT_DECIMAL : BDT).format(value).replace('BDT', '৳').replace(/\s/g, '')
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('en-BD').format(value)
}

export function formatRelativeTime(date: Date) {
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'এইমাত্র'
  if (minutes < 60) return `${minutes} মিনিট আগে`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} ঘণ্টা আগে`
  const days = Math.floor(hours / 24)
  return `${days} দিন আগে`
}
