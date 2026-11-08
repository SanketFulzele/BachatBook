import { getNeonDataApi } from '@/lib/neon'
import type { Json } from '@/types/database.types'
import type { ContributionPaymentMethod, GroupRow, MemberRow, RawSnapshot } from '../types'

export interface ChitOrderEntry {
  member_id: string
  chit_number: number
}

function messageFrom(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) return message.trim()
  }
  return 'The request to the database failed. Please try again.'
}

function fail(error: unknown): never {
  throw new Error(messageFrom(error))
}

/**
 * One small snapshot of every table the Bhishi screens need.
 *
 * PostgreSQL RLS decides what is visible: admins receive all rows, members
 * receive their own groups and shared member directory. No role is passed from
 * the browser.
 */
export async function fetchSnapshot(): Promise<RawSnapshot> {
  const api = getNeonDataApi()

  const [
    groups,
    members,
    groupMembers,
    profiles,
    cycles,
    cycleMembers,
    installments,
    obligations,
    payments,
    payouts,
  ] = await Promise.all([
    api.from('bhishi_groups').select('*').order('created_at', { ascending: false }),
    api.from('members').select('*').order('full_name', { ascending: true }),
    api.from('group_members').select('*').order('joined_at', { ascending: true }),
    api.from('profiles').select('*').order('full_name', { ascending: true }),
    api.from('cycles').select('*').order('start_date', { ascending: false }),
    api.from('cycle_members').select('*').order('chit_number', { ascending: true }),
    api.from('installments').select('*').order('scheduled_date', { ascending: true }),
    api.from('contribution_obligations').select('*').order('created_at', { ascending: true }),
    api.from('payments').select('*').order('payment_date', { ascending: false }),
    api.from('payouts').select('*').order('payout_date', { ascending: false }),
  ])

  if (groups.error) fail(groups.error)
  if (members.error) fail(members.error)
  if (groupMembers.error) fail(groupMembers.error)
  if (profiles.error) fail(profiles.error)
  if (cycles.error) fail(cycles.error)
  if (cycleMembers.error) fail(cycleMembers.error)
  if (installments.error) fail(installments.error)
  if (obligations.error) fail(obligations.error)
  if (payments.error) fail(payments.error)
  if (payouts.error) fail(payouts.error)

  return {
    groups: groups.data ?? [],
    members: members.data ?? [],
    groupMembers: groupMembers.data ?? [],
    profiles: profiles.data ?? [],
    cycles: cycles.data ?? [],
    cycleMembers: cycleMembers.data ?? [],
    installments: installments.data ?? [],
    obligations: obligations.data ?? [],
    payments: payments.data ?? [],
    payouts: payouts.data ?? [],
  }
}

export async function createGroup(input: {
  name: string
  description: string
  contributionAmount: number
  collectionDay: number
  startDate: string | null
  profileId: string
}): Promise<GroupRow> {
  const { data, error } = await getNeonDataApi()
    .from('bhishi_groups')
    .insert({
      name: input.name.trim(),
      description: input.description.trim() || null,
      contribution_amount: input.contributionAmount,
      collection_day: input.collectionDay,
      start_date: input.startDate || null,
      status: 'draft',
      created_by: input.profileId,
    })
    .select('*')
    .single()

  if (error) fail(error)
  return data
}

export async function archiveGroup(groupId: string): Promise<void> {
  const { error } = await getNeonDataApi().rpc('archive_group', {
    target_group_id: groupId,
  })

  if (error) fail(error)
}

export async function deleteEmptyGroup(input: {
  groupId: string
  confirmationName: string
}): Promise<void> {
  const { error } = await getNeonDataApi().rpc('delete_empty_group', {
    target_group_id: input.groupId,
    confirmation_name: input.confirmationName,
  })

  if (error) fail(error)
}

export async function addGroupMember(input: {
  groupId: string
  fullName: string
  phone: string
  email: string
}): Promise<MemberRow> {
  const api = getNeonDataApi()

  const memberResult = await api
    .from('members')
    .insert({
      full_name: input.fullName.trim(),
      phone: input.phone.trim() || null,
      email: input.email.trim() || null,
    })
    .select('*')
    .single()

  if (memberResult.error) fail(memberResult.error)

  const membershipResult = await api.from('group_members').insert({
    group_id: input.groupId,
    member_id: memberResult.data.id,
    status: 'active',
  })

  if (membershipResult.error) fail(membershipResult.error)

  return memberResult.data
}

export async function linkMemberProfile(input: {
  memberId: string
  profileId: string
}): Promise<void> {
  const { error } = await getNeonDataApi()
    .from('members')
    .update({ profile_id: input.profileId })
    .eq('id', input.memberId)

  if (error) fail(error)
}

