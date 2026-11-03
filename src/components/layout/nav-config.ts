import { CreditCard, HandCoins, LayoutDashboard, UsersRound, Wallet } from 'lucide-react'
import type { NavigationItem } from '@/types'
import { ROUTES } from '@/lib/constants'

/**
 * Small, task-first navigation. Everything else lives inside a group:
 * members, chit order and installments are part of the group screen.
 */
export const adminNavigation: NavigationItem[] = [
  { label: 'Home', href: ROUTES.admin.dashboard, icon: LayoutDashboard },
  { label: 'Groups', href: ROUTES.admin.groups, icon: UsersRound },
  { label: 'Payments', href: ROUTES.admin.payments, icon: HandCoins },
  { label: 'Payouts', href: ROUTES.admin.payouts, icon: Wallet },
]

export const memberNavigation: NavigationItem[] = [
  { label: 'Home', href: ROUTES.member.dashboard, icon: LayoutDashboard },
  { label: 'My Group', href: ROUTES.member.groups, icon: UsersRound },
  { label: 'Payments', href: ROUTES.member.payments, icon: CreditCard },
]
