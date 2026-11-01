import { Outlet } from 'react-router-dom'

/**
 * Placeholder guard.
 *
 * Role-based protection is intentionally NOT implemented in Sprint 1.
 * Sprint 3 will replace this pass-through with session + role checks.
 */
export function ProtectedRoutePlaceholder() {
  return <Outlet />
}
