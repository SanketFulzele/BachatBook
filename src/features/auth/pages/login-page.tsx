import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, LockKeyhole, Mail } from 'lucide-react'
import { AuthLayout } from '@/features/auth/components/auth-layout'
import { PasswordInput } from '@/features/auth/components/password-input'
import { useAuth } from '@/features/auth/components/auth-context'
import { loginSchema, type LoginFormValues } from '@/features/auth/schemas/auth.schemas'
import type { AuthRole } from '@/features/auth/types/auth.types'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast-context'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { ROUTES } from '@/lib/constants'

function resolvePostLoginPath(role: AuthRole, from: string | null): string {
  const prefix = role === 'admin' ? '/admin' : '/member'

  if (from && from.startsWith(prefix) && !from.startsWith('//')) {
    return from
  }

  return role === 'admin' ? ROUTES.admin.dashboard : ROUTES.member.dashboard
}

function readFromPath(state: unknown): string | null {
  if (typeof state !== 'object' || state === null) return null
  const from = (state as { from?: unknown }).from
  return typeof from === 'string' ? from : null
}

export function LoginPage() {
  useDocumentTitle('Sign in')
  const auth = useAuth()
  const { toast } = useToast()
  const location = useLocation()

  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  const from = readFromPath(location.state)
  const isUnconfigured = auth.phase === 'unconfigured'

  if (auth.phase === 'authenticated' && auth.user) {
    return <Navigate to={resolvePostLoginPath(auth.user.role, from)} replace />
  }

  if (auth.phase === 'needs-profile') {
    return <Navigate to={ROUTES.completeProfile} replace />
  }

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null)
    setIsSubmitting(true)

    const result = await auth.signIn({
      email: values.email,
      password: values.password,
      rememberMe: values.rememberMe,
    })

    setIsSubmitting(false)

    if (result.error) {
      setFormError(result.error)
      return
    }

    // Redirects are handled by the render-phase checks above as the auth
    // state settles, so a slow profile fetch cannot bounce the user to the
    // wrong portal. Only show feedback here.
    toast({
      title: 'Signed in',
      description:
        result.phase === 'needs-profile'
          ? 'Complete your profile to continue.'
          : 'Your session is active.',
      variant: 'success',
    })
  }

  return (
    <AuthLayout>
      <div className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Welcome back
        </p>
        <h2 className="mt-2 text-[26px] font-bold tracking-tight text-secondary">
          Sign in to Bachat Book
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Manage your savings groups, cycles and collections in one place.
        </p>
      </div>

      {isUnconfigured ? (
        <Alert variant="error" title="Authentication is not configured" className="mb-6">
          Add <code className="font-mono">VITE_NEON_AUTH_URL</code> and{' '}
          <code className="font-mono">VITE_NEON_DATA_API_URL</code> to <code>.env</code>, then
          restart the dev server.
          {auth.configIssues.length > 0 ? (
            <span className="mt-1 block">{auth.configIssues.join(' ')}</span>
          ) : null}
        </Alert>
      ) : null}

      {formError ? (
        <Alert variant="error" title="Could not sign in" className="mb-6">
          {formError}
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email" required>
            Email address
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            startIcon={<Mail className="h-4 w-4" aria-hidden="true" />}
            invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...register('email')}
          />
          {errors.email ? (
            <p id="email-error" role="alert" className="text-xs font-medium text-destructive">
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password" required>
              Password
            </Label>
            <Link
              to={ROUTES.forgotPassword}
              className="text-xs font-medium text-primary underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            startIcon={<LockKeyhole className="h-4 w-4" aria-hidden="true" />}
            invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'password-error' : undefined}
            {...register('password')}
          />
          {errors.password ? (
            <p id="password-error" role="alert" className="text-xs font-medium text-destructive">
              {errors.password.message}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <input
            id="rememberMe"
            type="checkbox"
            className="h-4 w-4 rounded border-input bg-card accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            {...register('rememberMe')}
          />
          <Label htmlFor="rememberMe" className="text-sm font-normal text-muted-foreground">
            Keep me signed in on this device
          </Label>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={isSubmitting}
          disabled={isUnconfigured}
        >
          Sign in
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </form>

      <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
        Accounts are created by your group administrator. Contact them if you need access.
      </p>
    </AuthLayout>
  )
}
