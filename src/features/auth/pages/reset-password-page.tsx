import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight, Check, LockKeyhole } from 'lucide-react'
import { AuthLayout } from '@/features/auth/components/auth-layout'
import { PasswordInput } from '@/features/auth/components/password-input'
import { useAuth } from '@/features/auth/components/auth-context'
import { resetPasswordWithToken } from '@/features/auth/api/auth-api'
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from '@/features/auth/schemas/auth.schemas'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast-context'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'

const passwordRules = [
  { label: 'At least 8 characters', test: (value: string) => value.length >= 8 },
  { label: 'One lowercase letter', test: (value: string) => /[a-z]/.test(value) },
  { label: 'One uppercase letter', test: (value: string) => /[A-Z]/.test(value) },
  { label: 'One number', test: (value: string) => /[0-9]/.test(value) },
]

export function ResetPasswordPage() {
  useDocumentTitle('Reset password')
  const auth = useAuth()
  const { toast } = useToast()
  const [searchParams] = useSearchParams()

  // Managed Better Auth appends the reset token as ?token=… to the
  // redirectTo URL configured in the project's auth settings.
  const token = searchParams.get('token')?.trim() ?? ''

  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const passwordValue = useWatch({ control, name: 'password' })
  const isUnconfigured = auth.phase === 'unconfigured'

  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (!token) return

    setFormError(null)
    setIsSubmitting(true)

    const result = await resetPasswordWithToken(values.password, token)

    setIsSubmitting(false)

    if (result.error) {
      setFormError(result.error)
      return
    }

    setSubmitted(true)
    toast({
      title: 'Password updated',
      description: 'Sign in with your new password.',
      variant: 'success',
    })
  }

  const backLink = (
    <Link
      to={ROUTES.login}
      className="mb-7 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Back to sign in
    </Link>
  )

  if (!token) {
    return (
      <AuthLayout>
        {backLink}

        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Reset link
          </p>
          <h2 className="mt-2 text-[26px] font-bold tracking-tight text-secondary">
            This reset link is incomplete
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            The link is missing its reset token, or it has already been used. Reset links are
            single-use and expire.
          </p>
        </div>

        <Alert variant="warning" title="Request a fresh link">
          Password reset links can only be used once. Request a new email and open the link from
          that message.
        </Alert>

        <Link
          to={ROUTES.forgotPassword}
          className={buttonVariants({ size: 'lg', className: 'mt-6 w-full' })}
        >
          Request a new reset link
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </AuthLayout>
    )
  }

  if (submitted) {
    return (
      <AuthLayout>
        {backLink}

        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Password updated
          </p>
          <h2 className="mt-2 text-[26px] font-bold tracking-tight text-secondary">
            Your password has been reset
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Sign in with your new password to continue.
          </p>
        </div>

        <Alert variant="success" title="All set">
          This reset link can no longer be used. If you did not make this change, contact your group
          administrator immediately.
        </Alert>

        <Link
          to={ROUTES.login}
          className={buttonVariants({ size: 'lg', className: 'mt-6 w-full' })}
        >
          Go to sign in
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      {backLink}

      <div className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Choose a new password
        </p>
        <h2 className="mt-2 text-[26px] font-bold tracking-tight text-secondary">
          Reset your password
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Use a strong password that you don&apos;t use for another account.
        </p>
      </div>

      {isUnconfigured ? (
        <Alert variant="error" title="Authentication is not configured" className="mb-6">
          Add <code className="font-mono">VITE_NEON_AUTH_URL</code> and{' '}
          <code className="font-mono">VITE_NEON_DATA_API_URL</code> to <code>.env</code>, then
          restart the dev server.
        </Alert>
      ) : null}

      {formError ? (
        <Alert variant="error" title="Could not reset the password" className="mb-6">
          {formError}
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="password" required>
            New password
          </Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="Create a strong password"
            startIcon={<LockKeyhole className="h-4 w-4" aria-hidden="true" />}
            invalid={Boolean(errors.password)}
            aria-describedby="password-requirements"
            {...register('password')}
          />
          {errors.password ? (
            <p id="password-error" role="alert" className="text-xs font-medium text-destructive">
              {errors.password.message}
            </p>
          ) : null}

          <ul id="password-requirements" className="grid grid-cols-2 gap-1.5 pt-1">
            {passwordRules.map((rule) => {
              const passed = rule.test(passwordValue)
              return (
                <li
                  key={rule.label}
                  className={cn(
                    'flex items-center gap-1.5 text-[11px]',
                    passed ? 'text-success' : 'text-muted-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-3.5 w-3.5 items-center justify-center rounded-full border',
                      passed ? 'border-success bg-success text-white' : 'border-border',
                    )}
                  >
                    {passed ? <Check className="h-2.5 w-2.5" aria-hidden="true" /> : null}
                  </span>
                  {rule.label}
                </li>
              )
            })}
          </ul>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" required>
            Confirm new password
          </Label>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            placeholder="Re-enter your new password"
            startIcon={<LockKeyhole className="h-4 w-4" aria-hidden="true" />}
            invalid={Boolean(errors.confirmPassword)}
            aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword ? (
            <p
              id="confirm-password-error"
              role="alert"
              className="text-xs font-medium text-destructive"
            >
              {errors.confirmPassword.message}
            </p>
          ) : null}
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={isSubmitting}
          disabled={isUnconfigured}
        >
          Reset password
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </form>

      <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
        Need a new reset link?{' '}
        <Link
          to={ROUTES.forgotPassword}
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Request another email
        </Link>
      </p>
    </AuthLayout>
  )
}
