import { Suspense, useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { Logo } from '@/components/common/logo'
import { Badge } from '@/components/ui/badge'
import { PageLoading } from '@/components/feedback/page-loading'
import { ProfileMenu } from '@/components/layout/profile-menu'
import { adminNavigation } from '@/components/layout/nav-config'
import { cn } from '@/lib/utils'

function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-secondary text-white">
      <div className="flex h-16 shrink-0 items-center justify-between gap-3 px-5">
        <Logo variant="light" size="md" />
        {onNavigate ? (
          <button
            type="button"
            onClick={onNavigate}
            className="rounded-md p-1.5 text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <div className="mx-5 h-px bg-white/10" />

      <nav
        aria-label="Admin navigation"
        className="flex-1 space-y-1 overflow-y-auto scrollbar-thin px-3 py-4"
      >
        <p className="px-2.5 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
          Workspace
        </p>
        {adminNavigation.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/65 hover:bg-white/5 hover:text-white',
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn(
                    'h-[18px] w-[18px] shrink-0 transition-colors',
                    isActive ? 'text-primary-soft' : 'text-white/45 group-hover:text-white/75',
                  )}
                  aria-hidden="true"
                />
                <span className="flex-1">{item.label}</span>
                {item.availableInSprint ? (
                  <span
                    className="rounded border border-white/10 px-1 py-0.5 text-[9px] font-medium uppercase tracking-wide text-white/35"
                    title={`Available in Sprint ${item.availableInSprint}`}
                  >
                    Soon
                  </span>
                ) : null}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="shrink-0 p-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-white">Sprint 1 · Foundation</p>
            <span className="h-1.5 w-1.5 rounded-full bg-primary-soft" aria-hidden="true" />
          </div>
          <p className="mt-1.5 text-[11px] leading-4 text-white/50">
            UI preview with sample data. No live accounts or payments are connected.
          </p>
        </div>
        <p className="mt-3 px-1 text-[10px] text-white/30">
          © {new Date().getFullYear()} Bachify
        </p>
      </div>
    </div>
  )
}

export function AdminLayout() {
  const [mobileNavPath, setMobileNavPath] = useState<string | null>(null)
  const location = useLocation()
  const mobileOpen = mobileNavPath === location.pathname

  const activeItem =
    adminNavigation.find((item) => location.pathname.startsWith(item.href)) ?? adminNavigation[0]

  useEffect(() => {
    if (!mobileOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileNavPath(null)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mobileOpen])

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only rounded-md bg-card px-3 py-2 text-sm font-medium focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60]"
      >
        Skip to main content
      </a>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] lg:block">
        <AdminSidebar />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-secondary/50 backdrop-blur-[1px] animate-fade-in"
            onClick={() => setMobileNavPath(null)}
            aria-label="Close navigation overlay"
          />
          <aside className="relative h-full w-[280px] shadow-elevated animate-slide-in-right">
            <AdminSidebar onNavigate={() => setMobileNavPath(null)} />
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setMobileNavPath(location.pathname)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Admin workspace
              </p>
              <p className="truncate text-sm font-semibold text-secondary">
                {activeItem?.label ?? 'Dashboard'}
              </p>
            </div>

            <Badge variant="success" withDot className="hidden sm:inline-flex">
              Dev preview
            </Badge>
            <div className="mx-1 hidden h-6 w-px bg-border sm:block" aria-hidden="true" />
            <ProfileMenu
              name="Aashish Shrestha"
              email="aashish@bachify.app"
              role="admin"
            />
          </div>
        </header>

        <main
          id="main-content"
          className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
        >
          <Suspense fallback={<PageLoading />}>
            <Outlet />
          </Suspense>
        </main>

        <footer className="mx-auto w-full max-w-[1440px] px-4 pb-6 sm:px-6 lg:px-8">
          <p className="text-xs text-muted-foreground/70">
            Bachify · Together We Save. Simply. · Sprint 1 preview
          </p>
        </footer>
      </div>
    </div>
  )
}
