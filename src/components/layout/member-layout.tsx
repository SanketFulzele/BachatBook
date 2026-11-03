import { AppShell } from '@/components/layout/app-shell'
import { memberNavigation } from '@/components/layout/nav-config'
import { ROUTES } from '@/lib/constants'

export function MemberLayout() {
  return (
    <AppShell homeHref={ROUTES.member.dashboard} roleLabel="Member" navigation={memberNavigation} />
  )
}
