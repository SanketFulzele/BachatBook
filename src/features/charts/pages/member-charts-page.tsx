import { useMemo } from 'react'
import { ChartLine } from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { PageLoading } from '@/components/feedback/page-loading'
import { DataError } from '@/features/bhishi/components/data-error'
import { EmptyState } from '@/features/bhishi/components/empty-state'
import { useAuth } from '@/features/auth/components/auth-context'
import { useRawSnapshot } from '@/features/members/hooks/use-ledger'
import { MemberChartsView } from '../components/member-charts-view'
import { useMemberPayoutSeries } from '../hooks/use-payout-series'

/**
 * Members only ever see their own payout charts. The member id is resolved from
 * the auth-backed profile, never from a URL parameter, and PostgreSQL RLS still
 * limits the underlying snapshot to the member's own groups.
 */
export function MemberChartsPage() {
  const auth = useAuth()
  const profileId = auth.user?.id ?? ''
  const query = useRawSnapshot()

  const ownMember = useMemo(() => {
    if (!query.data || !profileId) return undefined
    return query.data.members.find((member) => member.profile_id === profileId)
  }, [query.data, profileId])

  const { series } = useMemberPayoutSeries(ownMember?.id ?? '')

  if (query.isPending) return <PageLoading />

  if (query.isError) {
    return (
      <DataError
        message={query.error instanceof Error ? query.error.message : undefined}
        onRetry={() => void query.refetch()}
      />
    )
  }

  if (!ownMember) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Member Charts"
          description="Your payout charts will appear here once you join a Bhishi group."
        />
        <EmptyState
          icon={ChartLine}
          title="You are not linked to a member yet"
          description="Ask your administrator to link your login to a member record to see your payout charts."
        />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Member Charts"
        description="Your cumulative and individual payouts across every group and cycle."
      />

      {series ? (
        <MemberChartsView memberName={ownMember.full_name} series={series} />
      ) : (
        <EmptyState
          icon={ChartLine}
          title="Payout charts unavailable"
          description="We could not match your payout history. Try signing out and back in."
        />
      )}
    </div>
  )
}
