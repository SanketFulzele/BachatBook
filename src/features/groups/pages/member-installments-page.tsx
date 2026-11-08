import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/common/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { PageLoading } from '@/components/feedback/page-loading'
import { useAuth } from '@/features/auth/components/auth-context'
import { useBhishiData } from '@/features/bhishi/hooks/use-bhishi'
import { ROUTES } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'

export function MemberInstallmentsPage() {
  const auth = useAuth()
  const snapshotQuery = useBhishiData()
  const snapshot = snapshotQuery.data

  const installments = useMemo(() => {
    if (!snapshot || !auth.user) return []
    const member = snapshot.members.find((item) => item.profile_id === auth.user?.id)
    if (!member) return []

    const cycleById = new Map(snapshot.cycles.map((cycle) => [cycle.cycle.id, cycle.cycle]))
    const groupById = new Map(snapshot.groups.map((group) => [group.group.id, group.group]))

    return snapshot.obligations
      .filter((obligation) => obligation.member.id === member.id)
      .map((obligation) => {
        const installment = snapshot.installments.find(
          (item) => item.installment.id === obligation.installmentId,
        )
        const cycle = installment ? cycleById.get(installment.cycleId) : undefined
        const group = cycle ? groupById.get(cycle.group_id) : undefined
        return { obligation, installment, group }
      })
      .filter((item) => item.installment)
      .sort((left, right) =>
        left.installment!.installment.scheduled_date.localeCompare(
          right.installment!.installment.scheduled_date,
        ),
      )
  }, [auth.user, snapshot])

  if (snapshotQuery.isLoading) return <PageLoading />

  return (
    <div className="space-y-5">
      <PageHeader
        title="My Installments"
        description="Your contribution schedule and payment status."
      />

      {snapshotQuery.error ? (
        <Alert variant="error" title="Could not load installments">
          {snapshotQuery.error.message}
        </Alert>
      ) : null}

      <Card>
        <CardContent className="p-4 sm:p-5">
          {installments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No contribution installments are listed because your account currently has no pending
              obligations. If you are the recipient for this cycle's month, you don't contribute —
              the other members pay.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {installments.map(({ obligation, installment, group }) => {
                if (!installment) return null
                return (
                  <li
                    key={obligation.obligation.id}
                    className="flex items-start gap-3 py-4 first:pt-0"
                  >
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                      <CalendarDays className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-secondary">
                          {group?.name ?? 'Savings group'}
                        </p>
                        <Badge variant={obligation.status === 'paid' ? 'success' : 'warning'}>
                          {obligation.status === 'paid' ? 'Paid' : 'Due'}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Installment {installment.installment.installment_number} · Due{' '}
                        {new Date(
                          `${installment.installment.scheduled_date}T00:00:00`,
                        ).toLocaleDateString('en-IN')}
                      </p>
                      {group ? (
                        <Link
                          to={ROUTES.member.groups}
                          className="mt-1 inline-block text-xs font-medium text-primary underline-offset-4 hover:underline"
                        >
                          View group
                        </Link>
                      ) : null}
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-secondary">
                      {formatCurrency(obligation.obligation.expected_amount)}
                    </p>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
