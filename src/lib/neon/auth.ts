import { getNeonClient } from './client'

/**
 * Managed Better Auth entry point.
 *
 * The auth API comes from the shared Neon client created in ./client, so the
 * Data API automatically uses the JWT issued here. No login, sign-up or reset
 * flow is implemented in this migration task; Sprint 3 owns those screens.
 *
 * Typical Sprint 3 calls:
 *   getNeonAuth().signIn.email({ email, password })
 *   getNeonAuth().signUp.email({ email, password, name })
 *   getNeonAuth().getSession()
 *   getNeonAuth().signOut()
 *   getNeonAuth().requestPasswordReset({ email, redirectTo })
 */
export function getNeonAuth() {
  return getNeonClient().auth
}

export type BachatBookNeonAuth = ReturnType<typeof getNeonAuth>
