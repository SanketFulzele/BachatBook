import {
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  UserRound,
  UsersRound,
  Wallet,
} from 'lucide-react'
import type { NavigationItem } from '@/types'
import { ROUTES } from '@/lib/constants'

/**
 * Primary destinations stay limited; secondary admin routes are available
 * from the More menu.
 */
export const adminNavigation: NavigationItem[] = [
  { label: 'Home', href: ROUTES.admin.dashboard, icon: LayoutDashboard },
  { label: 'Groups', href: ROUTES.admin.groups, icon: UsersRound },
  { label: 'Payments', href: ROUTES.admin.payments, icon: CreditCard },
]

export const adminMoreNavigation: NavigationItem[] = [
  { label: 'Installments', href: ROUTES.admin.installments, icon: CalendarDays },
  { label: 'Payouts', href: ROUTES.admin.payouts, icon: Wallet },
  { label: 'Profile', href: ROUTES.admin.profile, icon: UserRound },
]

export const memberNavigation: NavigationItem[] = [
  { label: 'Home', href: ROUTES.member.dashboard, icon: LayoutDashboard },
  { label: 'My Groups', href: ROUTES.member.groups, icon: UsersRound },
  { label: 'Profile', href: ROUTES.member.profile, icon: UserRound },
]
