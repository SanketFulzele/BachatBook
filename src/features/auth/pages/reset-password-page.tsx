import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight, Check, LockKeyhole } from 'lucide-react'
import { AuthLayout } from '@/features/auth/components/auth-layout'
import { PasswordInput } from '@/features/auth/components/password-input'
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from '@/features/auth/schemas/auth.schemas'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
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
  const { toast } = useToast()
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

  const onSubmit = () => {
    setSubmitted(true)
    toast({
      title: 'Password fields validated',
      description: 'Password updates are enabled in Sprint 3. No credentials were stored.',
      variant: 'info',
    })
  }

  return (
    <AuthLayout>
      <Link
        to={ROUTES.login}
        className="mb-7 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to sign in
      </Link>

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

      <Alert variant="info" title="UI preview — this is not a live reset link" className="mb-6">
        Reset links will be issued and verified by Neon Auth in Sprint 3. Submitting this form does
        not change any password.
      </Alert>

      {submitted ? (
        <Alert variant="success" title="Both password fields are valid" className="mb-6">
          The reset flow is ready for backend wiring in Sprint 3. Nothing was saved.
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

        <Button type="submit" size="lg" className="w-full">
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
