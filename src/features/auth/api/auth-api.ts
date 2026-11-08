import { getNeonAuth, getNeonDataApi } from '@/lib/neon'
import type { AuthRole } from '../types/auth.types'

/**
 * Thin, typed wrappers around Managed Better Auth and the Neon Data API.
 *
 * Nothing in this module decides authorization. It only forwards requests; the
 * Data API attaches the current Neon Auth JWT and PostgreSQL RLS decides which
 * rows and columns are visible. The application profile role is read back from
 * public.profiles and is never written from the browser.
 */

export interface ProfileSummary {
  id: string
  auth_user_id: string
  full_name: string
  email: string | null
  phone: string | null
  role: AuthRole
  is_active: boolean
}

export interface RequestError {
  /** Safe, human-readable message. */
  message: string
  /** True when the Data API rejected the JWT as missing/expired. */
  expired: boolean
}

export interface RequestResult<T> {
  data: T | null
  error: RequestError | null
}

export interface ManagedProfile {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  role: AuthRole
  is_active: boolean
}

function readErrorField(error: unknown, key: string): unknown {
  if (typeof error !== 'object' || error === null) return undefined
  return (error as Record<string, unknown>)[key]
}

function readMessage(error: unknown): string {
  const value = readErrorField(error, 'message')
  return typeof value === 'string' ? value.trim() : ''
}

function readStatus(error: unknown): number | undefined {
  const value = readErrorField(error, 'status')
  return typeof value === 'number' ? value : undefined
}

function readCode(error: unknown): string {
  const value = readErrorField(error, 'code')
  return typeof value === 'string' ? value : ''
}

/**
 * Maps a Managed Better Auth error to a safe message. Better Auth deliberately
 * returns the same answer for unknown accounts and wrong passwords, so the
 * message can be shown without disclosing account existence.
 */
export function describeAuthError(error: unknown): string {
  const status = readStatus(error)
  const message = readMessage(error)

  if (status === 429) {
    return 'Too many attempts. Please wait a moment and try again.'
  }

  if (status !== undefined && status >= 500) {
    return 'The authentication service is unavailable right now. Please try again shortly.'
  }

  if (message) return message

  return 'We could not complete that request. Please try again.'
}

/** Registers an account through Managed Better Auth. Signup cannot choose a role. */
export async function registerWithEmail(input: {
  fullName: string
  email: string
  password: string
}): Promise<{ error: string | null }> {
  try {
    const { error } = await getNeonAuth().signUp.email({
      name: input.fullName.trim(),
      email: input.email.trim(),
      password: input.password,
    })

    if (!error) return { error: null }

    const message = readMessage(error)
    if (/already exists|already registered|duplicate|unique/i.test(message)) {
      return {
        error:
          'An account may already exist for this email. Try signing in or resetting your password.',
      }
    }

    return { error: describeAuthError(error) }
  } catch (error) {
    return { error: describeAuthError(error) }
  }
}

/** Whether a Data API error means the session/JWT is no longer valid. */
export function isExpiredSessionError(error: RequestError): boolean {
  return error.expired
}

function normalizeDataApiError(error: unknown): RequestError {
  const code = readCode(error)
  const message = readMessage(error)
  const expired =
    code === 'PGRST301' ||
    code === 'PGRST302' ||
    /jwt|token/i.test(code) ||
    /jwt|session.*expired|token.*expired/i.test(message)

  if (expired) {
    return {
      message: 'Your session has expired. Please sign in again.',
      expired: true,
    }
  }

  if (code === '42501') {
    return {
      message: 'You do not have permission to perform that action.',
      expired: false,
    }
  }

  return {
    message: message || 'The request to the database failed. Please try again.',
    expired: false,
  }
}

/**
 * Reads the signed-in user's own profile.
 *
 * The explicit auth_user_id filter keeps the query to exactly one row even for
 * administrators, whose RLS policy can see every profile. RLS still enforces
 * that a non-admin can only see their own row.
 */
export async function fetchOwnProfile(authUserId: string): Promise<RequestResult<ProfileSummary>> {
  try {
    const { data, error } = await getNeonDataApi()
      .from('profiles')
      .select('id, auth_user_id, full_name, email, phone, role, is_active')
      .eq('auth_user_id', authUserId)
      .maybeSingle()

    if (error) {
      return { data: null, error: normalizeDataApiError(error) }
    }

    return { data: data ?? null, error: null }
  } catch (error) {
    return {
      data: null,
      error: { message: describeAuthError(error), expired: false },
    }
  }
}

/**
 * Calls the SECURITY DEFINER onboarding function added in migration 00008.
 *
 * The function derives the Neon Auth user id from the JWT and hard-codes
 * role = 'member'. The browser cannot pass a role, and calling this twice
 * returns the existing profile id instead of creating a duplicate.
 */
export async function createOwnProfile(input: {
  fullName: string
  phone?: string
  email?: string
}): Promise<RequestResult<string>> {
  try {
    const { data, error } = await getNeonDataApi().rpc('ensure_own_profile', {
      profile_full_name: input.fullName,
      profile_phone: input.phone,
      profile_email: input.email,
    })

    if (error) {
      return { data: null, error: normalizeDataApiError(error) }
    }

    return { data: data ?? null, error: null }
  } catch (error) {
    return {
      data: null,
      error: { message: describeAuthError(error), expired: false },
    }
  }
}

/** Lists account profiles; PostgreSQL RLS limits this query to administrators. */
export async function fetchManagedProfiles(): Promise<ManagedProfile[]> {
  const { data, error } = await getNeonDataApi()
    .from('profiles')
    .select('id, full_name, email, phone, role, is_active')
    .order('full_name', { ascending: true })

  if (error) throw new Error(normalizeDataApiError(error).message)
  return data ?? []
}

export async function updateManagedProfile(input: {
  profileId: string
  role?: AuthRole
  isActive?: boolean
}): Promise<void> {
  const { error } = await getNeonDataApi().rpc('update_user_access', {
    target_profile_id: input.profileId,
    requested_role: input.role ?? undefined,
    requested_is_active: input.isActive ?? undefined,
  })

  if (error) throw new Error(normalizeDataApiError(error).message)
}

/** Attempts the database-bound, one-time initial-admin claim for this session. */
export async function claimInitialAdmin(): Promise<{
  profileId: string | null
  error: string | null
}> {
  try {
    const { data, error } = await getNeonDataApi().rpc('claim_initial_admin')
    if (error) return { profileId: null, error: normalizeDataApiError(error).message }
    return { profileId: data ?? null, error: null }
  } catch (error) {
    return { profileId: null, error: describeAuthError(error) }
  }
}

/** Sends a Managed Better Auth password-reset email. */
export async function requestPasswordResetEmail(
  email: string,
  redirectTo: string,
): Promise<{ error: string | null }> {
  try {
    const { error } = await getNeonAuth().requestPasswordReset({ email, redirectTo })

    if (error) {
      return { error: describeAuthError(error) }
    }

    return { error: null }
  } catch (error) {
    return { error: describeAuthError(error) }
  }
}

/** Completes a Managed Better Auth password reset with the emailed token. */
export async function resetPasswordWithToken(
  newPassword: string,
  token: string,
): Promise<{ error: string | null }> {
  try {
    const { error } = await getNeonAuth().resetPassword({ newPassword, token })

    if (error) {
      return { error: describeAuthError(error) }
    }

    return { error: null }
  } catch (error) {
    return { error: describeAuthError(error) }
  }
}
