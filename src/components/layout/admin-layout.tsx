import { AppShell } from '@/components/layout/app-shell'
import {
  adminDesktopNavigation,
  adminDrawerNavigation,
  adminNavigation,
} from '@/components/layout/nav-config'
import { ROUTES } from '@/lib/constants'

export function AdminLayout() {
  return (
    <AppShell
      homeHref={ROUTES.admin.dashboard}
      roleLabel="Admin"
      navigation={adminNavigation}
      desktopNavigation={adminDesktopNavigation}
      drawerNavigation={adminDrawerNavigation}
    />
  )
}
