import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'ghost' | 'surface' | 'outline'
  label: string
}

const sizeMap = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
}

const variantMap = {
  ghost: 'hover:bg-surface-2 text-text-muted hover:text-text',
  surface: 'bg-surface-2 hover:bg-border text-text',
  outline: 'border border-border hover:bg-surface-2 text-text',
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ size = 'md', variant = 'ghost', label, className, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      className={cn(
        'inline-flex items-center justify-center rounded-sm transition-all duration-150',
        'focus-ring active:scale-[0.95]',
        sizeMap[size],
        variantMap[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  ),
)
IconButton.displayName = 'IconButton'
