import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, HandCoins } from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { PageLoading } from '@/components/feedback/page-loading'
import { useAuth } from '@/features/auth/components/auth-context'
import { ROUTES } from '@/lib/constants'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DataError } from '@/features/bhishi/components/data-error'
import { EmptyState } from '@/features/bhishi/components/empty-state'
import { StatusBadge } from '@/features/bhishi/components/status-badge'
import { useBhishiData } from '@/features/bhishi/hooks/use-bhishi'
import { groupsForProfile } from '@/features/bhishi/lib/derive'

export function MemberDashboardPage() {
  const auth = useAuth()
  const query = useBhishiData()
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const firstName = (auth.user?.fullName ?? '').trim().split(/\s+/)[0] || 'there'

  const memberGroups = useMemo(
    () =>
      query.data
        ? groupsForProfile(query.data, query.data.profileId).filter(
            (group) =>
              group.group.status === 'active' &&
              group.members.some(
                (membership) =>
                  membership.member.profile_id === query.data?.profileId &&
                  membership.membership.status === 'active',
              ),
          )
        : [],
    [query.data],
  )

  if (query.isPending) return <PageLoading />
  if (query.isError) {
    return (
      <DataError
        message={query.error instanceof Error ? query.error.message : undefined}
        onRetry={() => void query.refetch()}
      />
    )
  }

  const snapshot = query.data
  const group =
    memberGroups.find((entry) => entry.group.id === selectedGroupId) ?? memberGroups[0] ?? null
  const member = group?.members.find(
    (entry) => entry.member.profile_id === snapshot.profileId,
  )?.member
  const cycle = group?.activeCycle ?? null
  const installment = cycle?.nextInstallment ?? cycle?.currentInstallment ?? null
  const obligation = installment?.obligations.find((entry) => entry.member.id === member?.id)
  const chitPosition =
    cycle?.members.find((entry) => entry.member.id === installment?.recipient?.id)?.cycleMember
      .chit_number ?? null

  return (
    <div className="space-y-5">
      <PageHeader title={`Namaste, ${firstName}`} description="Your Bhishi at a glance." />

      {memberGroups.length === 0 ? (
        <EmptyState
          icon={HandCoins}
          title="No active Bhishi group"
          description="Your active group and monthly contribution will appear here when your admin starts a cycle."
          action={
            <Link
              to={ROUTES.member.groups}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-medium"
            >
              View my groups
            </Link>
          }
        />
      ) : (
        <>
          {memberGroups.length > 1 ? (
            <div className="space-y-1.5">
              <label htmlFor="member-dashboard-group" className="text-sm font-medium">
                My Bhishi group
              </label>
              <Select
                id="member-dashboard-group"
                value={group?.group.id ?? ''}
                onChange={(event) => setSelectedGroupId(event.target.value)}
              >
                {memberGroups.map((entry) => (
                  <option key={entry.group.id} value={entry.group.id}>
                    {entry.group.name}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}

          <Card>
            <CardContent className="space-y-4 p-4 sm:p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  My active Bhishi group
                </p>
                <h2 className="mt-1 text-lg font-semibold text-secondary">{group?.group.name}</h2>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 px-3.5 py-3">
                <span className="text-sm text-muted-foreground">Monthly contribution</span>
                <span className="text-lg font-semibold">
                  {formatCurrency(
                    cycle?.cycle.contribution_amount_snapshot ??
                      group?.group.contribution_amount ??
                      0,
                  )}
                </span>
              </div>

              {installment ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                        Next due date
                      </p>
                      <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium">
                        <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
                        {formatDate(installment.installment.scheduled_date)}
                      </p>
                    </div>
                    {obligation ? <StatusBadge status={obligation.status} /> : null}
                  </div>

                  {obligation ? (
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3.5 py-3">
                      <span className="text-sm text-muted-foreground">My outstanding amount</span>
                      <span
                        className={
                          obligation.remaining > 0
                            ? 'text-lg font-semibold text-destructive'
                            : 'text-lg font-semibold text-success'
                        }
                      >
                        {formatCurrency(obligation.remaining)}
                      </span>
                    </div>
                  ) : (
                    <p className="rounded-lg bg-muted px-3 py-3 text-sm text-muted-foreground">
                      No contribution obligation is available for you this installment — you may be
                      the recipient this month, or the cycle hasn't started yet.
                    </p>
                  )}

                  <div className="space-y-2 rounded-xl bg-muted/60 px-3.5 py-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">This month&apos;s recipient</span>
                      <span className="text-right font-semibold">
                        {installment.recipient?.full_name ?? 'Not set'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Your chit position</span>
                      <span className="font-medium">
                        {member
                          ? `#${cycle?.members.find((entry) => entry.member.id === member.id)?.cycleMember.chit_number ?? '—'}`
                          : '—'}
                      </span>
                    </div>
                    {chitPosition ? (
                      <p className="text-right text-xs text-muted-foreground">
                        Recipient is chit #{chitPosition}
                      </p>
                    ) : null}
                  </div>
                </>
              ) : (
                <p className="rounded-lg bg-muted px-3 py-3 text-sm text-muted-foreground">
                  Your current installment will appear here once the cycle schedule is available.
                </p>
              )}

              <Link
                to={ROUTES.member.payments}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-medium"
              >
                View my payments
              </Link>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
