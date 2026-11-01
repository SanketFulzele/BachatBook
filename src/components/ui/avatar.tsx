import { useState } from 'react'
import { cn, getInitials } from '@/lib/utils'

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
} as const

export interface AvatarProps {
  name: string
  src?: string
  size?: keyof typeof sizeClasses
  className?: string
  /** Hide the avatar from assistive tech when the same name is shown beside it. */
  decorative?: boolean
}

/**
 * Accessible avatar with an initials fallback when no image is available
 * or the image fails to load.
 */
export function Avatar({ name, src, size = 'md', className, decorative = false }: AvatarProps) {
  const [failure, setFailure] = useState<{ src?: string; failed: boolean }>({ failed: false })
  const showImage = Boolean(src) && !(failure.failed && failure.src === src)

  return (
    <span
      aria-hidden={decorative || undefined}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft font-semibold text-primary',
        sizeClasses[size],
        className,
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailure({ src, failed: true })}
        />
      ) : (
        <span aria-hidden="true">{getInitials(name)}</span>
      )}
      {decorative ? null : <span className="sr-only">{name}</span>}
    </span>
  )
}
