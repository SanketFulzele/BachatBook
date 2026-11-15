import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DropdownContextValue {
  close: () => void
}

const DropdownContext = createContext<DropdownContextValue | null>(null)

export interface DropdownMenuProps {
  trigger: ReactNode
  children: ReactNode
  align?: 'start' | 'end'
  side?: 'top' | 'bottom'
  label: string
  className?: string
  menuClassName?: string
  /** Hide the chevron indicator (useful for icon-only action triggers). */
  hideChevron?: boolean
}

interface MenuPosition {
  top: number
  left: number
  placement: 'top' | 'bottom'
  maxHeight: number
}

const VIEWPORT_MARGIN = 8
const OFFSET = 8

function computeMenuPosition(
  trigger: HTMLElement,
  menu: HTMLElement,
  align: 'start' | 'end',
  preferredSide: 'top' | 'bottom',
): MenuPosition {
  const triggerRect = trigger.getBoundingClientRect()
  const menuRect = menu.getBoundingClientRect()
  const menuWidth = menuRect.width
  const menuHeight = menuRect.height
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  const spaceBelow = viewportHeight - triggerRect.bottom - VIEWPORT_MARGIN
  const spaceAbove = triggerRect.top - VIEWPORT_MARGIN
  let placement = preferredSide

  if (placement === 'bottom' && menuHeight > spaceBelow && spaceAbove > spaceBelow) {
    placement = 'top'
  } else if (placement === 'top' && menuHeight > spaceAbove && spaceBelow > spaceAbove) {
    placement = 'bottom'
  }

  const available = placement === 'bottom' ? spaceBelow : spaceAbove
  const maxHeight = Math.max(120, Math.min(menuHeight, available - OFFSET))

  let top =
    placement === 'bottom'
      ? triggerRect.bottom + OFFSET
      : triggerRect.top - Math.min(menuHeight, maxHeight) - OFFSET

  let left = align === 'end' ? triggerRect.right - menuWidth : triggerRect.left
  left = Math.min(Math.max(VIEWPORT_MARGIN, left), viewportWidth - menuWidth - VIEWPORT_MARGIN)
  top = Math.min(Math.max(VIEWPORT_MARGIN, top), viewportHeight - maxHeight - VIEWPORT_MARGIN)

  return { top, left, placement, maxHeight }
}

export function DropdownMenu({
  trigger,
  children,
  align = 'end',
  side = 'bottom',
  label,
  className,
  menuClassName,
  hideChevron = false,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<MenuPosition | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const updatePosition = () => {
    if (!triggerRef.current || !menuRef.current) return
    setPosition(computeMenuPosition(triggerRef.current, menuRef.current, align, side))
  }

  const setMenuOpen = (next: boolean | ((value: boolean) => boolean)) => {
    setOpen((value) => {
      const resolved = typeof next === 'function' ? next(value) : next
      if (!resolved) setPosition(null)
      return resolved
    })
  }

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (containerRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setMenuOpen(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  useLayoutEffect(() => {
    if (!open) return
    // Measure after paint so the portal menu has its natural size, then clamp.
    const frame = window.requestAnimationFrame(updatePosition)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, align, side])

  const close = () => {
    setMenuOpen(false)
    triggerRef.current?.focus()
  }

  useEffect(() => {
    if (!open) return
    // Move focus into the menu so keyboard users can navigate immediately.
    const frame = window.requestAnimationFrame(() => {
      menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]:not([disabled])')?.focus()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [open])

  const placement = position?.placement ?? side

  return (
    <DropdownContext.Provider value={{ close }}>
      <div ref={containerRef} className={cn('relative inline-flex', className)}>
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={label}
          onClick={() => setMenuOpen((value) => !value)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              setMenuOpen(true)
            }
          }}
          className="inline-flex items-center gap-2 rounded-lg text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {trigger}
          {hideChevron ? null : (
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                open && 'rotate-180',
              )}
              aria-hidden="true"
            />
          )}
        </button>

        {open && typeof document !== 'undefined'
          ? createPortal(
              <div
                ref={menuRef}
                role="menu"
                aria-label={label}
                style={{
                  position: 'fixed',
                  top: position?.top ?? -9999,
                  left: position?.left ?? -9999,
                  maxHeight: position?.maxHeight,
                  visibility: position ? 'visible' : 'hidden',
                }}
                className={cn(
                  'z-[80] min-w-52 overflow-y-auto rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-elevated animate-scale-in',
                  placement === 'bottom'
                    ? align === 'end'
                      ? 'origin-top-right'
                      : 'origin-top-left'
                    : align === 'end'
                      ? 'origin-bottom-right'
                      : 'origin-bottom-left',
                  menuClassName,
                )}
                onKeyDown={(event) => {
                  const items = Array.from(
                    menuRef.current?.querySelectorAll<HTMLElement>(
                      '[role="menuitem"]:not([disabled])',
                    ) ?? [],
                  )
                  const currentIndex = items.indexOf(document.activeElement as HTMLElement)

                  if (event.key === 'ArrowDown') {
                    event.preventDefault()
                    items[(currentIndex + 1) % items.length]?.focus()
                  } else if (event.key === 'ArrowUp') {
                    event.preventDefault()
                    items[(currentIndex - 1 + items.length) % items.length]?.focus()
                  } else if (event.key === 'Home') {
                    event.preventDefault()
                    items[0]?.focus()
                  } else if (event.key === 'End') {
                    event.preventDefault()
                    items[items.length - 1]?.focus()
                  }
                }}
              >
                {children}
              </div>,
              document.body,
            )
          : null}
      </div>
    </DropdownContext.Provider>
  )
}

export interface DropdownMenuItemProps extends Omit<ComponentProps<'button'>, 'onSelect'> {
  icon?: LucideIcon
  destructive?: boolean
  onSelect?: () => void
  separatorBefore?: boolean
  selected?: boolean
}

export function DropdownMenuItem({
  icon: Icon,
  destructive,
  onSelect,
  separatorBefore,
  selected,
  className,
  children,
  disabled,
  ...props
}: DropdownMenuItemProps) {
  const context = useContext(DropdownContext)

  return (
    <>
      {separatorBefore ? <div className="-mx-1.5 my-1.5 h-px bg-border" role="separator" /> : null}
      <button
        type="button"
        role="menuitem"
        disabled={disabled}
        onClick={() => {
          context?.close()
          onSelect?.()
        }}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] transition-colors sm:text-sm',
          'hover:bg-muted focus-visible:bg-muted focus-visible:outline-none',
          'disabled:pointer-events-none disabled:opacity-50',
          destructive ? 'text-destructive hover:bg-destructive-soft' : 'text-foreground',
          className,
        )}
        {...props}
      >
        {Icon ? <Icon className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
        <span className="flex-1">{children}</span>
        {selected ? <Check className="h-4 w-4 text-primary" aria-hidden="true" /> : null}
      </button>
    </>
  )
}

export function DropdownMenuLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-2.5 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </div>
  )
}

export function DropdownMenuSeparator() {
  return <div className="-mx-1.5 my-1.5 h-px bg-border" role="separator" />
}
