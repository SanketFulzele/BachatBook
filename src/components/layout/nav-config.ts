import {
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  Shield,
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
  { label: 'Dashboard', href: ROUTES.admin.dashboard, icon: LayoutDashboard },
  { label: 'Groups', href: ROUTES.admin.groups, icon: UsersRound },
  { label: 'Members', href: ROUTES.admin.members, icon: UsersRound },
  { label: 'User Management', href: ROUTES.admin.userManagement, icon: Shield },
]

export const adminMoreNavigation: NavigationItem[] = [
  { label: 'Payments', href: ROUTES.admin.payments, icon: CreditCard },
  { label: 'Installments', href: ROUTES.admin.installments, icon: CalendarDays },
  { label: 'Payouts', href: ROUTES.admin.payouts, icon: Wallet },
  { label: 'Profile', href: ROUTES.admin.profile, icon: UserRound },
]

export const memberNavigation: NavigationItem[] = [
  { label: 'Dashboard', href: ROUTES.member.dashboard, icon: LayoutDashboard },
  { label: 'My Groups', href: ROUTES.member.groups, icon: UsersRound },
  { label: 'My Installments', href: ROUTES.member.installments, icon: CalendarDays },
  { label: 'My Payments', href: ROUTES.member.payments, icon: CreditCard },
  { label: 'Profile', href: ROUTES.member.profile, icon: UserRound },
]
