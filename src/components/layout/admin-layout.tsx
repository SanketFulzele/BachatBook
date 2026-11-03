import { AppShell } from '@/components/layout/app-shell'
import { adminMoreNavigation, adminNavigation } from '@/components/layout/nav-config'
import { ROUTES } from '@/lib/constants'

export function AdminLayout() {
  return (
    <AppShell
      homeHref={ROUTES.admin.dashboard}
      roleLabel="Admin"
      navigation={adminNavigation}
      moreNavigation={adminMoreNavigation}
    />
  )
}
