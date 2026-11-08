import { Suspense, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { PageLoading } from '@/components/feedback/page-loading'
import { ProfileMenu } from '@/components/layout/profile-menu'
import { AppDrawer } from '@/components/layout/app-drawer'
import { Logo } from '@/components/common/logo'
import type { NavigationItem } from '@/types'
import { cn } from '@/lib/utils'
import { APP_NAME } from '@/lib/constants'

interface AppShellProps {
  homeHref: string
  roleLabel: string
  navigation: NavigationItem[]
  drawerNavigation?: NavigationItem[]
}

/**
 * Shared application shell for both roles.
 *
 * Mobile: full-width header (hamburger + centred branding + profile) and a
 * four-item bottom tab bar; remaining destinations live in the hamburger
 * drawer. Laptop/desktop: a permanent, independently scrollable left sidebar
 * with all destinations grouped logically, a profile header at the top-right,
 * and page content filling the remaining width.
 */
export function AppShell({
  homeHref,
  roleLabel,
  navigation,
  drawerNavigation = [],
}: AppShellProps) {
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])

  const sidebarItems = useMemo(() => {
    const seen = new Set<string>()
    return [...navigation, ...drawerNavigation].filter((item) => {
      if (seen.has(item.href)) return false
      seen.add(item.href)
      return true
    })
  }, [navigation, drawerNavigation])

  const sidebarSections = [{ label: 'Application', items: sidebarItems }]

  return (
    <div className="min-h-screen bg-background md:flex">
      <a
        href="#main-content"
        className="sr-only rounded-md bg-card px-3 py-2 text-sm font-medium focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60]"
      >
        Skip to main content
      </a>

      {/* Laptop/desktop: permanent left sidebar */}
      <aside
        className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-64 md:flex-col md:border-r md:border-border md:bg-card lg:w-72"
        aria-label="Primary navigation"
      >
        <div className="flex h-14 shrink-0 items-center border-b border-border px-4 md:h-16 lg:px-5">
          <Link
            to={homeHref}
            className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={`Bachat Book ${roleLabel} home`}
          >
            <Logo size="md" />
          </Link>
        </div>

        <nav
          className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-3 py-4"
          aria-label={`${APP_NAME} navigation`}
        >
          {sidebarSections.map((section, index) => {
            if (section.items.length === 0) return null
            return (
              <div key={section.label} className={index > 0 ? 'mt-4' : ''}>
                <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {section.label}
                </p>
                <ul className="space-y-1">
                  {section.items.map((item) => (
                    <li key={item.href}>
                      <NavLink
                        to={item.href}
                        className={({ isActive }) =>
                          cn(
                            'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                            isActive
                              ? 'bg-primary-soft text-primary'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                          )
                        }
                      >
                        <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                        <span className="truncate">{item.label}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
                {index < sidebarSections.length - 1 ? (
                  <div role="separator" className="my-4 border-t border-border" />
                ) : null}
              </div>
            )
          })}
        </nav>

        <div className="shrink-0 border-t border-border px-4 py-3 lg:px-5">
          <p className="text-xs text-muted-foreground/70">
            Bachat Book · Together We Save. Simply.
          </p>
        </div>
      </aside>

      {/* Right column containing header + page content */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col md:pl-64 lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85">
          <div className="relative flex h-14 w-full items-center justify-between px-4 sm:px-6 md:h-16">
            {/* Mobile: hamburger on the left */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Open menu"
              aria-controls="app-drawer"
              aria-expanded={drawerOpen}
            >
              <Menu aria-hidden="true" className="h-6 w-6" />
            </button>

            {/* Mobile: centred brand */}
            <Link
              to={homeHref}
              className="absolute left-1/2 z-0 -translate-x-1/2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:hidden"
              aria-label={`Bachat Book ${roleLabel} home`}
            >
              <Logo size="md" />
            </Link>

            {/* Right: user profile / avatar */}
            <div className="ml-auto flex items-center gap-2">
              <ProfileMenu />
            </div>
          </div>
        </header>

        <main id="main-content" className="flex-1 px-4 py-5 pb-28 sm:px-6 sm:py-6 md:pb-8">
          <Suspense fallback={<PageLoading />}>
            <Outlet />
          </Suspense>
        </main>

        <footer className="px-4 pb-6 sm:px-6 md:pb-6">
          <p className="text-xs text-muted-foreground/70 md:hidden">
            Bachat Book · Together We Save. Simply.
          </p>
        </footer>
      </div>

      {/* Mobile: bottom tab bar with exactly four destinations */}
      <nav
        aria-label={`${roleLabel} navigation mobile`}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur md:hidden"
      >
        <div className="mx-auto grid max-w-lg grid-cols-4 px-2">
          {navigation.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-0.5 text-[10px] min-[360px]:text-[11px] font-medium transition-colors',
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

      <AppDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        items={drawerNavigation}
        homeHref={homeHref}
        roleLabel={roleLabel}
      />
    </div>
  )
}

/** Small helper so pages can render a consistent, large full-width action. */
export function PageActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>
}