export async function addProfilesToGroup(input: {
  groupId: string
  profileIds: string[]
}): Promise<number> {
  const { data, error } = await getNeonDataApi().rpc('add_profiles_to_group', {
    target_group_id: input.groupId,
    target_profile_ids: input.profileIds,
  })

  if (error) fail(error)
  return data ?? 0
}

export async function createCycleDraft(input: {
  groupId: string
  name: string
  startDate: string
  contributionAmount: number
  collectionDay: number
  memberIds: string[]
}): Promise<string> {
  const { data, error } = await getNeonDataApi().rpc('create_scheduled_cycle', {
    target_group_id: input.groupId,
    cycle_name: input.name,
    cycle_start_date: input.startDate,
    contribution_amount: input.contributionAmount,
    collection_day: input.collectionDay,
    participating_member_ids: input.memberIds,
  })

  if (error) fail(error)
  return data
}

export async function updateScheduledCycle(input: {
  cycleId: string
  name: string
  startDate: string
  contributionAmount: number
  collectionDay: number
  memberIds: string[]
}): Promise<string> {
  const { data, error } = await getNeonDataApi().rpc('update_scheduled_cycle', {
    target_cycle_id: input.cycleId,
    cycle_name: input.name,
    cycle_start_date: input.startDate,
    contribution_amount: input.contributionAmount,
    collection_day: input.collectionDay,
    participating_member_ids: input.memberIds,
  })

  if (error) fail(error)
  return data
}

export async function setCycleChitOrder(input: {
  cycleId: string
  chitOrder: ChitOrderEntry[]
}): Promise<void> {
  const { error } = await getNeonDataApi().rpc('set_cycle_chit_order', {
    target_cycle_id: input.cycleId,
    chit_order: input.chitOrder as unknown as Json,
  })

  if (error) fail(error)
}

export async function activateDraftCycle(cycleId: string): Promise<string> {
  const { data, error } = await getNeonDataApi().rpc('activate_cycle_draft', {
    target_cycle_id: cycleId,
  })

  if (error) fail(error)
  return data
}

export async function recordPayment(input: {
  obligationId: string
  amount: number
  paymentDate: string
  method: ContributionPaymentMethod
  reference: string
  notes: string
}): Promise<void> {
  const { error } = await getNeonDataApi().rpc('record_payment', {
    target_obligation_id: input.obligationId,
    payment_amount: input.amount,
    target_payment_date: input.paymentDate,
    target_payment_method: input.method,
    payment_reference: input.reference.trim() || undefined,
    payment_notes: input.notes.trim() || undefined,
  })

  if (error) fail(error)
}

export async function recordGroupPayment(input: {
  groupId: string
  obligationId: string
  amount: number
  paymentDate: string
  method: ContributionPaymentMethod
  reference: string
  notes: string
}): Promise<void> {
  const { error } = await getNeonDataApi().rpc('record_group_payment', {
    target_group_id: input.groupId,
    target_obligation_id: input.obligationId,
    payment_amount: input.amount,
    target_payment_date: input.paymentDate,
    target_payment_method: input.method,
    payment_reference: input.reference.trim() || undefined,
    payment_notes: input.notes.trim() || undefined,
  })

  if (error) fail(error)
}

export async function voidPayment(input: { paymentId: string; reason: string }): Promise<void> {
  const { error } = await getNeonDataApi().rpc('void_payment', {
    target_payment_id: input.paymentId,
    void_reason: input.reason.trim(),
  })

  if (error) fail(error)
}

export async function recordPayout(input: {
  installmentId: string
  amount: number
  payoutDate: string
  method: ContributionPaymentMethod
  notes: string
}): Promise<void> {
  const { error } = await getNeonDataApi().rpc('record_payout', {
    target_installment_id: input.installmentId,
    payout_amount: input.amount,
    target_payout_date: input.payoutDate,
    target_payment_method: input.method,
    payout_notes: input.notes.trim() || undefined,
  })

  if (error) fail(error)
}

export async function voidPayout(input: { payoutId: string; reason: string }): Promise<void> {
  const { error } = await getNeonDataApi().rpc('void_payout', {
    target_payout_id: input.payoutId,
    void_reason: input.reason.trim(),
  })

  if (error) fail(error)
}

export async function updateOwnProfile(input: {
  profileId: string
  fullName: string
  phone: string
}): Promise<void> {
  const { error } = await getNeonDataApi()
    .from('profiles')
    .update({
      full_name: input.fullName.trim(),
      phone: input.phone.trim() || null,
    })
    .eq('id', input.profileId)

  if (error) fail(error)
}
