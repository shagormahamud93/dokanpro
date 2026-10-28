import { Modal } from '@/components/ui/Modal'
import { Kbd } from '@/components/ui/Kbd'

interface ShortcutsHelpProps {
  open: boolean
  onClose: () => void
}

const groups: { title: string; items: { keys: string[]; label: string }[] }[] = [
  {
    title: 'Navigation',
    items: [
      { keys: ['F1'], label: 'Focus search / scanner' },
      { keys: ['F2'], label: 'Add customer' },
      { keys: ['F3'], label: 'Apply discount' },
      { keys: ['?'], label: 'Show this help' },
    ],
  },
  {
    title: 'Cart',
    items: [
      { keys: ['↑', '↓'], label: 'Select cart item' },
      { keys: ['+', '−'], label: 'Increase / decrease selected' },
      { keys: ['Del'], label: 'Remove selected' },
      { keys: ['Esc'], label: 'Clear search' },
    ],
  },
  {
    title: 'Hold',
    items: [
      { keys: ['F4'], label: 'Hold current cart' },
      { keys: ['F5'], label: 'Recall held cart' },
    ],
  },
  {
    title: 'Payment',
    items: [
      { keys: ['Enter'], label: 'Open payment / confirm' },
      { keys: ['F9'], label: 'Cash' },
      { keys: ['F10'], label: 'bKash' },
      { keys: ['F11'], label: 'Nagad' },
      { keys: ['F12'], label: 'Card' },
    ],
  },
]

export function ShortcutsHelp({ open, onClose }: ShortcutsHelpProps) {
  return (
    <Modal open={open} onClose={onClose} size="lg" title="Keyboard shortcuts" description="Press anywhere on the POS screen">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {groups.map((g) => (
          <section key={g.title}>
            <p className="mb-2 text-overline uppercase text-text-faint">{g.title}</p>
            <ul className="space-y-2">
              {g.items.map((item) => (
                <li key={item.label} className="flex items-center justify-between gap-3">
                  <span className="text-body-sm text-text">{item.label}</span>
                  <span className="flex shrink-0 items-center gap-1">
                    {item.keys.map((k) => (
                      <Kbd key={k}>{k}</Kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Modal>
  )
}
