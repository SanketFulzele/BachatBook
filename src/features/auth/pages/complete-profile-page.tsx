import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, LogOut, Phone, ShieldCheck, UserRound } from 'lucide-react'
import { AuthLayout } from '@/features/auth/components/auth-layout'
import { useAuth } from '@/features/auth/components/auth-context'
import { dashboardPathForRole } from '@/features/auth/lib/dashboard-path'
import {
  completeProfileSchema,
  type CompleteProfileFormValues,
} from '@/features/auth/schemas/auth.schemas'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast-context'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { ROUTES } from '@/lib/constants'

export function CompleteProfilePage() {
  useDocumentTitle('Complete your profile')
  const auth = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompleteProfileFormValues>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: {
      fullName: auth.sessionName?.trim() ?? '',
      phone: '',
    },
  })

  if (auth.phase === 'authenticated' && auth.user) {
    return <Navigate to={dashboardPathForRole(auth.user.role)} replace />
  }

  if (auth.phase === 'unauthenticated') {
    return <Navigate to={ROUTES.login} replace />
  }

  const onSubmit = async (values: CompleteProfileFormValues) => {
    setFormError(null)
    setIsSubmitting(true)

    const result = await auth.completeProfile({
      fullName: values.fullName,
      phone: values.phone.trim() || undefined,
    })

    setIsSubmitting(false)

    if (result.error) {
      setFormError(result.error)
      return
    }

    toast({
      title: 'Profile created',
      description: 'Your member profile is ready.',
      variant: 'success',
    })

    if (result.role) {
      void navigate(dashboardPathForRole(result.role), { replace: true })
    }
  }

  const onSignOut = async () => {
    setIsSigningOut(true)
    await auth.signOut()
    setIsSigningOut(false)
    void navigate(ROUTES.login, { replace: true })
  }

  return (
    <AuthLayout>
      <div className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          One last step
        </p>
        <h2 className="mt-2 text-[26px] font-bold tracking-tight text-secondary">
          Complete your profile
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Your sign-in works, but no Bachat Book profile is linked to it yet. Confirm your details
          to start using the member portal.
        </p>
      </div>

      {auth.sessionEmail ? (
        <p className="mb-6 rounded-lg border border-border bg-muted/50 px-3.5 py-2.5 text-xs text-muted-foreground">
          Signed in as <span className="font-medium text-foreground">{auth.sessionEmail}</span>
        </p>
      ) : null}

      {formError ? (
        <Alert variant="error" title="Could not create your profile" className="mb-6">
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
            type="text"
            autoComplete="name"
            placeholder="e.g. Sita Gurung"
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
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="Optional"
            startIcon={<Phone className="h-4 w-4" aria-hidden="true" />}
            invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? 'phone-error' : 'phone-hint'}
            {...register('phone')}
          />
          {errors.phone ? (
            <p id="phone-error" role="alert" className="text-xs font-medium text-destructive">
              {errors.phone.message}
            </p>
          ) : (
            <p id="phone-hint" className="text-xs text-muted-foreground">
              Used by your group administrator to reach you about collections.
            </p>
          )}
        </div>

        <Alert variant="info" title="Member access only">
          Self-service onboarding always creates a <strong>member</strong> profile. Administrator
          accounts are provisioned separately through a trusted database connection.
        </Alert>

        <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
          Create my profile
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </form>

      <div className="mt-6 flex flex-col items-center gap-3 text-center">
        <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Roles are assigned by the database, never by this form.
        </p>
        <Button
          variant="ghost"
          size="sm"
          isLoading={isSigningOut}
          leftIcon={<LogOut className="h-4 w-4" aria-hidden="true" />}
          onClick={() => void onSignOut()}
        >
          Use a different account
        </Button>
      </div>

      <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">
        Need help?{' '}
        <Link
          to={ROUTES.login}
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Return to sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
