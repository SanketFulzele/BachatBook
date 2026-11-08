import { Suspense, useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Ellipsis, Menu } from 'lucide-react'
import { PageLoading } from '@/components/feedback/page-loading'
import { ProfileMenu } from '@/components/layout/profile-menu'
import { AppDrawer } from '@/components/layout/app-drawer'
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown'
import { Logo } from '@/components/common/logo'
import type { NavigationItem } from '@/types'
import { cn } from '@/lib/utils'

interface AppShellProps {
  homeHref: string
  roleLabel: string
  navigation: NavigationItem[]
  desktopNavigation?: NavigationItem[]
  drawerNavigation?: NavigationItem[]
}

/**
 * Shared mobile-first shell for both roles.
 *
 * Mobile: hamburger menu (opens the destinations drawer), centred logo and
 * a profile button, plus a bottom tab bar with exactly four frequently used
 * sections. Tablet/desktop: the destinations move into the header, with the
 * remainder available from a "More" menu. Optional longer destinations are
 * hidden behind breakpoints to avoid overflow.
 */
export function AppShell({
  homeHref,
  roleLabel,
  navigation,
  desktopNavigation,
  drawerNavigation = [],
}: AppShellProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const desktopItems = desktopNavigation ?? navigation
  const desktopMoreItems = drawerNavigation.filter(
    (item) => !desktopItems.some((kept) => kept.href === item.href),
  )
  const isDrawerMenuActive = drawerNavigation.some((item) =>
    location.pathname.startsWith(item.href),
  )
  const [drawerOpen, setDrawerOpen] = useState(false)

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
        <div className="relative mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 sm:px-6 md:h-16 md:justify-start md:gap-3 lg:gap-4">
          {/* Mobile: hamburger on the left */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="z-10 flex h-11 w-11 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Open menu"
            aria-controls="app-drawer"
            aria-expanded={drawerOpen}
          >
            <Menu aria-hidden="true" className="h-6 w-6" />
          </button>

          {/* Center: Bachat Book logo and name */}
          <Link
            to={homeHref}
            className="absolute left-1/2 z-0 -translate-x-1/2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:static md:translate-x-0"
            aria-label={`Bachat Book ${roleLabel} home`}
          >
            <Logo size="md" />
          </Link>

          {/* Desktop: role label */}
          <span className="hidden select-none h-6 w-px bg-border md:block" aria-hidden="true" />
          <span className="hidden text-xs font-medium text-muted-foreground md:block">
            {roleLabel}
          </span>

          {/* Desktop: inline navigation */}
          <nav aria-label={`${roleLabel} navigation`} className="ml-4 hidden gap-1 md:flex">
            {desktopItems.map((item, index) => {
              const optional = index >= 4
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      optional ? 'hidden lg:inline-flex' : '',
                      isActive
                        ? 'bg-primary-soft text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )
                  }
                  aria-label={item.label}
                >
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only min-[1280px]:not-sr-only">{item.label}</span>
                </NavLink>
              )
            })}
            {desktopMoreItems.length > 0 ? (
              <MoreMenu
                items={desktopMoreItems}
                active={isDrawerMenuActive}
                onNavigate={(href) => void navigate(href)}
              />
            ) : null}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <ProfileMenu />
          </div>
        </div>
      </header>

      <main
        id="main-content"
        className="mx-auto w-full max-w-7xl space-y-0 px-4 py-5 pb-28 sm:px-6 sm:py-6 md:pb-10"
      >
        <Suspense fallback={<PageLoading />}>
          <Outlet />
        </Suspense>
      </main>

      <footer className="mx-auto w-full max-w-7xl px-4 pb-6 sm:px-6 md:pb-8">
        <p className="text-xs text-muted-foreground/70">Bachat Book · Together We Save. Simply.</p>
      </footer>

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

function MoreMenu({
  items,
  active,
  side = 'bottom',
  onNavigate,
}: {
  items: NavigationItem[]
  active: boolean
  side?: 'top' | 'bottom'
  onNavigate: (href: string) => void
}) {
  return (
    <DropdownMenu
      label="More navigation"
      side={side}
      className="flex items-center"
      trigger={
        <span
          className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium md:min-h-10 md:gap-2 md:px-3 md:text-sm',
            active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Ellipsis className="h-4 w-4" aria-hidden="true" />
          <span>More</span>
        </span>
      }
    >
      {items.map((item) => (
        <DropdownMenuItem key={item.href} icon={item.icon} onSelect={() => onNavigate(item.href)}>
          {item.label}
        </DropdownMenuItem>
      ))}
    </DropdownMenu>
  )
}

/** Small helper so pages can render a consistent, large full-width action. */
export function PageActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>
}
