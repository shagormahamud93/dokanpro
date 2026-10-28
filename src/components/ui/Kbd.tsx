import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Kbd({ className, children, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        'inline-flex h-6 min-w-6 select-none items-center justify-center rounded-xs border border-border bg-surface-2 px-1.5 font-mono text-caption font-semibold text-text',
        className,
      )}
      {...props}
    >
      {children}
    </kbd>
  )
}
