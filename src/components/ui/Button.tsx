import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type Size = 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-primary text-white shadow-sm hover:bg-primary-700 hover:shadow-md active:scale-[0.98]',
  secondary:
    'bg-surface-2 text-text hover:bg-border active:scale-[0.98]',
  ghost:
    'bg-transparent text-text hover:bg-surface-2 active:scale-[0.98]',
  danger:
    'bg-danger text-white shadow-sm hover:bg-danger/90 hover:shadow-md active:scale-[0.98]',
  outline:
    'border border-border bg-transparent text-text hover:bg-surface-2 active:scale-[0.98]',
}

const sizeStyles: Record<Size, string> = {
  sm: 'h-8 px-3 text-body-sm rounded-sm gap-1.5',
  md: 'h-10 px-4 text-body rounded-sm gap-2',
  lg: 'h-12 px-5 text-body-lg rounded-md gap-2',
  xl: 'h-14 px-6 text-body-lg rounded-md gap-2.5',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'primary', size = 'md', loading, leftIcon, rightIcon, fullWidth, className, children, disabled, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex select-none items-center justify-center font-medium transition-all duration-150 ease-out-expo',
          'focus-ring',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
        )}
        <span className="truncate">{children}</span>
        {!loading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </button>
    )
  },
)
Button.displayName = 'Button'
