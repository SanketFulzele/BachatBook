import { APP_NAME, APP_TAGLINE } from '@/lib/constants'
import { cn } from '@/lib/utils'

const wordmarkSizes = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
} as const

const markSizes = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
  lg: 'h-11 w-11',
} as const

export interface LogoProps {
  size?: keyof typeof wordmarkSizes
  variant?: 'dark' | 'light'
  showTagline?: boolean
  className?: string
}

export function Logo({ size = 'md', variant = 'dark', showTagline = false, className }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <img
        src="/bachat-book-logo.png"
        alt=""
        className={cn('shrink-0 rounded-[9px]', markSizes[size])}
        width={44}
        height={44}
      />
      <div className="min-w-0 leading-none">
        <span
          className={cn(
            'block font-bold tracking-tight',
            wordmarkSizes[size],
            variant === 'light' ? 'text-white' : 'text-secondary',
          )}
        >
          {APP_NAME}
        </span>
        {showTagline ? (
          <span
            className={cn(
              'mt-1 block truncate text-[11px] font-medium',
              variant === 'light' ? 'text-white/60' : 'text-muted-foreground',
            )}
          >
            {APP_TAGLINE}
          </span>
        ) : null}
      </div>
    </div>
  )
}
