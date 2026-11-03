/**
 * Authentication shapes for the Neon Auth + Data API layer.
 *
 * `AuthUser.id` is the application profile id (public.profiles.id), not the
 * Neon Auth user id. The Neon Auth identity is stored separately as
 * public.profiles.auth_user_id and is never treated as a route or trust signal.
 * The authoritative role is always read from public.profiles by PostgreSQL RLS
 * and by the profile query; nothing here is accepted from user input.
 */
export type AuthRole = 'admin' | 'member'

export interface AuthUser {
  /** public.profiles.id */
  id: string
  email: string
  fullName: string
  role: AuthRole
  phone?: string
  avatarUrl?: string
}

/**
 * Authentication lifecycle.
 *
 * loading        restoring the Neon Auth session and/or the application profile
 * unauthenticated no Neon Auth session
 * needs-profile  valid session, but no public.profiles row yet
 * authenticated  valid session + active application profile
 * inactive       valid session, but the profile is deactivated
 * unconfigured   browser-safe Neon URLs are missing or invalid
 * error          session or profile request failed for another reason
 */
export type AuthPhase =
  | 'loading'
  | 'unauthenticated'
  | 'needs-profile'
  | 'authenticated'
  | 'inactive'
  | 'unconfigured'
  | 'error'

export interface AuthState {
  phase: AuthPhase
  /** Application profile. Null until an active profile has been loaded. */
  user: AuthUser | null
  /** Email from the Neon Auth session, available before a profile exists. */
  sessionEmail: string | null
  /** Name from the Neon Auth session, used only to prefill onboarding. */
  sessionName: string | null
  /** Human-readable, non-secret error for the current phase. */
  error: string | null
  /** Configuration problems; never contains endpoint values or secrets. */
  configIssues: string[]
}

export interface SignInInput {
  email: string
  password: string
  rememberMe?: boolean
}

export interface SignInResult {
  error: string | null
  phase: AuthPhase
  role: AuthRole | null
}

export interface CompleteProfileInput {
  fullName: string
  phone?: string
}

export interface CompleteProfileResult {
  error: string | null
  role: AuthRole | null
}
