import { createContext, useContext } from 'react'
import type {
  AuthState,
  CompleteProfileInput,
  CompleteProfileResult,
  SignInInput,
  SignInResult,
  SignUpInput,
  SignUpResult,
} from '../types/auth.types'

export interface AuthContextValue extends AuthState {
  signIn: (input: SignInInput) => Promise<SignInResult>
  signUp: (input: SignUpInput) => Promise<SignUpResult>
  signOut: () => Promise<string | null>
  /** Calls ensure_own_profile() for the signed-in member. Never grants admin. */
  completeProfile: (input: CompleteProfileInput) => Promise<CompleteProfileResult>
  /**
   * Re-reads the session and profile. Used by error screens for retry; it
   * refreshes the Neon Auth session first when no profile is known yet.
   */
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
