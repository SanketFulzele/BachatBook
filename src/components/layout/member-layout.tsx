import { Link, NavLink, Outlet } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { Logo } from '@/components/common/logo'
import { ProfileMenu } from '@/components/layout/profile-menu'
import { memberNavigation } from '@/components/layout/nav-config'
import { ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function MemberLayout() {
  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only rounded-md bg-card px-3 py-2 text-sm font-medium focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60]"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link
            to={ROUTES.member.dashboard}
            className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Bachify member portal home"
          >
            <Logo size="md" />
          </Link>

          <span className="hidden h-6 w-px bg-border sm:block" aria-hidden="true" />
          <span className="hidden text-xs font-medium text-muted-foreground sm:block">
            Member portal
          </span>

          <div className="ml-auto flex items-center gap-2">
            <Link
              to={ROUTES.admin.dashboard}
              className="hidden items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              Admin preview
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
            <ProfileMenu name="Sita Gurung" email="sita@example.com" role="member" />
          </div>
        </div>

        <nav
          aria-label="Member navigation"
          className="mx-auto hidden max-w-6xl gap-1 overflow-x-auto px-4 pb-3 sm:px-6 md:flex"
        >
          {memberNavigation.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors',
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
      </header>

      <main
        id="main-content"
        className="mx-auto w-full max-w-6xl px-4 py-6 pb-28 sm:px-6 md:pb-10 lg:py-8"
      >
        <Outlet />
      </main>

      <nav
        aria-label="Member navigation mobile"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur md:hidden"
      >
        <div className="mx-auto grid max-w-lg grid-cols-6 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1">
          {memberNavigation.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              <item.icon className="h-[18px] w-[18px]" aria-hidden="true" />
              <span className="max-w-full truncate">{item.label.replace('Monthly ', '')}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
