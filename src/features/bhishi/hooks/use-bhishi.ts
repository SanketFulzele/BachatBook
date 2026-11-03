import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/components/auth-context'
import { queryKeys } from '@/lib/query-keys'
import {
  activateDraftCycle,
  addGroupMember,
  createCycleDraft,
  createGroup,
  fetchSnapshot,
  linkMemberProfile,
  recordPayment,
  recordPayout,
  setCycleChitOrder,
  updateOwnProfile,
  voidPayment,
  voidPayout,
} from '../api/bhishi-api'
import { buildSnapshot } from '../lib/derive'
import type { ContributionPaymentMethod } from '../types'

export function useBhishiData() {
  const auth = useAuth()
  const profileId = auth.user?.id ?? ''

  return useQuery({
    queryKey: queryKeys.bhishi.snapshot(profileId),
    queryFn: async () => buildSnapshot(await fetchSnapshot(), profileId),
    enabled: Boolean(profileId),
  })
}

function useInvalidateBhishi() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.bhishi.all })
}

export function useCreateGroup() {
  const auth = useAuth()
  const invalidate = useInvalidateBhishi()

  return useMutation({
    mutationFn: (input: {
      name: string
      description: string
      contributionAmount: number
      collectionDay: number
      startDate: string | null
    }) =>
      createGroup({
        ...input,
        profileId: auth.user?.id ?? '',
      }),
    onSuccess: invalidate,
  })
}

export function useAddGroupMember() {
  const invalidate = useInvalidateBhishi()

  return useMutation({
    mutationFn: addGroupMember,
    onSuccess: invalidate,
  })
}

export function useLinkMemberProfile() {
  const invalidate = useInvalidateBhishi()

  return useMutation({
    mutationFn: linkMemberProfile,
    onSuccess: invalidate,
  })
}

export function useCreateCycleDraft() {
  const invalidate = useInvalidateBhishi()

  return useMutation({
    mutationFn: (input: {
      groupId: string
      name: string
      startDate: string
      contributionAmount: number
      collectionDay: number
    }) => createCycleDraft(input),
    onSuccess: invalidate,
  })
}

export function useSetCycleChitOrder() {
  const invalidate = useInvalidateBhishi()

  return useMutation({
    mutationFn: setCycleChitOrder,
    onSuccess: invalidate,
  })
}

export function useActivateDraftCycle() {
  const invalidate = useInvalidateBhishi()

  return useMutation({
    mutationFn: activateDraftCycle,
    onSuccess: invalidate,
  })
}

export function useRecordPayment() {
  const invalidate = useInvalidateBhishi()

  return useMutation({
    mutationFn: (input: {
      obligationId: string
      amount: number
      paymentDate: string
      method: ContributionPaymentMethod
      reference: string
      notes: string
    }) => recordPayment(input),
    onSuccess: invalidate,
  })
}

export function useVoidPayment() {
  const invalidate = useInvalidateBhishi()

  return useMutation({
    mutationFn: voidPayment,
    onSuccess: invalidate,
  })
}

export function useRecordPayout() {
  const invalidate = useInvalidateBhishi()

  return useMutation({
    mutationFn: (input: {
      installmentId: string
      amount: number
      payoutDate: string
      method: ContributionPaymentMethod
      notes: string
    }) => recordPayout(input),
    onSuccess: invalidate,
  })
}

export function useVoidPayout() {
  const invalidate = useInvalidateBhishi()

  return useMutation({
    mutationFn: voidPayout,
    onSuccess: invalidate,
  })
}

export function useUpdateOwnProfile() {
  const auth = useAuth()
  const invalidate = useInvalidateBhishi()

  return useMutation({
    mutationFn: (input: { fullName: string; phone: string }) =>
      updateOwnProfile({
        ...input,
        profileId: auth.user?.id ?? '',
      }),
    onSuccess: async () => {
      await invalidate()
      await auth.refreshProfile()
    },
  })
}
