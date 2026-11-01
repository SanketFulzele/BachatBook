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
import type { PlaceholderPageProps } from '@/components/common/placeholder-page'

type PlaceholderContent = Omit<PlaceholderPageProps, 'dashboardHref'>

export const adminPlaceholders = {
  groups: {
    title: 'Groups',
    description: 'Create and organise savings groups, contribution amounts and member invites.',
    sprint: 4,
    icon: UsersRound,
    capabilities: [
      'Create and edit Bhishi groups',
      'Set monthly contribution amounts',
      'Invite and approve members',
      'Archive completed groups',
    ],
  },
  members: {
    title: 'Members',
    description: 'Manage member profiles, contact details and membership across groups.',
    sprint: 4,
    icon: UserRound,
    capabilities: [
      'Member directory and profiles',
      'Assign members to groups',
      'Track contact information',
      'Manage member status',
    ],
  },
  cycles: {
    title: 'Cycles',
    description: 'Define rotation cycles, chit order and the rules that drive each payout.',
    sprint: 5,
    icon: RefreshCw,
    capabilities: [
      'Create savings cycles',
      'Configure chit and payout order',
      'Review cycle progress',
      'Close completed cycles',
    ],
  },
  collections: {
    title: 'Collections',
    description: 'Track monthly contributions, due dates and collection status in one ledger.',
    sprint: 7,
    icon: HandCoins,
    capabilities: [
      'View generated installments',
      'Record member contributions',
      'Track due and overdue amounts',
      'Review collection history',
    ],
  },
  payouts: {
    title: 'Payouts',
    description: 'Record payout disbursements and keep a clear, auditable payout ledger.',
    sprint: 8,
    icon: Wallet,
    capabilities: [
      'Record cycle payouts',
      'Confirm recipient details',
      'Link payouts to collections',
      'Review payout history',
    ],
  },
  reports: {
    title: 'Reports',
    description: 'Export financial summaries and group-level reports for your records.',
    sprint: 10,
    icon: BarChart3,
    capabilities: [
      'Group financial summaries',
      'Collection and payout reports',
      'Member contribution history',
      'Downloadable statements',
    ],
  },
  auditLogs: {
    title: 'Audit Logs',
    description: 'Review a chronological trail of important actions and financial changes.',
    sprint: 10,
    icon: ScrollText,
    capabilities: [
      'Timestamped activity trail',
      'Financial change history',
      'User action tracking',
      'Filter by group or date',
    ],
  },
  settings: {
    title: 'Settings',
    description: 'Configure workspace preferences, defaults and notification behaviour.',
    sprint: 10,
    icon: Settings,
    capabilities: [
      'Workspace preferences',
      'Contribution defaults',
      'Notification settings',
      'Account and security options',
    ],
  },
} satisfies Record<string, PlaceholderContent>

export const memberPlaceholders = {
  dashboard: {
    title: 'Member dashboard',
    description: 'A focused personal view of your savings, contributions and next payout.',
    sprint: 9,
    icon: LayoutDashboard,
    capabilities: [
      'Personal savings overview',
      'Next contribution reminder',
      'Group progress at a glance',
      'Upcoming payout details',
    ],
  },
  groups: {
    title: 'My Groups',
    description: 'See the Bhishi groups you belong to and your role in each one.',
    sprint: 4,
    icon: UsersRound,
    capabilities: [
      'View your group memberships',
      'Read group rules and contribution amounts',
      'See fellow members',
      'Review your chit position',
    ],
  },
  payments: {
    title: 'My Payments',
    description: 'A personal ledger of contribution payments and their current status.',
    sprint: 7,
    icon: CreditCard,
    capabilities: [
      'Upcoming and past payments',
      'Contribution status',
      'Payment method records',
      'Receipt references',
    ],
  },
  schedule: {
    title: 'Monthly Schedule',
    description: 'Know exactly when your next contribution is due and what it covers.',
    sprint: 6,
    icon: CalendarDays,
    capabilities: [
      'Monthly installment calendar',
      'Due-date reminders',
      'Contribution breakdown',
      'Payment history by month',
    ],
  },
  payouts: {
    title: 'Payout History',
    description: 'Review payouts you have received and your position in the cycle.',
    sprint: 8,
    icon: Wallet,
    capabilities: [
      'Personal payout timeline',
      'Payout amounts and dates',
      'Cycle position history',
      'Status of upcoming payouts',
    ],
  },
  profile: {
    title: 'My Profile',
    description: 'Keep your personal details and account preferences up to date.',
    sprint: 3,
    icon: UserRound,
    capabilities: [
      'Personal information',
      'Contact details',
      'Notification preferences',
      'Password and security',
    ],
  },
} satisfies Record<string, PlaceholderContent>
