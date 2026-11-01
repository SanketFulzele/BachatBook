import { forwardRef, type ComponentProps, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends ComponentProps<'input'> {
  invalid?: boolean
  startIcon?: ReactNode
  endAdornment?: ReactNode
  containerClassName?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, containerClassName, invalid, startIcon, endAdornment, ...props },
  ref,
) {
  const input = (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm',
        'transition-colors placeholder:text-muted-foreground/70',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'focus-visible:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-0',
        'disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-60',
        invalid && 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/25',
        startIcon && 'pl-10',
        endAdornment && 'pr-11',
        className,
      )}
      {...props}
    />
  )

  if (!startIcon && !endAdornment) {
    return input
  }

  return (
    <div className={cn('relative', containerClassName)}>
      {startIcon ? (
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
          {startIcon}
        </span>
      ) : null}
      {input}
      {endAdornment ? (
        <span className="absolute inset-y-0 right-1 flex items-center">{endAdornment}</span>
      ) : null}
    </div>
  )
})
