import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, Eye, ShieldCheck, UsersRound } from 'lucide-react'
import { Logo } from '@/components/common/logo'
import { APP_TAGLINE, ROUTES } from '@/lib/constants'

const values = [
  {
    icon: UsersRound,
    title: 'Built for small groups',
    description: 'Designed for the 5–10 member Bhishi groups that run on trust.',
  },
  {
    icon: Eye,
    title: 'Everything visible',
    description: 'Contributions, cycle order and payouts stay clear to every member.',
  },
  {
    icon: ShieldCheck,
    title: 'Records that hold up',
    description: 'A dependable financial trail instead of scattered notes and messages.',
  },
]

export interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      {/* Brand panel — desktop only */}
      <aside className="relative hidden overflow-hidden bg-secondary p-10 text-white lg:flex lg:flex-col xl:p-14">
        <div
          className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full border border-white/[0.06]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full border border-white/[0.06]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute right-16 top-20 h-2 w-2 rounded-full bg-[hsl(var(--warning))]"
          aria-hidden="true"
        />

        <Link
          to={ROUTES.login}
          className="relative w-fit rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-4 focus-visible:ring-offset-secondary"
          aria-label="Bachat Book login"
        >
          <Logo variant="light" size="lg" showTagline />
        </Link>

        <div className="relative my-auto max-w-md py-14">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70">
            <BadgeCheck className="h-3.5 w-3.5 text-primary-soft" aria-hidden="true" />
            Digital Bhishi, made simple
          </div>
          <h1 className="text-balance text-3xl font-bold leading-[1.2] tracking-tight xl:text-4xl">
            Save together,
            <br />
            without the guesswork.
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/60">
            {APP_TAGLINE} Bachat Book keeps every contribution, cycle and payout in one clear place.
          </p>

          <ul className="mt-10 space-y-5">
            {values.map((value) => (
              <li key={value.title} className="flex gap-3.5">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06]">
                  <value.icon className="h-4 w-4 text-primary-soft" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{value.title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-white/50">{value.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/35">
          © {new Date().getFullYear()} Bachat Book · Sprint 1 UI preview
        </p>
      </aside>

      {/* Form panel */}
      <div className="flex min-h-screen flex-col">
        <div className="flex items-center justify-between px-5 py-5 sm:px-8 lg:hidden">
          <Link to={ROUTES.login} aria-label="Bachat Book login">
            <Logo size="md" />
          </Link>
          <span className="text-xs font-medium text-muted-foreground">Preview build</span>
        </div>

        <main
          id="main-content"
          className="flex flex-1 items-start justify-center px-5 pb-12 pt-4 sm:px-8 lg:items-center lg:py-12"
        >
          <div className="w-full max-w-[420px] animate-slide-in-up">{children}</div>
        </main>

        <footer className="px-5 pb-6 text-center text-xs text-muted-foreground/70 sm:px-8">
          <p>{APP_TAGLINE}</p>
        </footer>
      </div>
    </div>
  )
}
