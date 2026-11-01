import {
  BarChart3,
  CalendarDays,
  CreditCard,
  HandCoins,
  LayoutDashboard,
  RefreshCw,
  ScrollText,
  Settings,
  UserRound,
  UsersRound,
  Wallet,
} from 'lucide-react'
import type { NavigationItem } from '@/types'

/** Admin navigation destinations. Sprint 1 renders Dashboard; the rest are placeholders. */
export const adminNavigation: NavigationItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Groups', href: '/admin/groups', icon: UsersRound, availableInSprint: 4 },
  { label: 'Members', href: '/admin/members', icon: UserRound, availableInSprint: 4 },
  { label: 'Cycles', href: '/admin/cycles', icon: RefreshCw, availableInSprint: 5 },
  { label: 'Collections', href: '/admin/collections', icon: HandCoins, availableInSprint: 7 },
  { label: 'Payouts', href: '/admin/payouts', icon: Wallet, availableInSprint: 8 },
  { label: 'Reports', href: '/admin/reports', icon: BarChart3, availableInSprint: 10 },
  { label: 'Audit Logs', href: '/admin/audit-logs', icon: ScrollText, availableInSprint: 10 },
  { label: 'Settings', href: '/admin/settings', icon: Settings, availableInSprint: 2 },
]

/** Lightweight member navigation. Every destination is a placeholder in Sprint 1. */
export const memberNavigation: NavigationItem[] = [
  { label: 'Dashboard', href: '/member/dashboard', icon: LayoutDashboard, availableInSprint: 9 },
  { label: 'My Groups', href: '/member/groups', icon: UsersRound, availableInSprint: 4 },
  { label: 'My Payments', href: '/member/payments', icon: CreditCard, availableInSprint: 7 },
  {
    label: 'Monthly Schedule',
    href: '/member/schedule',
    icon: CalendarDays,
    availableInSprint: 6,
  },
  { label: 'Payout History', href: '/member/payouts', icon: Wallet, availableInSprint: 8 },
  { label: 'My Profile', href: '/member/profile', icon: UserRound, availableInSprint: 3 },
]
