import type { CycleRow, ObligationRow, PaymentRow, PayoutRow } from '@/features/bhishi/types'

export type LedgerTransactionType =
  'obligation' | 'payment' | 'payment-voided' | 'payout' | 'payout-voided'

export type LedgerTransactionStatus = 'pending' | 'paid' | 'voided' | 'received' | 'info'

export interface LedgerTransaction {
  id: string
  dateIso: string
  type: LedgerTransactionType
  groupName: string
  cycleName: string
  description: string
  amount: number
  status: LedgerTransactionStatus
}

export interface LedgerGroupBreakdown {
  groupId: string
  groupName: string
  expected: number
  paid: number
  pending: number
  payoutReceived: number
}

export interface LedgerCycleInfo {
  cycleId: string
  cycleName: string
  groupName: string
  startDate: string
  status: CycleRow['status']
  expected: number
  paid: number
  payoutReceived: number
}

export interface MemberLedger {
  memberId: string
  memberName: string
  expected: number
  paid: number
  pending: number
  payoutReceived: number
  groups: LedgerGroupBreakdown[]
  cycles: LedgerCycleInfo[]
  transactions: LedgerTransaction[]
}

export type { ObligationRow, PaymentRow, PayoutRow }
