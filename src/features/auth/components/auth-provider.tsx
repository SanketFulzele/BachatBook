import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { getNeonAuth, getNeonConfigIssues } from '@/lib/neon'
import { queryClient } from '@/lib/query-client'
import {
  createOwnProfile,
  describeAuthError,
  fetchOwnProfile,
  type ProfileSummary,
} from '../api/auth-api'
import { AuthContext, type AuthContextValue } from './auth-context'
import type {
  AuthPhase,
  AuthState,
  AuthUser,
  CompleteProfileInput,
  CompleteProfileResult,
  SignInInput,
  SignInResult,
} from '../types/auth.types'

/**
 * Minimal shape of the Better Auth session atom consumed here. The public
 * client exposes `useSession` as a nanostore atom; subscribing to it gives
 * cross-tab sign-in/sign-out updates and automatic expiry refreshes.
 */
interface SessionSnapshot {
  data: {
    user: {
      id: string
      email: string
      name?: string | null
    }
  } | null
  error: { status?: number; message?: string } | null
  isPending: boolean
}

interface LoadProfileOutcome {
  user: AuthUser | null
  phase: AuthPhase
  error: string | null
}

const initialState: AuthState = {
  phase: 'loading',
  user: null,
  sessionEmail: null,
  sessionName: null,
  error: null,
  configIssues: [],
}

