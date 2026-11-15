import { useMemo } from 'react'
import { computeMemberLedger } from '@/features/members/lib/ledger'
import { useRawSnapshot } from '@/features/members/hooks/use-ledger'
import type { MemberPayoutSeries } from '../types'
import { computeMemberPayoutSeries } from '../lib/payout-series'

/**
 * Payout series for one member, derived from the same cached raw snapshot and
 * the same ledger calculation used by the Member Financial Ledger. Switching
 * members never refetches or reloads the page.
 */
export function useMemberPayoutSeries(memberId: string) {
  const query = useRawSnapshot()

  const series = useMemo<MemberPayoutSeries | null>(() => {
    if (!query.data || !memberId) return null
    try {
      return computeMemberPayoutSeries(computeMemberLedger(query.data, memberId))
    } catch (error) {
      console.error('Failed to compute member payout series', error)
      return null
    }
  }, [query.data, memberId])

  return { query, series }
}
