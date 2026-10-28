import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'accent'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
  size?: 'sm' | 'md'
  dot?: boolean
}

const toneStyles: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-text-muted',
  primary: 'bg-primary-soft text-primary',
  success: 'bg-success-soft text-success dark:bg-success/15',
  warning: 'bg-warning-soft text-warning dark:bg-warning/15',
  danger: 'bg-danger-soft text-danger dark:bg-danger/15',
  accent: 'bg-accent-soft text-accent dark:bg-accent/15',
}

const dotColors: Record<Tone, string> = {
  neutral: 'bg-text-faint',
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  accent: 'bg-accent',
}

export function Badge({ tone = 'neutral', size = 'sm', dot, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        size === 'sm' ? 'h-5 px-2 text-caption' : 'h-6 px-2.5 text-body-sm',
        toneStyles[tone],
        className,
      )}
      {...props}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotColors[tone])} />}
      {children}
    </span>
  )
}