function toAuthUser(profile: ProfileSummary, sessionEmail: string | null): AuthUser {
  return {
    id: profile.id,
    email: profile.email ?? sessionEmail ?? '',
    fullName: profile.full_name,
    role: profile.role,
    phone: profile.phone ?? undefined,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState)

  const authUserIdRef = useRef<string | null>(null)
  const sessionEmailRef = useRef<string | null>(null)
  const profileRequestRef = useRef(0)

  const resetToUnauthenticated = useCallback(() => {
    authUserIdRef.current = null
    sessionEmailRef.current = null
    // Invalidate any in-flight profile request.
    profileRequestRef.current += 1
    queryClient.clear()
    setState((previous) => ({
      ...previous,
      phase: 'unauthenticated',
      user: null,
      sessionEmail: null,
      sessionName: null,
      error: null,
    }))
  }, [])

  const loadProfile = useCallback(
    async (authUserId: string, sessionEmail: string | null): Promise<LoadProfileOutcome> => {
      const requestId = profileRequestRef.current + 1
      profileRequestRef.current = requestId
      authUserIdRef.current = authUserId
      sessionEmailRef.current = sessionEmail

      const result = await fetchOwnProfile(authUserId)

      // A newer request (or a sign-out) superseded this one.
      if (profileRequestRef.current !== requestId) {
        return { user: null, phase: 'loading', error: null }
      }

      if (result.error) {
        if (result.error.expired) {
          resetToUnauthenticated()
          return { user: null, phase: 'unauthenticated', error: result.error.message }
        }

        setState((previous) => ({
          ...previous,
          phase: 'error',
          user: null,
          error: result.error?.message ?? 'We could not load your profile.',
        }))
        return {
          user: null,
          phase: 'error',
          error: result.error.message,
        }
      }

      if (!result.data) {
        setState((previous) => ({
          ...previous,
          phase: 'needs-profile',
          user: null,
          error: null,
        }))
        return { user: null, phase: 'needs-profile', error: null }
      }

      if (!result.data.is_active) {
        const message =
          'This account has been deactivated. Ask your group administrator to restore access.'
        setState((previous) => ({
          ...previous,
          phase: 'inactive',
          user: null,
          error: message,
        }))
        return { user: null, phase: 'inactive', error: message }
      }

      const user = toAuthUser(result.data, sessionEmail)
      setState((previous) => ({
        ...previous,
        phase: 'authenticated',
        user,
        sessionEmail,
        error: null,
      }))
      return { user, phase: 'authenticated', error: null }
    },
    [resetToUnauthenticated],
  )

  const handleSessionSnapshot = useCallback(
    (snapshot: SessionSnapshot) => {
      const sessionUser = snapshot.data?.user ?? null

      if (snapshot.error) {
        const status = snapshot.error.status

        if (status === 401 || status === 403) {
          resetToUnauthenticated()
          return
        }

        if (!sessionUser) {
          setState((previous) => ({
            ...previous,
            phase: 'error',
            user: null,
            error: describeAuthError(snapshot.error),
          }))
          return
        }
      }

      if (!sessionUser) {
        if (snapshot.isPending) {
          setState((previous) =>
            previous.phase === 'loading'
              ? previous
              : { ...previous, phase: 'loading', user: null, error: null },
          )
          return
        }

        resetToUnauthenticated()
        return
      }

      // The same session can emit several updates (focus refresh, token
      // refresh). Only reload the profile when the identity actually changes.
      if (authUserIdRef.current === sessionUser.id) return

      sessionEmailRef.current = sessionUser.email ?? null
      setState((previous) => ({
        ...previous,
        phase: 'loading',
        sessionEmail: sessionUser.email ?? null,
        sessionName: sessionUser.name ?? null,
        error: null,
      }))
      void loadProfile(sessionUser.id, sessionUser.email ?? null)
    },
    [loadProfile, resetToUnauthenticated],
  )

  useEffect(() => {
    const issues = getNeonConfigIssues()

    if (issues.length > 0) {
      setState({
        ...initialState,
        phase: 'unconfigured',
        configIssues: issues,
      })
      return
    }

    let unsubscribe: (() => void) | undefined

    try {
      const auth = getNeonAuth()
      unsubscribe = auth.useSession.subscribe(handleSessionSnapshot)
    } catch (error) {
      setState({
        ...initialState,
        phase: 'error',
        error: describeAuthError(error),
      })
    }

    return () => {
      unsubscribe?.()
    }
  }, [handleSessionSnapshot])

  const signIn = useCallback(
    async (input: SignInInput): Promise<SignInResult> => {
      try {
        const auth = getNeonAuth()
        const { error } = await auth.signIn.email({
          email: input.email.trim(),
          password: input.password,
          rememberMe: input.rememberMe ?? false,
        })

        if (error) {
          return { error: describeAuthError(error), phase: 'unauthenticated', role: null }
        }

        setState((previous) => ({ ...previous, phase: 'loading', error: null }))

        const session = await auth.getSession()
        const sessionUser = session.data?.user

        if (!sessionUser) {
          const message =
            'Sign-in succeeded but no session was returned. Please try again or contact your administrator.'
          setState((previous) => ({ ...previous, phase: 'error', error: message }))
          return { error: message, phase: 'error', role: null }
        }

        sessionEmailRef.current = sessionUser.email ?? null
        const outcome = await loadProfile(sessionUser.id, sessionUser.email ?? null)

        return {
          error: outcome.error,
          phase: outcome.phase,
          role: outcome.user?.role ?? null,
        }
      } catch (error) {
        const message = describeAuthError(error)
        setState((previous) => ({
          ...previous,
          phase: 'unauthenticated',
          user: null,
          error: message,
        }))
        return { error: message, phase: 'unauthenticated', role: null }
      }
    },
    [loadProfile],
  )

  const signOut = useCallback(async (): Promise<string | null> => {
    let errorMessage: string | null = null
    try {
      const result = await getNeonAuth().signOut()
      if (result.error) errorMessage = describeAuthError(result.error)
    } catch (error) {
      errorMessage = describeAuthError(error)
    } finally {
      resetToUnauthenticated()
    }

    return errorMessage
  }, [resetToUnauthenticated])

  const completeProfile = useCallback(
    async (input: CompleteProfileInput): Promise<CompleteProfileResult> => {
      const authUserId = authUserIdRef.current

      if (!authUserId) {
        return { error: 'Your session has expired. Please sign in again.', role: null }
      }

      setState((previous) => ({ ...previous, phase: 'loading', error: null }))

      const created = await createOwnProfile({
        fullName: input.fullName,
        phone: input.phone?.trim() || undefined,
        email: sessionEmailRef.current ?? undefined,
      })

      if (created.error) {
        if (created.error.expired) {
          resetToUnauthenticated()
          return { error: created.error.message, role: null }
        }

        setState((previous) => ({
          ...previous,
          phase: 'needs-profile',
          error: created.error?.message ?? null,
        }))
        return { error: created.error.message, role: null }
      }

      const outcome = await loadProfile(authUserId, sessionEmailRef.current)
      return { error: outcome.error, role: outcome.user?.role ?? null }
    },
    [loadProfile, resetToUnauthenticated],
  )

  const refreshProfile = useCallback(async () => {
    if (authUserIdRef.current) {
      await loadProfile(authUserIdRef.current, sessionEmailRef.current)
      return
    }

    try {
      const auth = getNeonAuth()
      await auth.useSession.get().refetch()
    } catch (error) {
      setState((previous) => ({
        ...previous,
        phase: 'error',
        error: describeAuthError(error),
      }))
    }
  }, [loadProfile])

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      signIn,
      signOut,
      completeProfile,
      refreshProfile,
    }),
    [state, signIn, signOut, completeProfile, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
