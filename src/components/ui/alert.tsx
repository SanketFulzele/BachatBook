import type { ComponentProps, ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info, XCircle, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AlertProps extends ComponentProps<'div'> {
  variant?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  icon?: LucideIcon
  children?: ReactNode
}

const variantConfig: Record<
  NonNullable<AlertProps['variant']>,
  { classes: string; iconClasses: string; defaultIcon: LucideIcon }
> = {
  info: {
    classes: 'border-primary/20 bg-primary-soft/60 text-primary',
    iconClasses: 'text-primary',
    defaultIcon: Info,
  },
  success: {
    classes: 'border-success/20 bg-success-soft text-success',
    iconClasses: 'text-success',
    defaultIcon: CheckCircle2,
  },
  warning: {
    classes: 'border-warning/25 bg-warning-soft text-warning-foreground',
    iconClasses: 'text-warning',
    defaultIcon: AlertTriangle,
  },
  error: {
    classes: 'border-destructive/20 bg-destructive-soft text-destructive',
    iconClasses: 'text-destructive',
    defaultIcon: XCircle,
  },
}

export function Alert({
  variant = 'info',
  title,
  icon,
  children,
  className,
  ...props
}: AlertProps) {
  const config = variantConfig[variant]
  const Icon = icon ?? config.defaultIcon

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-lg border p-3.5 text-sm', config.classes, className)}
      {...props}
    >
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', config.iconClasses)} aria-hidden="true" />
      <div className="min-w-0 space-y-0.5">
        {title ? <p className="font-semibold leading-5">{title}</p> : null}
        {children ? <div className="leading-5 opacity-90">{children}</div> : null}
      </div>
    </div>
  )
}
