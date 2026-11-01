/** Shapes reserved for the real Supabase-backed auth layer in Sprint 3. */
export type AuthRole = 'admin' | 'member'

export interface AuthUser {
  id: string
  email: string
  fullName: string
  role: AuthRole
  avatarUrl?: string
}

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated'
