import {
  BookOpenCheck,
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
 * Bottom tabs (mobile only) stay limited to four frequently used sections.
 * The desktop application layout uses a full left sidebar built from the same
 * items combined with the drawer-only destinations.
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
  { label: 'Ledger', href: ROUTES.member.ledger, icon: BookOpenCheck },
]

export const memberDrawerNavigation: NavigationItem[] = [
  { label: 'Payments', href: ROUTES.member.payments, icon: CreditCard },
  { label: 'My profile', href: ROUTES.member.profile, icon: UserRound },
]
