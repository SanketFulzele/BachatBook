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
 * Bottom tabs stay limited to four frequently used sections. Everything
 * else lives in the left drawer (mobile) or the desktop header navigation.
 */
export const adminNavigation: NavigationItem[] = [
  { label: 'Dashboard', href: ROUTES.admin.dashboard, icon: LayoutDashboard },
  { label: 'Groups', href: ROUTES.admin.groups, icon: UsersRound },
  { label: 'Members', href: ROUTES.admin.members, icon: UsersRound },
  { label: 'Payments', href: ROUTES.admin.payments, icon: CreditCard },
]

export const adminDrawerNavigation: NavigationItem[] = [
  { label: 'Installments', href: ROUTES.admin.installments, icon: CalendarDays },
  { label: 'Payouts', href: ROUTES.admin.payouts, icon: Wallet },
  { label: 'User Management', href: ROUTES.admin.userManagement, icon: Shield },
  { label: 'Profile', href: ROUTES.admin.profile, icon: UserRound },
]

export const memberNavigation: NavigationItem[] = [
  { label: 'Dashboard', href: ROUTES.member.dashboard, icon: LayoutDashboard },
  { label: 'Groups', href: ROUTES.member.groups, icon: UsersRound },
  { label: 'Installments', href: ROUTES.member.installments, icon: CalendarDays },
  { label: 'Payments', href: ROUTES.member.payments, icon: CreditCard },
]

export const memberDrawerNavigation: NavigationItem[] = [
  { label: 'Profile', href: ROUTES.member.profile, icon: UserRound },
]
