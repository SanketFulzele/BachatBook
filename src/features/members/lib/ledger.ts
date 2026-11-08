import type { RawSnapshot } from '@/features/bhishi/types'
import type {
  LedgerCycleInfo,
  LedgerGroupBreakdown,
  LedgerTransaction,
  MemberLedger,
} from '../types'

function toCents(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 0
  return Math.round(parsed * 100)
}

function toAmount(cents: number): number {
  return Math.round(cents) / 100
}

const iso = (value: string | null | undefined): string =>
  value ? value.replace(' ', 'T') : new Date().toISOString()

export function computeMemberLedger(raw: RawSnapshot, memberId: string): MemberLedger {
  const member = raw.members.find((item) => item.id === memberId)
  const memberName = member?.full_name ?? 'Unknown member'

  const groupById = new Map(raw.groups.map((item) => [item.id, item]))
  const cycleById = new Map(raw.cycles.map((item) => [item.id, item]))
  const installmentById = new Map(raw.installments.map((item) => [item.id, item]))

  // Resolve obligation rows relevant to this member.
  const obligations = raw.obligations.filter((row) => row.member_id === memberId)

  // Payments tied to those obligations, non-voided for totals.
  const paymentKey = (row: { installment_id: string; member_id: string }) =>
    `${row.installment_id}:${row.member_id}`
  const obligationKeys = new Set(obligations.map(paymentKey))
  const payable = raw.payments.filter(
    (row) => obligationKeys.has(paymentKey(row)) && row.member_id === memberId,
  )
  const validPayments = payable.filter((row) => !row.is_voided)
  const paidCents = validPayments.reduce((sum, row) => sum + toCents(row.amount), 0)

  // Expected contribution is sum of obligation expected amounts.
  const expectedCents = obligations.reduce((sum, row) => sum + toCents(row.expected_amount), 0)
  const pendingCents = Math.max(0, expectedCents - paidCents)

  // Payouts where this member is the recipient.
  const memberPayouts = raw.payouts.filter(
    (row) => row.recipient_member_id === memberId && !row.is_voided,
  )
  const payoutReceivedCents = memberPayouts.reduce((sum, row) => sum + toCents(row.amount), 0)

  // Group-wise breakdown.
  const byGroup = new Map<string, LedgerGroupBreakdown>()
  for (const o of obligations) {
    const installment = installmentById.get(o.installment_id)
    const cycle = installment ? cycleById.get(installment.cycle_id) : undefined
    const group = cycle ? groupById.get(cycle.group_id) : undefined
    if (!group) continue
    const entry =
      byGroup.get(group.id) ??
      ({
        groupId: group.id,
        groupName: group.name,
        expected: 0,
        paid: 0,
        pending: 0,
        payoutReceived: 0,
      } as LedgerGroupBreakdown)
    entry.expected += toCents(o.expected_amount)
    byGroup.set(group.id, entry)
  }
  for (const p of validPayments) {
    const installment = installmentById.get(p.installment_id)
    const cycle = installment ? cycleById.get(installment.cycle_id) : undefined
    const group = cycle ? groupById.get(cycle.group_id) : undefined
    if (!group) continue
    const entry = byGroup.get(group.id)
    if (!entry) continue
    entry.paid += toCents(p.amount)
  }
  for (const p of memberPayouts) {
    const installment = installmentById.get(p.installment_id)
    const cycle = installment ? cycleById.get(installment.cycle_id) : undefined
    const group = cycle ? groupById.get(cycle.group_id) : undefined
    if (!group) continue
    const entry =
      byGroup.get(group.id) ??
      ({
        groupId: group.id,
        groupName: group.name,
        expected: 0,
        paid: 0,
        pending: 0,
        payoutReceived: 0,
      } as LedgerGroupBreakdown)
    entry.payoutReceived += toCents(p.amount)
    byGroup.set(group.id, entry)
  }
  const groups = Array.from(byGroup.values()).map((entry) => ({
    ...entry,
    expected: toAmount(entry.expected),
    paid: toAmount(entry.paid),
    pending: Math.max(0, toAmount(entry.expected - entry.paid)),
    payoutReceived: toAmount(entry.payoutReceived),
  }))

  // Cycle-wise details.
  const byCycle = new Map<string, LedgerCycleInfo>()
  for (const o of obligations) {
    const installment = installmentById.get(o.installment_id)
    if (!installment) continue
    const cycle = cycleById.get(installment.cycle_id)
    if (!cycle) continue
    const group = groupById.get(cycle.group_id)
    const entry =
      byCycle.get(cycle.id) ??
      ({
        cycleId: cycle.id,
        cycleName: cycle.name,
        groupName: group?.name ?? 'Group',
        startDate: cycle.start_date,
        status: cycle.status,
        expected: 0,
        paid: 0,
        payoutReceived: 0,
      } as LedgerCycleInfo)
    entry.expected += toCents(o.expected_amount)
    byCycle.set(cycle.id, entry)
  }
  for (const p of validPayments) {
    const installment = installmentById.get(p.installment_id)
    if (!installment) continue
    const cycle = cycleById.get(installment.cycle_id)
    if (!cycle) continue
    const entry = byCycle.get(cycle.id)
    if (!entry) continue
    entry.paid += toCents(p.amount)
  }
  for (const p of memberPayouts) {
    const installment = installmentById.get(p.installment_id)
    if (!installment) continue
    const cycle = cycleById.get(installment.cycle_id)
    if (!cycle) continue
    const entry =
      byCycle.get(cycle.id) ??
      ({
        cycleId: cycle.id,
        cycleName: cycle.name,
        groupName: 'Group',
        startDate: cycle.start_date,
        status: cycle.status,
        expected: 0,
        paid: 0,
        payoutReceived: 0,
      } as LedgerCycleInfo)
    entry.payoutReceived += toCents(p.amount)
    byCycle.set(cycle.id, entry)
  }
  const cycles = Array.from(byCycle.values())
    .map((entry) => ({
      ...entry,
      expected: toAmount(entry.expected),
      paid: toAmount(entry.paid),
      payoutReceived: toAmount(entry.payoutReceived),
    }))
    .sort((a, b) => b.startDate.localeCompare(a.startDate))

  // Transaction history.
  const transactions: LedgerTransaction[] = []
  for (const o of obligations) {
    const installment = installmentById.get(o.installment_id)
    const cycle = installment ? cycleById.get(installment.cycle_id) : undefined
    const group = cycle ? groupById.get(cycle.group_id) : undefined
    transactions.push({
      id: `obligation-${o.id}`,
      dateIso: iso(o.created_at),
      type: 'obligation',
      groupName: group?.name ?? 'Group',
      cycleName: cycle?.name ?? 'Cycle',
      description: `Contribution obligation for installment #${installment?.installment_number ?? '?'}`,
      amount: toAmount(toCents(o.expected_amount)),
      status: 'pending',
    })
  }
  for (const p of raw.payments) {
    const installment = installmentById.get(p.installment_id)
    const cycle = installment ? cycleById.get(installment.cycle_id) : undefined
    const group = cycle ? groupById.get(cycle.group_id) : undefined
    transactions.push({
      id: `payment-${p.id}`,
      dateIso: iso(p.payment_date),
      type: p.is_voided ? 'payment-voided' : 'payment',
      groupName: group?.name ?? 'Group',
      cycleName: cycle?.name ?? 'Cycle',
      description:
        p.is_voided && p.correction_reason
          ? `Payment voided — ${p.correction_reason}`
          : `Payment received${p.payment_method === 'cash' ? ' (cash)' : p.payment_method === 'upi' ? ' (UPI)' : p.payment_method === 'bank_transfer' ? ' (bank transfer)' : ''}`,
      amount: toAmount(toCents(p.amount)),
      status: p.is_voided ? 'voided' : 'paid',
    })
  }
  for (const p of raw.payouts) {
    if (p.recipient_member_id !== memberId) continue
    const installment = installmentById.get(p.installment_id)
    const cycle = installment ? cycleById.get(installment.cycle_id) : undefined
    const group = cycle ? groupById.get(cycle.group_id) : undefined
    transactions.push({
      id: `payout-${p.id}`,
      dateIso: iso(p.payout_date),
      type: p.is_voided ? 'payout-voided' : 'payout',
      groupName: group?.name ?? 'Group',
      cycleName: cycle?.name ?? 'Cycle',
      description:
        p.is_voided && p.correction_reason
          ? `Payout voided — ${p.correction_reason}`
          : 'Payout received',
      amount: toAmount(toCents(p.amount)),
      status: p.is_voided ? 'voided' : 'received',
    })
  }
  transactions.sort((a, b) => b.dateIso.localeCompare(a.dateIso))

  return {
    memberId,
    memberName,
    expected: toAmount(expectedCents),
    paid: toAmount(paidCents),
    pending: toAmount(pendingCents),
    payoutReceived: toAmount(payoutReceivedCents),
    groups,
    cycles,
    transactions,
  }
}

export function filterLedgerTransactions(
  transactions: LedgerTransaction[],
  filter: 'all' | 'payments' | 'payouts' | 'obligations' | string,
  groupId?: string,
  cycleId?: string,
): LedgerTransaction[] {
  let rows = transactions
  switch (filter) {
    case 'payments':
      rows = rows.filter((row) => row.type === 'payment' || row.type === 'payment-voided')
      break
    case 'payouts':
      rows = rows.filter((row) => row.type === 'payout' || row.type === 'payout-voided')
      break
    case 'obligations':
      rows = rows.filter((row) => row.type === 'obligation')
      break
  }
  if (groupId) rows = rows.filter((row) => row.groupName === groupId)
  if (cycleId) rows = rows.filter((row) => row.cycleName === cycleId)
  return rows
}
