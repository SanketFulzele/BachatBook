import { ROUTES } from '@/lib/constants'
import type { AuthRole } from '../types/auth.types'

/** Dashboard route for an application profile role. */
export function dashboardPathForRole(role: AuthRole): string {
  return role === 'admin' ? ROUTES.admin.dashboard : ROUTES.member.dashboard
}
