import { forwardRef, type ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export interface LabelProps extends ComponentProps<'label'> {
  required?: boolean
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { className, required, children, ...props },
  ref,
) {
  return (
    <label
      ref={ref}
      className={cn('text-[13px] font-medium leading-none text-foreground sm:text-sm', className)}
      {...props}
    >
      {children}
      {required ? (
        <span className="ml-0.5 text-destructive" aria-hidden="true">
          *
        </span>
      ) : null}
    </label>
  )
})
