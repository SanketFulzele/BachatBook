import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { FullPageLoading } from '@/components/feedback/full-page-loading'
import { ROUTES } from '@/lib/constants'
import { AuthStatusScreen } from './auth-status-screen'
import { useAuth } from './auth-context'
import { dashboardPathForRole } from '../lib/dashboard-path'
import type { AuthRole } from '../types/auth.types'

/**
 * Landing redirect for `/`.
 *
 * Signed-in users go straight to their own dashboard, signed-out users go to
 * the sign-in screen, and users without a profile are sent to onboarding.
 */
export function HomeRedirect() {
  const auth = useAuth()

  if (auth.phase === 'loading') return <FullPageLoading />

  if (auth.phase === 'unconfigured') {
    return <AuthStatusScreen variant="config" issues={auth.configIssues} />
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

  if (auth.phase === 'needs-profile') return <Navigate to={ROUTES.completeProfile} replace />

  if (auth.phase === 'authenticated' && auth.user) {
    return <Navigate to={dashboardPathForRole(auth.user.role)} replace />
  }

  return <Navigate to={ROUTES.login} replace />
}

/**
 * Protects /admin/* and /member/*.
 *
 * The role comes only from public.profiles, read through the Data API under
 * RLS. The guard improves navigation; it is not a security boundary. Every
 * query and mutation is still authorized by PostgreSQL RLS.
 */
export function RequireRole({ role }: { role: AuthRole }) {
  const auth = useAuth()
  const location = useLocation()

  if (auth.phase === 'loading') return <FullPageLoading />

  if (auth.phase === 'unconfigured') {
    return <AuthStatusScreen variant="config" issues={auth.configIssues} />
  }

  if (auth.phase === 'unauthenticated') {
    return (
      <Navigate
        to={ROUTES.login}
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }

  if (auth.phase === 'needs-profile') {
    return <Navigate to={ROUTES.completeProfile} replace />
  }

  if (auth.phase === 'inactive') {
    return <AuthStatusScreen variant="inactive" message={auth.error} onSignOut={auth.signOut} />
  }

  if (auth.phase === 'error' || !auth.user) {
    return (
      <AuthStatusScreen
        variant="error"
        message={auth.error}
        onRetry={auth.refreshProfile}
        onSignOut={auth.signOut}
      />
    )
  }

  if (auth.user.role !== role) {
    return (
      <AuthStatusScreen
        variant="forbidden"
        userRole={auth.user.role}
        requiredRole={role}
        onSignOut={auth.signOut}
      />
    )
  }

  return <Outlet />
}

/**
 * Protects /complete-profile.
 *
 * A signed-in user with no application profile may create exactly one member
 * profile through ensure_own_profile(). Users who already have a profile are
 * sent to their dashboard, and signed-out users go to /login.
 */
export function RequireSession() {
  const auth = useAuth()
  const location = useLocation()

  if (auth.phase === 'loading') return <FullPageLoading />

  if (auth.phase === 'unconfigured') {
    return <AuthStatusScreen variant="config" issues={auth.configIssues} />
  }

  if (auth.phase === 'unauthenticated') {
    return (
      <Navigate
        to={ROUTES.login}
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
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

  if (auth.phase === 'authenticated' && auth.user) {
    return <Navigate to={dashboardPathForRole(auth.user.role)} replace />
  }

  if (auth.phase === 'needs-profile') {
    return <Outlet />
  }

  return <FullPageLoading />
}
