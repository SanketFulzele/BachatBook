import { Suspense, useEffect, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Logo } from '@/components/common/logo'
import { PageLoading } from '@/components/feedback/page-loading'
import { ProfileMenu } from '@/components/layout/profile-menu'
import type { NavigationItem } from '@/types'
import { cn } from '@/lib/utils'

interface AppShellProps {
  homeHref: string
  roleLabel: string
  navigation: NavigationItem[]
}

/**
 * Shared mobile-first shell for both roles.
 *
 * Mobile: compact header + bottom tab bar (large touch targets).
 * Tablet/desktop: the same destinations move into the header.
 */
export function AppShell({ homeHref, roleLabel, navigation }: AppShellProps) {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only rounded-md bg-card px-3 py-2 text-sm font-medium focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60]"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-4">
          <Link
            to={homeHref}
            className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={`Bachat Book ${roleLabel} home`}
          >
            <Logo size="md" />
          </Link>

          <span className="hidden h-6 w-px bg-border sm:block" aria-hidden="true" />
          <span className="hidden text-xs font-medium text-muted-foreground sm:block">
            {roleLabel}
          </span>

          <nav aria-label={`${roleLabel} navigation`} className="ml-4 hidden gap-1 md:flex">
            {navigation.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-soft text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )
                }
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <ProfileMenu />
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto w-full max-w-3xl px-4 py-5 pb-28 sm:py-6 md:pb-10">
        <Suspense fallback={<PageLoading />}>
          <Outlet />
        </Suspense>
      </main>

      <footer className="mx-auto w-full max-w-3xl px-4 pb-6 md:pb-8">
        <p className="text-xs text-muted-foreground/70">Bachat Book · Together We Save. Simply.</p>
      </footer>

      <nav
        aria-label={`${roleLabel} navigation mobile`}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur md:hidden"
      >
        <div
          className="mx-auto grid max-w-lg px-2"
          style={{ gridTemplateColumns: `repeat(${navigation.length}, minmax(0, 1fr))` }}
        >
          {navigation.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              <span className="max-w-full truncate">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

/** Small helper so pages can render a consistent, large full-width action. */
export function PageActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>
}
