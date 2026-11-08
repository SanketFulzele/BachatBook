import type {
  BhishiSnapshot,
  CycleView,
  GroupView,
  InstallmentView,
  MemberRow,
  ObligationRow,
  ObligationView,
  PaymentOption,
  PaymentRow,
  PaymentStatus,
  PayoutOption,
  RawSnapshot,
} from '../types'

function amount(value: number | string | null | undefined): number {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function cents(value: number): number {
  return Math.round(value * 100)
}

function todayInIndia(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function statusFor(paid: number, expected: number): PaymentStatus {
  if (expected > 0 && cents(paid) >= cents(expected)) return 'paid'
  return 'pending'
}

function virtualObligation(
  installmentId: string,
  memberId: string,
  expectedAmount: number,
): ObligationRow {
  const now = new Date().toISOString()
  return {
    id: `virtual-${installmentId}-${memberId}`,
    installment_id: installmentId,
    member_id: memberId,
    expected_amount: expectedAmount,
    created_at: now,
    updated_at: now,
  }
}

/**
 * Turns flat, RLS-filtered rows into the small view models the screens use.
 * Payment status is always derived from non-voided payment transactions.
 */
export function buildSnapshot(raw: RawSnapshot, profileId: string): BhishiSnapshot {
  const today = todayInIndia()
  const memberById = new Map(raw.members.map((member) => [member.id, member]))
  const cycleById = new Map(raw.cycles.map((cycle) => [cycle.id, cycle]))

  const activePayments = raw.payments.filter((payment) => !payment.is_voided)
  const paymentsByMemberInstallment = new Map<string, PaymentRow[]>()

  for (const payment of activePayments) {
    const key = `${payment.installment_id}:${payment.member_id}`
    const list = paymentsByMemberInstallment.get(key) ?? []
    list.push(payment)
    paymentsByMemberInstallment.set(key, list)
  }

  const validPayoutByInstallment = new Map<string, (typeof raw.payouts)[number]>()
  for (const payout of raw.payouts) {
    if (!payout.is_voided && !validPayoutByInstallment.has(payout.installment_id)) {
      validPayoutByInstallment.set(payout.installment_id, payout)
    }
  }

  const obligationsByInstallment = new Map<string, ObligationRow[]>()
  for (const obligation of raw.obligations) {
    const list = obligationsByInstallment.get(obligation.installment_id) ?? []
    list.push(obligation)
    obligationsByInstallment.set(obligation.installment_id, list)
  }

  const cycleMembersByCycle = new Map<string, typeof raw.cycleMembers>()
  for (const cycleMember of raw.cycleMembers) {
    const list = cycleMembersByCycle.get(cycleMember.cycle_id) ?? []
    list.push(cycleMember)
    cycleMembersByCycle.set(cycleMember.cycle_id, list)
  }

  const installmentsByCycle = new Map<string, InstallmentView[]>()

  for (const installment of raw.installments) {
    const cycle = cycleById.get(installment.cycle_id)
    if (!cycle) continue

    const cycleMembers = cycleMembersByCycle.get(cycle.id) ?? []
    const storedObligations = obligationsByInstallment.get(installment.id) ?? []
    const obligationRows =
      storedObligations.length > 0
        ? storedObligations
        : cycleMembers.map((cycleMember) =>
            virtualObligation(
              installment.id,
              cycleMember.member_id,
              amount(installment.expected_amount),
            ),
          )

    const obligationViews: ObligationView[] = []
    for (const obligation of obligationRows) {
      const member = memberById.get(obligation.member_id)
      if (!member) continue

      const payments =
        paymentsByMemberInstallment.get(`${installment.id}:${obligation.member_id}`) ?? []
      const paidAmount = payments.reduce((total, payment) => total + amount(payment.amount), 0)
      const expected = amount(obligation.expected_amount)

      obligationViews.push({
        obligation,
        member,
        installmentId: installment.id,
        paidAmount,
        remaining: Math.max(0, cents(expected) - cents(paidAmount)) / 100,
        status: statusFor(paidAmount, expected),
        payments,
      })
    }

    obligationViews.sort((a, b) => a.member.full_name.localeCompare(b.member.full_name))

    const expectedTotal = obligationViews.reduce(
      (total, obligation) => total + amount(obligation.obligation.expected_amount),
      0,
    )
    const collectedAmount = obligationViews.reduce(
      (total, obligation) => total + obligation.paidAmount,
      0,
    )
    const paidCount = obligationViews.filter((obligation) => obligation.status === 'paid').length
    const pendingCount = obligationViews.filter(
      (obligation) => obligation.status === 'pending',
    ).length

    const view: InstallmentView = {
      installment,
      cycleId: installment.cycle_id,
      recipient: installment.recipient_member_id
        ? (memberById.get(installment.recipient_member_id) ?? null)
        : null,
      obligations: obligationViews,
      expectedTotal,
      collectedAmount,
      paidCount,
      pendingCount,
      status: statusFor(collectedAmount, expectedTotal),
      payout: validPayoutByInstallment.get(installment.id) ?? null,
      isPast: installment.scheduled_date < today,
    }

    const list = installmentsByCycle.get(cycle.id) ?? []
    list.push(view)
    installmentsByCycle.set(cycle.id, list)
  }

  const cycleViews: CycleView[] = raw.cycles.map((cycle) => {
    const members = (cycleMembersByCycle.get(cycle.id) ?? [])
      .map((cycleMember) => {
        const member = memberById.get(cycleMember.member_id)
        return member ? { cycleMember, member } : null
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      .sort((a, b) => a.cycleMember.chit_number - b.cycleMember.chit_number)

    const installments = (installmentsByCycle.get(cycle.id) ?? []).sort(
      (a, b) => a.installment.installment_number - b.installment.installment_number,
    )

    const currentInstallment =
      installments.find((entry) =>
        entry.obligations.some((obligation) => obligation.remaining > 0),
      ) ??
      installments.find((entry) => !entry.payout) ??
      installments[installments.length - 1] ??
      null

    const nextInstallment =
      installments.find((entry) => entry.installment.scheduled_date >= today) ??
      installments[installments.length - 1] ??
      null

    return { cycle, members, installments, currentInstallment, nextInstallment }
  })

  cycleViews.sort((a, b) => b.cycle.start_date.localeCompare(a.cycle.start_date))

  const cyclesByGroup = new Map<string, CycleView[]>()
  for (const cycleView of cycleViews) {
    const list = cyclesByGroup.get(cycleView.cycle.group_id) ?? []
    list.push(cycleView)
    cyclesByGroup.set(cycleView.cycle.group_id, list)
  }

  const groups: GroupView[] = raw.groups.map((group) => {
    const members = raw.groupMembers
      .filter((membership) => membership.group_id === group.id)
      .map((membership) => {
        const member = memberById.get(membership.member_id)
        return member ? { membership, member } : null
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      .sort((a, b) => a.member.full_name.localeCompare(b.member.full_name))

    const groupCycles = cyclesByGroup.get(group.id) ?? []
    const finishedCycles = groupCycles.filter((cycleView) => cycleView.cycle.status !== 'draft')

    return {
      group,
      members,
      cycles: groupCycles,
      activeCycle: groupCycles.find((cycleView) => cycleView.cycle.status === 'active') ?? null,
      draftCycle: groupCycles.find((cycleView) => cycleView.cycle.status === 'draft') ?? null,
      latestCycle: finishedCycles[0] ?? null,
    }
  })

  return {
    profileId,
    groups,
    members: raw.members,
    profiles: raw.profiles,
    cycles: cycleViews,
    installments: cycleViews.flatMap((cycleView) => cycleView.installments),
    obligations: cycleViews.flatMap((cycleView) =>
      cycleView.installments.flatMap((installment) => installment.obligations),
    ),
    payments: raw.payments,
    payouts: raw.payouts,
  }
}

export function groupsForProfile(snapshot: BhishiSnapshot, profileId: string): GroupView[] {
  return snapshot.groups.filter((group) =>
    group.members.some((membership) => membership.member.profile_id === profileId),
  )
}

export function membersForProfile(snapshot: BhishiSnapshot, profileId: string): MemberRow[] {
  return snapshot.members.filter((member) => member.profile_id === profileId)
}

export function obligationsForMember(
  installments: InstallmentView[],
  memberId: string,
): ObligationView[] {
  return installments.flatMap((installment) =>
    installment.obligations.filter((obligation) => obligation.member.id === memberId),
  )
}

export function paymentsForMember(snapshot: BhishiSnapshot, memberId: string): PaymentRow[] {
  return snapshot.payments.filter((payment) => payment.member_id === memberId)
}

export function currentCycle(group: GroupView): CycleView | null {
  return group.activeCycle ?? group.latestCycle
}

/** Chit position held by a member in a cycle, or null when they do not take part. */
export function chitPosition(cycle: CycleView, memberId: string | null): number | null {
  if (!memberId) return null
  const entry = cycle.members.find((cycleMember) => cycleMember.member.id === memberId)
  return entry?.cycleMember.chit_number ?? null
}

/** How many months are fully collected and how many payouts are recorded. */
export function cycleProgress(cycle: CycleView): {
  collectedMonths: number
  paidPayouts: number
  totalMonths: number
} {
  return {
    collectedMonths: cycle.installments.filter((entry) => entry.status === 'paid').length,
    paidPayouts: cycle.installments.filter((entry) => Boolean(entry.payout)).length,
    totalMonths: cycle.installments.length,
  }
}

export function totalOutstanding(installments: InstallmentView[]): number {
  return installments.reduce(
    (total, installment) =>
      total +
      installment.obligations.reduce(
        (sum, obligation) => sum + Math.max(0, obligation.remaining),
        0,
      ),
    0,
  )
}

export function groupNameForCycle(snapshot: BhishiSnapshot, cycleId: string): string {
  const cycle = snapshot.cycles.find((entry) => entry.cycle.id === cycleId)
  if (!cycle) return 'Group'
  return (
    snapshot.groups.find((group) => group.group.id === cycle.cycle.group_id)?.group.name ?? 'Group'
  )
}

export function paymentOptions(snapshot: BhishiSnapshot): PaymentOption[] {
  const options: PaymentOption[] = []
  for (const cycle of snapshot.cycles) {
    if (
      snapshot.groups.find((group) => group.group.id === cycle.cycle.group_id)?.group.status ===
      'archived'
    ) {
      continue
    }
    const groupName = groupNameForCycle(snapshot, cycle.cycle.id)
    for (const installment of cycle.installments) {
      for (const obligation of installment.obligations) {
        if (obligation.remaining > 0) {
          options.push({ obligation, installment, groupName })
        }
      }
    }
  }
  return options.sort(
    (a, b) =>
      a.installment.installment.scheduled_date.localeCompare(
        b.installment.installment.scheduled_date,
      ) || a.obligation.member.full_name.localeCompare(b.obligation.member.full_name),
  )
}

export function payoutOptions(snapshot: BhishiSnapshot): PayoutOption[] {
  const options: PayoutOption[] = []
  for (const cycle of snapshot.cycles) {
    if (
      snapshot.groups.find((group) => group.group.id === cycle.cycle.group_id)?.group.status ===
      'archived'
    ) {
      continue
    }
    const groupName = groupNameForCycle(snapshot, cycle.cycle.id)
    for (const installment of cycle.installments) {
      if (installment.payout || !installment.recipient) continue
      // A payout can only be confirmed once every required contributor has paid.
      if (installment.expectedTotal > 0 && installment.collectedAmount < installment.expectedTotal)
        continue
      options.push({
        installment,
        groupName,
        amount: installment.expectedTotal || installment.installment.expected_amount,
      })
    }
  }
  return options.sort((a, b) =>
    a.installment.installment.scheduled_date.localeCompare(
      b.installment.installment.scheduled_date,
    ),
  )
}
