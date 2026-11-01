import { cn } from '@/lib/utils'

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'destructive'
  | 'link'

export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:bg-primary/95',
  secondary:
    'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/90 active:bg-secondary/95',
  outline:
    'border border-border bg-card text-foreground shadow-sm hover:bg-muted/70 active:bg-muted',
  ghost: 'text-foreground hover:bg-muted/80 active:bg-muted',
  destructive:
    'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:bg-destructive/95',
  link: 'text-primary underline-offset-4 hover:underline',
}

const buttonSizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 rounded-md px-3 text-xs',
  md: 'h-10 gap-2 rounded-lg px-4 text-sm',
  lg: 'h-11 gap-2 rounded-lg px-5 text-sm',
  icon: 'h-10 w-10 rounded-lg',
}

const baseClasses =
  'inline-flex select-none items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'

export interface ButtonVariantOptions {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}

/** Shared button classes, useful for links that should look like buttons. */
export function buttonVariants({
  variant = 'primary',
  size = 'md',
  className,
}: ButtonVariantOptions = {}) {
  return cn(baseClasses, variantClasses[variant], buttonSizeClasses[size], className)
}
