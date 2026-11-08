import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/components/auth-context'
import { queryKeys } from '@/lib/query-keys'
import { fetchSnapshot } from '@/features/bhishi/api/bhishi-api'
import { computeMemberLedger } from '../lib/ledger'
import type { MemberLedger } from '../types'

export function useMemberLedger(memberId: string) {
  const auth = useAuth()
  const profileId = auth.user?.id ?? ''

  const query = useQuery({
    queryKey: queryKeys.bhishi.rawSnapshot(profileId),
    queryFn: async () => fetchSnapshot(),
    enabled: Boolean(profileId && memberId),
  })

  const ledger = useMemo<MemberLedger | null>(() => {
    if (!query.data) return null
    try {
      return computeMemberLedger(query.data, memberId)
    } catch (error) {
      console.error('Failed to compute member ledger', error)
      return null
    }
  }, [query.data, memberId])

  return { query, ledger }
}
