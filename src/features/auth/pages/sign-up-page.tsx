import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { AuthLayout } from '@/features/auth/components/auth-layout'
import { PasswordInput } from '@/features/auth/components/password-input'
import { useAuth } from '@/features/auth/components/auth-context'
import { signUpSchema, type SignUpFormValues } from '@/features/auth/schemas/auth.schemas'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast-context'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { ROUTES } from '@/lib/constants'
import { dashboardPathForRole } from '../lib/dashboard-path'

export function SignUpPage() {
  useDocumentTitle('Create your account')
  const auth = useAuth()
  const { toast } = useToast()
  const [formError, setFormError] = useState<string | null>(null)
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  })

  if (auth.phase === 'authenticated' && auth.user) {
    return <Navigate to={dashboardPathForRole(auth.user.role)} replace />
  }

  const isUnconfigured = auth.phase === 'unconfigured'

  const onSubmit = async (values: SignUpFormValues) => {
    setFormError(null)
    setRegistrationComplete(false)
    setIsSubmitting(true)

    const result = await auth.signUp({
      fullName: values.fullName,
      email: values.email,
      password: values.password,
    })

    setIsSubmitting(false)

    if (result.error) {
      setFormError(result.error)
      return
    }

    setRegistrationComplete(true)
    toast({
      title: 'Account created',
      description: result.requiresEmailVerification
        ? 'Check your email to verify your account, then sign in.'
        : 'Your member profile is ready.',
      variant: 'success',
    })
  }

  return (
    <AuthLayout>
      <div className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Get started
        </p>
        <h2 className="mt-2 text-[26px] font-bold tracking-tight text-secondary">
          Create your account
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Join Bachat Book to follow your savings group and contributions.
        </p>
      </div>

      {isUnconfigured ? (
        <Alert variant="error" title="Authentication is not configured" className="mb-6">
          Add <code className="font-mono">VITE_NEON_AUTH_URL</code> and{' '}
          <code className="font-mono">VITE_NEON_DATA_API_URL</code> to <code>.env</code>, then
          restart the dev server.
        </Alert>
      ) : null}

      {registrationComplete ? (
        <Alert variant="success" title="Registration complete" className="mb-6">
          If email verification is enabled, verify your address and then sign in. Your application
          profile is created as a member when an authenticated session is available.
        </Alert>
      ) : null}

      {formError ? (
        <Alert variant="error" title="Could not create your account" className="mb-6">
          {formError}
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="fullName" required>
            Full name
          </Label>
          <Input
            id="fullName"
            autoComplete="name"
            placeholder="Your full name"
            startIcon={<UserRound className="h-4 w-4" aria-hidden="true" />}
            invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? 'full-name-error' : undefined}
            {...register('fullName')}
          />
          {errors.fullName ? (
            <p id="full-name-error" role="alert" className="text-xs font-medium text-destructive">
              {errors.fullName.message}
            </p>
          ) : null}
        </div>

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
          <Label htmlFor="password" required>
            Password
          </Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="Create a password"
            startIcon={<LockKeyhole className="h-4 w-4" aria-hidden="true" />}
            invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'password-error' : undefined}
            {...register('password')}
          />
          {errors.password ? (
            <p id="password-error" role="alert" className="text-xs font-medium text-destructive">
              {errors.password.message}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              At least 8 characters, including uppercase, lowercase and a number.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" required>
            Confirm password
          </Label>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            placeholder="Enter your password again"
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
          Create account
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </form>

      <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
        Already have an account?{' '}
        <Link
          to={ROUTES.login}
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Login
        </Link>
      </p>
    </AuthLayout>
  )
}
