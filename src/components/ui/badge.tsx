import { type ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends ComponentProps<'span'> {
  variant?: 'neutral' | 'primary' | 'success' | 'warning' | 'destructive' | 'outline' | 'navy'
  withDot?: boolean
}

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  neutral: 'bg-muted text-muted-foreground',
  primary: 'bg-primary-soft text-primary',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning-foreground',
  destructive: 'bg-destructive-soft text-destructive',
  outline: 'border border-border bg-transparent text-muted-foreground',
  navy: 'bg-secondary-soft text-secondary',
}

const dotClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  neutral: 'bg-muted-foreground/60',
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  outline: 'bg-muted-foreground/60',
  navy: 'bg-secondary',
}

export function Badge({
  className,
  variant = 'neutral',
  withDot = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {withDot ? (
        <span className={cn('h-1.5 w-1.5 rounded-full', dotClasses[variant])} aria-hidden="true" />
      ) : null}
      {children}
    </span>
  )
}
