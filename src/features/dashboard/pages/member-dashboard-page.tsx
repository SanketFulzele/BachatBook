import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, HandCoins, UserRound, Wallet } from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button-variants'
import { Card, CardContent } from '@/components/ui/card'
import { PageLoading } from '@/components/feedback/page-loading'
import { useAuth } from '@/features/auth/components/auth-context'
import { ROUTES } from '@/lib/constants'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DataError } from '@/features/bhishi/components/data-error'
import { EmptyState } from '@/features/bhishi/components/empty-state'
import { GroupCard } from '@/features/bhishi/components/group-card'
import { PayoutBadge, StatusBadge } from '@/features/bhishi/components/status-badge'
import { useBhishiData } from '@/features/bhishi/hooks/use-bhishi'
import {
  currentCycle,
  groupNameForCycle,
  groupsForProfile,
  membersForProfile,
} from '@/features/bhishi/lib/derive'
import type { PaymentMethod } from '@/features/bhishi/types'

const methodLabel: Record<PaymentMethod, string> = {
  cash: 'Cash',
  upi: 'UPI',
  bank_transfer: 'Bank transfer',
  other: 'Other',
}

export function MemberDashboardPage() {
  const auth = useAuth()
  const query = useBhishiData()

  const firstName = (auth.user?.fullName ?? '').trim().split(/\s+/)[0] || 'there'

  const derived = useMemo(() => {
    if (!query.data) return null
    const snapshot = query.data
    const myGroups = groupsForProfile(snapshot, snapshot.profileId)
    const myMembers = membersForProfile(snapshot, snapshot.profileId)
    const ownIds = new Set(myMembers.map((member) => member.id))
    const myObligations = snapshot.installments.flatMap((installment) =>
      installment.obligations
        .filter((obligation) => ownIds.has(obligation.member.id))
        .map((obligation) => ({ obligation, installment })),
    )
    const pending = myObligations.filter((row) => row.obligation.remaining > 0)
    const pendingTotal = pending.reduce((total, row) => total + row.obligation.remaining, 0)
    const paidTotal = myObligations.reduce((total, row) => total + row.obligation.paidAmount, 0)
    const recentPayments = snapshot.payments
      .filter((payment) => ownIds.has(payment.member_id) && !payment.is_voided)
      .slice(0, 5)

    return {
      snapshot,
      myGroups,
      myMembers,
      pending,
      pendingTotal,
      paidTotal,
      recentPayments,
    }
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

  if (!derived) return null

  const { snapshot, myGroups, myMembers, pendingTotal, paidTotal, recentPayments } = derived
  const primaryGroup = myGroups[0]
  const primaryMember = primaryGroup?.members.find(
    (membership) => membership.member.profile_id === snapshot.profileId,
  )?.member
  const cycle = primaryGroup ? currentCycle(primaryGroup) : null
  const installment = cycle?.currentInstallment ?? cycle?.nextInstallment ?? null
  const myObligation = installment?.obligations.find(
    (obligation) => obligation.member.id === primaryMember?.id,
  )

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Namaste, ${firstName}`}
        description="Your Bhishi at a glance."
        actions={
          <Link
            to={ROUTES.member.profile}
            className={buttonVariants({ variant: 'outline', size: 'lg' })}
          >
            <UserRound className="h-4 w-4" aria-hidden="true" />
            Profile
          </Link>
        }
      />

      {myMembers.length === 0 || myGroups.length === 0 ? (
        <EmptyState
          icon={HandCoins}
          title={myMembers.length === 0 ? 'Your login is not linked yet' : 'No group yet'}
          description={
            myMembers.length === 0
              ? 'Ask your group admin to add you as a member and link this login. Then your contributions will appear here.'
              : 'Your admin has not added you to a Bhishi group yet. Please check back later.'
          }
          action={
            <Link
              to={ROUTES.member.profile}
              className={buttonVariants({ variant: 'outline', size: 'lg' })}
            >
              View profile
            </Link>
          }
        />
      ) : (
        <>
          {primaryGroup ? <GroupCard group={primaryGroup} /> : null}

          <Card>
            <CardContent className="space-y-4 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    This month
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-secondary">
                    {installment
                      ? `Contribution #${installment.installment.installment_number}`
                      : 'No installment yet'}
                  </h2>
                  {installment ? (
                    <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                      <CalendarDays className="h-4 w-4" aria-hidden="true" />
                      Due {formatDate(installment.installment.scheduled_date)}
                    </p>
                  ) : null}
                </div>
                {myObligation ? <StatusBadge status={myObligation.status} /> : null}
              </div>

              {myObligation ? (
                <div className="rounded-xl border border-border px-3.5 py-3">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">Your contribution</span>
                    <span className="text-lg font-semibold">
                      {formatCurrency(myObligation.obligation.expected_amount)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">Paid</span>
                    <span className="font-medium text-success">
                      {formatCurrency(myObligation.paidAmount)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">Remaining</span>
                    <span
                      className={
                        myObligation.remaining > 0
                          ? 'font-semibold text-destructive'
                          : 'font-semibold text-success'
                      }
                    >
                      {formatCurrency(myObligation.remaining)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="rounded-lg bg-muted px-3 py-3 text-sm text-muted-foreground">
                  No contribution is due for you in this installment.
                </p>
              )}

              <div className="rounded-xl bg-muted/60 px-3.5 py-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <Wallet className="h-4 w-4" aria-hidden="true" />
                    Payout recipient
                  </span>
                  <span className="font-semibold">
                    {installment?.recipient?.full_name ?? 'Not set'}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Payout</span>
                  {installment ? (
                    <PayoutBadge paid={Boolean(installment.payout)} />
                  ) : (
                    <Badge variant="outline">Not scheduled</Badge>
                  )}
                </div>
                {installment ? (
                  <div className="mt-1 flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-medium">{formatCurrency(installment.expectedTotal)}</span>
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border px-3.5 py-3">
                  <p className="text-xs text-muted-foreground">Pending total</p>
                  <p className="mt-1 text-lg font-semibold text-destructive">
                    {formatCurrency(pendingTotal)}
                  </p>
                </div>
                <div className="rounded-xl border border-border px-3.5 py-3">
                  <p className="text-xs text-muted-foreground">Paid so far</p>
                  <p className="mt-1 text-lg font-semibold text-success">
                    {formatCurrency(paidTotal)}
                  </p>
                </div>
              </div>

              <Link
                to={ROUTES.member.payments}
                className={buttonVariants({ size: 'lg', className: 'w-full' })}
              >
                <HandCoins className="h-4 w-4" aria-hidden="true" />
                View my payments
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-secondary">Recent payments</h2>
                <Link
                  to={ROUTES.member.payments}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary"
                >
                  All
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
              {recentPayments.length === 0 ? (
                <p className="mt-3 rounded-lg bg-muted px-3 py-3 text-sm text-muted-foreground">
                  No payments recorded yet.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-border">
                  {recentPayments.map((payment) => {
                    const installmentView = snapshot.installments.find(
                      (entry) => entry.installment.id === payment.installment_id,
                    )
                    return (
                      <li key={payment.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {installmentView
                              ? `Installment #${installmentView.installment.installment_number}`
                              : 'Payment'}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {installmentView
                              ? groupNameForCycle(snapshot, installmentView.cycleId)
                              : ''}{' '}
                            · {formatDate(payment.payment_date)} ·{' '}
                            {methodLabel[payment.payment_method]}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-success">
                          {formatCurrency(payment.amount)}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {myGroups.length > 1 ? (
            <div className="space-y-3">
              <h2 className="text-base font-semibold text-secondary">Your other groups</h2>
              {myGroups.slice(1).map((group) => (
                <GroupCard key={group.group.id} group={group} />
              ))}
            </div>
          ) : null}

          {myGroups.length > 0 ? (
            <Link
              to={ROUTES.member.groups}
              className={buttonVariants({ variant: 'outline', size: 'lg', className: 'w-full' })}
            >
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
              View group, chit order and installments
            </Link>
          ) : null}
        </>
      )}
    </div>
  )
}
