import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight, Mail } from 'lucide-react'
import { AuthLayout } from '@/features/auth/components/auth-layout'
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '@/features/auth/schemas/auth.schemas'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast-context'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { ROUTES } from '@/lib/constants'

export function ForgotPasswordPage() {
  useDocumentTitle('Forgot password')
  const { toast } = useToast()
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = (values: ForgotPasswordFormValues) => {
    setSubmittedEmail(values.email)
    toast({
      title: 'Email validated',
      description: 'Reset-email delivery is enabled in Sprint 3. No message was sent.',
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
          Account recovery
        </p>
        <h2 className="mt-2 text-[26px] font-bold tracking-tight text-secondary">
          Forgot your password?
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Enter the email linked to your Bachify account and we&apos;ll help you get back in.
        </p>
      </div>

      <Alert variant="info" title="UI preview — no email is sent" className="mb-6">
        Password recovery will be connected to Supabase authentication in Sprint 3.
      </Alert>

      {submittedEmail ? (
        <Alert variant="success" title="Your email passed validation" className="mb-6">
          <span className="break-all font-medium">{submittedEmail}</span> looks valid. In Sprint 3,
          a secure reset link will be delivered to this address.
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

        <Button type="submit" size="lg" className="w-full">
          Send reset link
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </form>

      <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
        Remembered your password?{' '}
        <Link to={ROUTES.login} className="font-semibold text-primary underline-offset-4 hover:underline">
          Return to sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
