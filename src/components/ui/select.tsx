import { forwardRef, type ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export const Select = forwardRef<HTMLSelectElement, ComponentProps<'select'>>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        'flex h-11 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm',
        'transition-colors focus-visible:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-0',
        'disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-60',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
})
