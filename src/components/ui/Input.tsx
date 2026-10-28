import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  leftIcon?: ReactNode
  rightSlot?: ReactNode
  error?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: 'h-9 text-body-sm',
  md: 'h-10 text-body',
  lg: 'h-12 text-body-lg',
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, leftIcon, rightSlot, error, size = 'md', ...props }, ref) => {
    return (
      <div
        className={cn(
          'group relative flex items-center rounded-sm border bg-surface transition-colors duration-150',
          'focus-within:border-primary focus-within:shadow-focus',
          error
            ? 'border-danger focus-within:border-danger focus-within:shadow-[0_0_0_4px_rgb(239_68_68/0.18)]'
            : 'border-border hover:border-text-faint',
          sizeMap[size],
          className,
        )}
      >
        {leftIcon && (
          <span className="pl-3 text-text-muted group-focus-within:text-primary">{leftIcon}</span>
        )}
        <input
          ref={ref}
          className={cn(
            'flex-1 border-0 bg-transparent px-3 text-text outline-none',
            'placeholder:text-text-faint',
            'focus:outline-none focus:ring-0',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
          {...props}
        />
        {rightSlot && <span className="pr-2">{rightSlot}</span>}
      </div>
    )
  },
)
Input.displayName = 'Input'
