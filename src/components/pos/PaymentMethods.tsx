import { Banknote, CreditCard, Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PaymentMethod } from '@/types'

interface PaymentMethodsProps {
  selected: PaymentMethod | null
  onSelect: (m: PaymentMethod) => void
}

const methods: {
  id: PaymentMethod
  label: string
  icon: typeof Banknote
  activeBg: string
  activeText: string
}[] = [
  { id: 'cash', label: 'Cash', icon: Banknote, activeBg: 'bg-success', activeText: 'text-success' },
  { id: 'bkash', label: 'bKash', icon: Smartphone, activeBg: 'bg-bkash', activeText: 'text-bkash' },
  { id: 'nagad', label: 'Nagad', icon: Smartphone, activeBg: 'bg-nagad', activeText: 'text-nagad' },
  { id: 'card', label: 'Card', icon: CreditCard, activeBg: 'bg-primary', activeText: 'text-primary' },
]

export function PaymentMethods({ selected, onSelect }: PaymentMethodsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {methods.map((m) => {
        const isActive = selected === m.id
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onSelect(m.id)}
            className={cn(
              'flex h-14 items-center gap-3 rounded-sm border px-4 transition-all duration-150 active:scale-[0.98]',
              isActive
                ? cn(m.activeBg, 'border-transparent text-white shadow-md')
                : 'border-border bg-surface text-text hover:border-text-faint hover:bg-surface-2',
            )}
          >
            <m.icon className="h-5 w-5 shrink-0" />
            <span className="text-body-sm font-semibold">{m.label}</span>
          </button>
        )
      })}
    </div>
  )
}
