import { useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { LogOut, X } from 'lucide-react'
import { Logo } from '@/components/common/logo'
import { Avatar } from '@/components/ui/avatar'
import { useToast } from '@/components/ui/toast-context'
import { useAuth } from '@/features/auth/components/auth-context'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import type { NavigationItem } from '@/types'

interface AppDrawerProps {
  open: boolean
  onClose: () => void
  items: NavigationItem[]
  homeHref: string
  roleLabel: string
}

/**
 * Role-aware left-side navigation drawer for mobile. Holds all destinations
 * that are not in the bottom tab bar, plus user information and sign out.
 */
export function AppDrawer({ open, onClose, items, homeHref, roleLabel }: AppDrawerProps) {
  const auth = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const panelRef = useRef<HTMLElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const user = auth.user
  const isAdmin = roleLabel === 'Admin'

  const handleSignOut = async () => {
    onClose()
    const error = await auth.signOut()
    toast({
      title: error ? 'Sign-out could not be confirmed' : 'Signed out',
      description: error
        ? `${error} Close this browser on a shared device.`
        : 'Your session has ended.',
      variant: error ? 'error' : 'success',
    })
    void navigate(ROUTES.login, { replace: true })
  }

  useEffect(() => {
    if (!open) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    panelRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="Menu">
      <div
        className="absolute inset-0 bg-secondary/45 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
      />
      <aside
        id="app-drawer"
        ref={panelRef}
        tabIndex={-1}
        className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col border-r border-border bg-card shadow-elevated outline-none animate-slide-in-left overflow-y-auto"
      >
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-4">
          <Link
            to={homeHref}
            onClick={onClose}
            className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={`Bachat Book ${roleLabel} home`}
          >
            <Logo size="sm" />
            <span className="text-xs font-medium text-muted-foreground">{roleLabel}</span>
          </Link>
          <button
            ref={triggerRef}
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Close menu"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <nav aria-label={`${roleLabel} navigation`} className="flex-1 px-3 py-3">
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.href}>
                <NavLink
                  to={item.href}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary-soft text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )
                  }
                >
                  <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-border px-4 py-4">
          {user ? (
            <>
              <div className="flex items-center gap-3">
                <Avatar name={user.fullName} size="md" decorative />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{user.fullName}</p>
                  {user.email ? (
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  ) : null}
                  <p className="text-[11px] font-medium text-muted-foreground">
                    {isAdmin ? 'Administrator' : 'Member'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="mt-3 flex w-full items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <LogOut aria-hidden="true" className="h-5 w-5 shrink-0" />
                <span>Sign out</span>
              </button>
            </>
          ) : null}
        </div>
      </aside>
    </div>,
    document.body,
  )
}
