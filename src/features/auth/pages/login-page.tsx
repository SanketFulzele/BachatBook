import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, LockKeyhole, Mail } from 'lucide-react'
import { AuthLayout } from '@/features/auth/components/auth-layout'
import { PasswordInput } from '@/features/auth/components/password-input'
import { loginSchema, type LoginFormValues } from '@/features/auth/schemas/auth.schemas'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast-context'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { ROUTES } from '@/lib/constants'

export function LoginPage() {
  useDocumentTitle('Sign in')
  const { toast } = useToast()
  const [validated, setValidated] = useState(false)

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

  const onSubmit = (values: LoginFormValues) => {
    setValidated(true)
    toast({
      title: 'Form validated',
      description: `Sign-in for ${values.email} will be connected in Sprint 3. No session was created.`,
      variant: 'info',
    })
  }

  return (
    <AuthLayout>
      <div className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Welcome back</p>
        <h2 className="mt-2 text-[26px] font-bold tracking-tight text-secondary">
          Sign in to Bachify
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Manage your savings groups, cycles and collections in one place.
        </p>
      </div>

      <Alert variant="info" title="UI preview — authentication is not connected" className="mb-6">
        This form validates input locally. No credentials are sent and no session is created until
        Sprint 3.
      </Alert>

      {validated ? (
        <Alert variant="success" title="Input looks valid" className="mb-6">
          The sign-in flow will be enabled once authentication is implemented in Sprint 3.
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
            Remember me on this device
          </Label>
        </div>

        <Button type="submit" size="lg" className="w-full">
          Sign in
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </form>

      <div className="my-7 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Explore the preview
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Link to={ROUTES.admin.dashboard} className={buttonVariants({ variant: 'outline' })}>
          Admin dashboard
        </Link>
        <Link to={ROUTES.member.dashboard} className={buttonVariants({ variant: 'outline' })}>
          Member portal
        </Link>
      </div>
    </AuthLayout>
  )
}
