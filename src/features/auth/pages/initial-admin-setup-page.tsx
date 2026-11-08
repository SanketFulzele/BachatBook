import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { FullPageLoading } from '@/components/feedback/full-page-loading'
import { AuthLayout } from '@/features/auth/components/auth-layout'
import { AuthStatusScreen } from '@/features/auth/components/auth-status-screen'
import { useAuth } from '@/features/auth/components/auth-context'
import { claimInitialAdmin } from '@/features/auth/api/auth-api'
import { useToast } from '@/components/ui/toast-context'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { ROUTES } from '@/lib/constants'

export function InitialAdminSetupPage() {
  useDocumentTitle('Initial administrator setup')
  const auth = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (auth.phase === 'loading') return <FullPageLoading />
  if (auth.phase === 'unconfigured') {
    return <AuthStatusScreen variant="config" issues={auth.configIssues} />
  }
  if (auth.phase === 'unauthenticated') {
    return <Navigate to={ROUTES.login} replace state={{ from: ROUTES.initialAdminSetup }} />
  }
  if (auth.phase === 'inactive') {
    return <AuthStatusScreen variant="inactive" message={auth.error} onSignOut={auth.signOut} />
  }
  if (auth.phase === 'error') {
    return (
      <AuthStatusScreen
        variant="error"
        message={auth.error}
        onRetry={auth.refreshProfile}
        onSignOut={auth.signOut}
      />
    )
  }
  if (auth.user?.role === 'admin') return <Navigate to={ROUTES.admin.dashboard} replace />

  const onClaim = async () => {
    setError(null)
    setIsSubmitting(true)
    const result = await claimInitialAdmin()
    setIsSubmitting(false)

    if (result.error) {
      setError(result.error)
      return
    }

    await auth.refreshProfile()
    toast({
      title: 'Administrator access enabled',
      description: `Profile ${result.profileId} is linked to your existing administrator account.`,
      variant: 'success',
    })
    void navigate(ROUTES.admin.dashboard, { replace: true })
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
          First-time setup
        </p>
        <h2 className="mt-2 text-[26px] font-bold tracking-tight text-secondary">
          Initial administrator
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          This one-time action links the existing, pre-approved Neon Auth account to its existing
          Bachat Book profile. It does not create another authentication account.
        </p>
      </div>

      {error ? (
        <Alert variant="error" title="Administrator setup was not completed" className="mb-6">
          {error}
        </Alert>
      ) : null}

      {auth.phase === 'needs-profile' && auth.error ? (
        <Alert variant="warning" title="Profile needs trusted linking" className="mb-6">
          {auth.error}
        </Alert>
      ) : null}

      <Alert variant="info" title="Restricted setup" className="mb-6">
        The database accepts this operation only for the configured existing Auth identity, only
        while no other active application administrator exists, and only once.
      </Alert>

      <Button
        type="button"
        size="lg"
        className="w-full"
        isLoading={isSubmitting}
        onClick={() => void onClaim()}
      >
        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        Link existing account and enable Admin
      </Button>
    </AuthLayout>
  )
}
