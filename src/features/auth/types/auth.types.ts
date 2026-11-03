/**
 * Shapes reserved for the real Neon Auth + Data API layer in Sprint 3.
 *
 * `id` is the application profile id (public.profiles.id), not the Neon Auth
 * user id. The Neon Auth identity is stored separately as
 * public.profiles.auth_user_id and is never exposed as a route or trust signal.
 */
export type AuthRole = 'admin' | 'member'

export interface AuthUser {
  id: string
  email: string
  fullName: string
  role: AuthRole
  avatarUrl?: string
}

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated'
