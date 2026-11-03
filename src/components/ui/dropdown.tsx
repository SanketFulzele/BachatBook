import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react'
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
  label: string
  className?: string
  menuClassName?: string
}

export function DropdownMenu({
  trigger,
  children,
  align = 'end',
  label,
  className,
  menuClassName,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
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

  const close = () => {
    setOpen(false)
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

  return (
    <DropdownContext.Provider value={{ close }}>
      <div ref={containerRef} className={cn('relative', className)}>
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={label}
          onClick={() => setOpen((value) => !value)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              setOpen(true)
            }
          }}
          className="inline-flex items-center gap-2 rounded-lg text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {trigger}
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
              open && 'rotate-180',
            )}
            aria-hidden="true"
          />
        </button>

        {open ? (
          <div
            ref={menuRef}
            role="menu"
            aria-label={label}
            className={cn(
              'absolute top-[calc(100%+0.5rem)] z-40 min-w-52 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-elevated animate-scale-in',
              align === 'end' ? 'right-0 origin-top-right' : 'left-0 origin-top-left',
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
          </div>
        ) : null}
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
          'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors',
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
