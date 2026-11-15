import { useMemo, useState } from 'react'
import { ChartLine } from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { PageLoading } from '@/components/feedback/page-loading'
import { useAuth } from '@/features/auth/components/auth-context'
import { DataError } from '@/features/bhishi/components/data-error'
import { EmptyState } from '@/features/bhishi/components/empty-state'
import { useRawSnapshot } from '@/features/members/hooks/use-ledger'
import { MemberChartsView } from '../components/member-charts-view'
import { useMemberPayoutSeries } from '../hooks/use-payout-series'

export function AdminMemberChartsPage() {
  const auth = useAuth()
  const profileId = auth.user?.id ?? ''
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const query = useRawSnapshot()

  const members = useMemo(
    () => [...(query.data?.members ?? [])].sort((a, b) => a.full_name.localeCompare(b.full_name)),
    [query.data],
  )

  // Default to the signed-in admin's own member record so the page opens on
  // "his" charts, then fall back to the first member and to the current
  // selection (which may disappear after a data refresh).
  const ownMember = useMemo(
    () => (profileId ? members.find((member) => member.profile_id === profileId) : undefined),
    [members, profileId],
  )
  const activeMember =
    members.find((member) => member.id === selectedMemberId) ?? ownMember ?? members[0] ?? null
  const { series } = useMemberPayoutSeries(activeMember?.id ?? '')

  if (query.isPending) return <PageLoading />

  if (query.isError) {
    return (
      <DataError
        message={query.error instanceof Error ? query.error.message : undefined}
        onRetry={() => void query.refetch()}
      />
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Member Charts"
        description="Follow each member's payout journey across every group, cycle and installment."
      />

      {members.length === 0 ? (
        <EmptyState
          icon={ChartLine}
          title="No members yet"
          description="Add members to a Bhishi group to see their cumulative and individual payout charts."
        />
      ) : (
        <>
          <Card>
            <CardContent className="p-4 sm:p-5">
              <div className="max-w-sm space-y-2">
                <Label htmlFor="chart-member">Select member</Label>
                <Select
                  id="chart-member"
                  value={activeMember?.id ?? ''}
                  onChange={(event) => setSelectedMemberId(event.target.value)}
                >
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.full_name}
                    </option>
                  ))}
                </Select>
              </div>
            </CardContent>
          </Card>

          {activeMember && series ? (
            <MemberChartsView memberName={activeMember.full_name} series={series} />
          ) : null}
        </>
      )}
    </div>
  )
}
