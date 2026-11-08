import { useMemo } from 'react'
import { CalendarDays, UsersRound, Wallet } from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { PageLoading } from '@/components/feedback/page-loading'
import { useAuth } from '@/features/auth/components/auth-context'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DataError } from '@/features/bhishi/components/data-error'
import { EmptyState } from '@/features/bhishi/components/empty-state'
import { PayoutBadge, StatusBadge } from '@/features/bhishi/components/status-badge'
import { useBhishiData } from '@/features/bhishi/hooks/use-bhishi'
import { currentCycle, groupsForProfile, membersForProfile } from '@/features/bhishi/lib/derive'

export function MemberGroupsPage() {
  const auth = useAuth()
  const query = useBhishiData()

  const ownMemberIds = useMemo(() => {
    if (!query.data) return new Set<string>()
    return new Set(membersForProfile(query.data, query.data.profileId).map((member) => member.id))
  }, [query.data])

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
  const groups = groupsForProfile(snapshot, snapshot.profileId)
  const firstName = (auth.user?.fullName ?? '').trim().split(/\s+/)[0] || 'there'

  if (groups.length === 0) {
    return (
      <div className="space-y-5">
        <PageHeader title="My Group" documentTitle="My Group" />
        <EmptyState
          icon={UsersRound}
          title="No group linked yet"
          description="Ask your group admin to add you as a member and link this login. Your group, chit order and installments will appear here."
        />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="My Group"
        description={`Namaste ${firstName}. Your group, chit order and monthly installments.`}
        documentTitle="My Group"
      />

      {groups.map((group) => {
        const mine = group.members.filter((membership) => ownMemberIds.has(membership.member.id))
        const cycle = currentCycle(group)
        const myChit = cycle?.members.find((entry) => ownMemberIds.has(entry.member.id))
        const installment = cycle?.currentInstallment ?? cycle?.nextInstallment ?? null
        const myObligation =
          installment?.obligations.find((entry) => ownMemberIds.has(entry.member.id)) ?? null
        const contribution =
          cycle?.cycle.contribution_amount_snapshot ?? group.group.contribution_amount
        const collectionDay = cycle?.cycle.collection_day_snapshot ?? group.group.collection_day
        const memberCount = cycle?.cycle.total_members ?? group.members.length

        return (
          <div key={group.group.id} className="space-y-4">
            <Card>
              <CardContent className="space-y-4 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-secondary">
                      {group.group.name}
                    </h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {formatCurrency(contribution)} / month
                    </p>
                  </div>
                  {myChit ? (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-base font-bold text-primary">
                      #{myChit.cycleMember.chit_number}
                    </span>
                  ) : null}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border px-3.5 py-3">
                    <p className="text-xs text-muted-foreground">Members</p>
                    <p className="mt-1 text-base font-semibold">{memberCount}</p>
                  </div>
                  <div className="rounded-xl border border-border px-3.5 py-3">
                    <p className="text-xs text-muted-foreground">Collection day</p>
                    <p className="mt-1 text-base font-semibold">{collectionDay}</p>
                  </div>
                </div>

                {mine.length > 0 ? (
                  <div className="rounded-xl bg-muted/60 px-3.5 py-3 text-sm">
                    <p className="text-xs text-muted-foreground">Your membership</p>
                    {mine.map((membership) => (
                      <p key={membership.member.id} className="mt-1 font-medium">
                        {membership.member.full_name}
                        {myChit ? ` · Chit ${myChit.cycleMember.chit_number}` : ''}
                      </p>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {installment ? (
              <Card>
                <CardContent className="space-y-3 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                        This month
                      </p>
                      <h3 className="mt-1 text-base font-semibold text-secondary">
                        Installment #{installment.installment.installment_number}
                      </h3>
                      <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                        Due {formatDate(installment.installment.scheduled_date)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <StatusBadge status={myObligation?.status ?? installment.status} />
                      <PayoutBadge paid={Boolean(installment.payout)} />
                    </div>
                  </div>

                  <div className="rounded-xl bg-muted/60 px-3.5 py-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-2 text-muted-foreground">
                        <Wallet className="h-4 w-4" aria-hidden="true" />
                        Payout recipient
                      </span>
                      <span className="font-semibold">
                        {installment.recipient?.full_name ?? 'Not set'}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Recipient chit</span>
                      <span className="font-medium">
                        {installment.recipient
                          ? `Chit #${
                              cycle?.members.find(
                                (entry) => entry.member.id === installment.recipient?.id,
                              )?.cycleMember.chit_number ?? '-'
                            }`
                          : 'Not set'}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Payout amount</span>
                      <span className="font-medium">
                        {formatCurrency(installment.expectedTotal)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {installment.obligations.map((obligation) => {
                      const isMine = ownMemberIds.has(obligation.member.id)
                      return (
                        <div
                          key={obligation.obligation.id}
                          className={
                            isMine
                              ? 'flex items-center gap-3 rounded-xl border border-primary/30 bg-primary-soft/40 px-3.5 py-2.5'
                              : 'flex items-center gap-3 px-1 py-2'
                          }
                        >
                          <Avatar name={obligation.member.full_name} size="sm" decorative />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {obligation.member.full_name}
                              {isMine ? ' (you)' : ''}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Paid {formatCurrency(obligation.paidAmount)} of{' '}
                              {formatCurrency(obligation.obligation.expected_amount)}
                            </p>
                          </div>
                          <StatusBadge status={obligation.status} />
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-4 sm:p-5">
                  <p className="text-sm text-muted-foreground">
                    The cycle has not started yet. Your admin will start it after everyone joins.
                  </p>
                </CardContent>
              </Card>
            )}

            {cycle ? (
              <section className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-secondary">Chit order</h3>
                  {myChit ? (
                    <span className="text-xs font-medium text-primary">
                      Your position: #{myChit.cycleMember.chit_number}
                    </span>
                  ) : null}
                </div>
                <div className="divide-y divide-border rounded-xl border border-border bg-card">
                  {cycle.members.map((entry) => (
                    <div
                      key={entry.cycleMember.id}
                      className="flex items-center gap-3 px-3.5 py-2.5"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                        {entry.cycleMember.chit_number}
                      </span>
                      <p className="min-w-0 flex-1 truncate text-sm font-medium">
                        {entry.member.full_name}
                        {ownMemberIds.has(entry.member.id) ? ' (you)' : ''}
                      </p>
                      {entry.cycleMember.chit_number === 1 ? (
                        <Badge variant="primary">First payout</Badge>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {cycle ? (
              <section className="space-y-2">
                <h3 className="text-base font-semibold text-secondary">Monthly installments</h3>
                <div className="divide-y divide-border rounded-xl border border-border bg-card">
                  {cycle.installments.map((entry) => {
                    const position = cycle.members.find(
                      (member) => member.member.id === entry.recipient?.id,
                    )?.cycleMember.chit_number
                    const ownObligation =
                      entry.obligations.find((obligation) =>
                        ownMemberIds.has(obligation.member.id),
                      ) ?? null
                    return (
                      <div key={entry.installment.id} className="space-y-2 px-3.5 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">
                              #{entry.installment.installment_number} ·{' '}
                              {formatDate(entry.installment.scheduled_date)}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              Recipient {entry.recipient?.full_name ?? 'Not set'}
                              {position ? ` · Chit #${position}` : ''}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <StatusBadge status={ownObligation?.status ?? entry.status} />
                            <PayoutBadge paid={Boolean(entry.payout)} />
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-muted-foreground">Actual payout</span>
                          <span className="font-medium">
                            {entry.payout ? formatCurrency(entry.payout.amount) : 'Not recorded'}
                          </span>
                        </div>
                        {entry.payout ? (
                          <p className="text-right text-xs text-muted-foreground">
                            Paid {formatDate(entry.payout.payout_date)}
                          </p>
                        ) : null}
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-muted-foreground">Your contribution</span>
                          <span className="font-semibold">
                            {formatCurrency(
                              ownObligation?.obligation.expected_amount ?? contribution,
                            )}
                          </span>
                        </div>
                        {ownObligation && ownObligation.remaining > 0 ? (
                          <p className="text-xs font-medium text-destructive">
                            {formatCurrency(ownObligation.remaining)} still pending
                          </p>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              </section>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
