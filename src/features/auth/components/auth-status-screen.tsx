import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  LogOut,
  RefreshCw,
  ServerCrash,
  ShieldX,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { Logo } from '@/components/common/logo'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { useToast } from '@/components/ui/toast-context'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { ROUTES } from '@/lib/constants'
import { dashboardPathForRole } from '../lib/dashboard-path'
import type { AuthRole } from '../types/auth.types'

export type AuthStatusVariant = 'config' | 'inactive' | 'error' | 'forbidden'

export interface AuthStatusScreenProps {
  variant: AuthStatusVariant
  message?: string | null
  issues?: string[]
  userRole?: AuthRole
  requiredRole?: AuthRole
  onRetry?: () => Promise<unknown> | void
  onSignOut?: () => Promise<unknown> | void
}

const variantContent: Record<
  Exclude<AuthStatusVariant, 'forbidden'>,
  { eyebrow: string; title: string; description: string; icon: LucideIcon }
> = {
  config: {
    eyebrow: 'Configuration',
    title: 'Authentication is not configured',
    description:
      'Add the Neon Auth and Data API URLs to your local .env file, then restart the dev server.',
    icon: Wrench,
  },
  inactive: {
    eyebrow: 'Account unavailable',
    title: 'This account has been deactivated',
    description:
      'Your sign-in worked, but the application profile is inactive. Ask your group administrator to restore access.',
    icon: ShieldX,
  },
  error: {
    eyebrow: 'Sign-in check failed',
    title: "We couldn't verify your session",
    description:
      'The authentication service or database could not be reached. Check your connection and try again.',
    icon: ServerCrash,
  },
}

function roleLabel(role: AuthRole): string {
  return role === 'admin' ? 'administrator' : 'member'
}

export function AuthStatusScreen({
  variant,
  message,
  issues,
  userRole,
  requiredRole,
  onRetry,
  onSignOut,
}: AuthStatusScreenProps) {
  const [isBusy, setIsBusy] = useState(false)
  const { toast } = useToast()

  const content: { eyebrow: string; title: string; description: string; icon: LucideIcon } =
    variant === 'forbidden'
      ? {
          eyebrow: 'Access denied',
          title: 'You do not have access to this area',
          description:
            requiredRole === 'admin'
              ? 'This area is for administrators. Your account has member access.'
              : 'This area is for members. Your account has administrator access.',
          icon: ShieldX,
        }
      : variantContent[variant]

  const Icon = content.icon

  useDocumentTitle(content.title)

  const runAction = async (action: () => Promise<unknown> | void) => {
    setIsBusy(true)
    try {
      const result = await action()
      if (typeof result === 'string') {
        toast({
          title: 'Sign-out could not be confirmed',
          description: `${result} Close this browser on a shared device.`,
          variant: 'error',
        })
      }
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-card">
        <Logo size="md" />

        <div className="mt-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <Icon className="h-7 w-7" aria-hidden="true" />
        </div>

        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          {content.eyebrow}
        </p>
        <h1 className="mt-2 text-xl font-bold tracking-tight text-secondary">{content.title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{content.description}</p>

        {variant === 'config' && issues && issues.length > 0 ? (
          <ul className="mt-4 space-y-1.5 rounded-lg border border-border bg-muted/50 p-3.5 text-xs leading-5 text-muted-foreground">
            {issues.map((issue) => (
              <li key={issue} className="flex gap-2">
                <span className="text-destructive" aria-hidden="true">
                  •
                </span>
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {variant === 'config' ? (
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            Required variables: <code className="font-mono">VITE_NEON_AUTH_URL</code> and{' '}
            <code className="font-mono">VITE_NEON_DATA_API_URL</code>. See{' '}
            <code className="font-mono">.env.example</code>. Never commit <code>.env</code>.
          </p>
        ) : null}

        {variant !== 'config' && message ? (
          <p className="mt-4 rounded-lg border border-border bg-muted/50 p-3.5 text-xs leading-5 text-muted-foreground">
            {message}
          </p>
        ) : null}

        <div className="mt-7 flex flex-wrap gap-2">
          {variant === 'forbidden' && userRole ? (
            <Link to={dashboardPathForRole(userRole)} className={buttonVariants()}>
              Go to my dashboard
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : null}

          {variant === 'error' && onRetry ? (
            <Button
              variant="outline"
              isLoading={isBusy}
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={() => void runAction(onRetry)}
            >
              Try again
            </Button>
          ) : null}

          {variant === 'config' ? (
            <Button
              variant="outline"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={() => window.location.reload()}
            >
              Reload page
            </Button>
          ) : null}

          {onSignOut ? (
            <Button
              variant={variant === 'forbidden' ? 'outline' : 'ghost'}
              isLoading={isBusy}
              leftIcon={<LogOut className="h-4 w-4" />}
              onClick={() => void runAction(onSignOut)}
            >
              Sign out
            </Button>
          ) : null}

          {variant !== 'forbidden' && !onSignOut ? (
            <Link to={ROUTES.login} className={buttonVariants({ variant: 'outline' })}>
              Back to sign in
            </Link>
          ) : null}
        </div>

        {variant === 'forbidden' && userRole ? (
          <p className="mt-5 text-xs leading-5 text-muted-foreground">
            You are signed in with {roleLabel(userRole)} access. Administrators are provisioned
            through a trusted database connection, never from the browser.
          </p>
        ) : null}
      </div>
    </main>
  )
}
