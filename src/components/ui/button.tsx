import { forwardRef, type ComponentProps, type ReactNode } from 'react'
import { Spinner } from '@/components/ui/spinner'
import type { ButtonSize, ButtonVariant } from '@/components/ui/button-variants'
import { buttonVariants } from '@/components/ui/button-variants'

export interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    children,
    disabled,
    type = 'button',
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={buttonVariants({ variant, size, className })}
      {...props}
    >
      {isLoading ? <Spinner size="sm" label="Please wait" /> : leftIcon}
      {children}
    </button>
  )
})
