import type { Database } from '@/types/database.types'

export type GroupRow = Database['public']['Tables']['bhishi_groups']['Row']
export type MemberRow = Database['public']['Tables']['members']['Row']
export type GroupMemberRow = Database['public']['Tables']['group_members']['Row']
export type CycleRow = Database['public']['Tables']['cycles']['Row']
export type CycleMemberRow = Database['public']['Tables']['cycle_members']['Row']
export type InstallmentRow = Database['public']['Tables']['installments']['Row']
export type ObligationRow = Database['public']['Tables']['contribution_obligations']['Row']
export type PaymentRow = Database['public']['Tables']['payments']['Row']
export type PayoutRow = Database['public']['Tables']['payouts']['Row']
export type ProfileRow = Database['public']['Tables']['profiles']['Row']

export type PaymentMethod = Database['public']['Enums']['payment_method']
export type ContributionPaymentMethod = Exclude<PaymentMethod, 'other'>
export type PaymentStatus = 'paid' | 'pending'

export interface ObligationView {
  obligation: ObligationRow
  member: MemberRow
  installmentId: string
  paidAmount: number
  remaining: number
  status: PaymentStatus
  payments: PaymentRow[]
}

export interface InstallmentView {
  installment: InstallmentRow
  cycleId: string
  recipient: MemberRow | null
  obligations: ObligationView[]
  expectedTotal: number
  collectedAmount: number
  paidCount: number
  pendingCount: number
  status: PaymentStatus
  payout: PayoutRow | null
  isPast: boolean
}

export interface CycleMemberView {
  cycleMember: CycleMemberRow
  member: MemberRow
}

export interface CycleView {
  cycle: CycleRow
  members: CycleMemberView[]
  installments: InstallmentView[]
  /** Earliest installment that still has an outstanding contribution. */
  currentInstallment: InstallmentView | null
  /** Next installment by scheduled date (falls back to the last one). */
  nextInstallment: InstallmentView | null
}

export interface GroupMemberView {
  membership: GroupMemberRow
  member: MemberRow
}

export interface GroupView {
  group: GroupRow
  members: GroupMemberView[]
  cycles: CycleView[]
  activeCycle: CycleView | null
  draftCycle: CycleView | null
  /** Latest cycle that is no longer a draft (active, completed or cancelled). */
  latestCycle: CycleView | null
}

export interface PaymentOption {
  obligation: ObligationView
  installment: InstallmentView
  groupName: string
}

export interface PayoutOption {
  installment: InstallmentView
  groupName: string
  amount: number
}

export interface BhishiSnapshot {
  profileId: string
  groups: GroupView[]
  members: MemberRow[]
  profiles: ProfileRow[]
  cycles: CycleView[]
  installments: InstallmentView[]
  obligations: ObligationView[]
  payments: PaymentRow[]
  payouts: PayoutRow[]
}

export interface RawSnapshot {
  groups: GroupRow[]
  members: MemberRow[]
  groupMembers: GroupMemberRow[]
  profiles: ProfileRow[]
  cycles: CycleRow[]
  cycleMembers: CycleMemberRow[]
  installments: InstallmentRow[]
  obligations: ObligationRow[]
  payments: PaymentRow[]
  payouts: PayoutRow[]
}
