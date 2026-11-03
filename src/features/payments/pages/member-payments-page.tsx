import { useMemo } from 'react'
import { CreditCard } from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { PageLoading } from '@/components/feedback/page-loading'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DataError } from '@/features/bhishi/components/data-error'
import { EmptyState } from '@/features/bhishi/components/empty-state'
import { StatusBadge } from '@/features/bhishi/components/status-badge'
import { useBhishiData } from '@/features/bhishi/hooks/use-bhishi'
import { groupNameForCycle, membersForProfile } from '@/features/bhishi/lib/derive'
import type { PaymentMethod } from '@/features/bhishi/types'

const methodLabel: Record<PaymentMethod, string> = {
  cash: 'Cash',
  upi: 'UPI',
  bank_transfer: 'Bank transfer',
  other: 'Other',
}

export function MemberPaymentsPage() {
  const query = useBhishiData()

  const derived = useMemo(() => {
    if (!query.data) return null
    const snapshot = query.data
    const myMembers = membersForProfile(snapshot, snapshot.profileId)
    const ownIds = new Set(myMembers.map((member) => member.id))

    const rows = snapshot.installments
      .flatMap((installment) =>
        installment.obligations
          .filter((obligation) => ownIds.has(obligation.member.id))
          .map((obligation) => ({ installment, obligation })),
      )
      .sort((a, b) =>
        b.installment.installment.scheduled_date.localeCompare(
          a.installment.installment.scheduled_date,
        ),
      )

    const pendingRows = [...rows]
      .filter((row) => row.obligation.remaining > 0)
      .sort((a, b) =>
        a.installment.installment.scheduled_date.localeCompare(
          b.installment.installment.scheduled_date,
        ),
      )

    const scheduleRows = [...rows].sort((a, b) =>
      a.installment.installment.scheduled_date.localeCompare(
        b.installment.installment.scheduled_date,
      ),
    )

    const myPayments = snapshot.payments
      .filter((payment) => ownIds.has(payment.member_id))
      .sort((a, b) => b.payment_date.localeCompare(a.payment_date))

    return {
      snapshot,
      hasLinkedMember: myMembers.length > 0,
      rows,
      scheduleRows,
      pendingRows,
      payments: myPayments,
      pendingTotal: pendingRows.reduce((total, row) => total + row.obligation.remaining, 0),
      paidTotal: rows.reduce((total, row) => total + row.obligation.paidAmount, 0),
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

  const { snapshot, hasLinkedMember, scheduleRows, payments, pendingTotal, paidTotal } = derived

  if (!hasLinkedMember) {
    return (
      <div className="space-y-5">
        <PageHeader title="My Payments" />
        <EmptyState
          icon={CreditCard}
          title="No payments to show yet"
          description="Your login is not linked to a member record. Ask your group admin to link it, then your monthly contributions will appear here."
        />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="My Payments"
        description="What you have paid, and what is still pending."
      />

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="mt-1 text-lg font-semibold text-destructive">
              {formatCurrency(pendingTotal)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Paid so far</p>
            <p className="mt-1 text-lg font-semibold text-success">{formatCurrency(paidTotal)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-5">
          <h2 className="text-base font-semibold text-secondary">Monthly installments</h2>
          {scheduleRows.length === 0 ? (
            <p className="mt-3 rounded-lg bg-muted px-3 py-3 text-sm text-muted-foreground">
              Your installment plan will appear once your admin activates the cycle.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {scheduleRows.map(({ installment, obligation }) => {
                const position = snapshot.cycles
                  .find((cycle) => cycle.cycle.id === installment.cycleId)
                  ?.members.find((member) => member.member.id === installment.recipient?.id)
                  ?.cycleMember.chit_number
                return (
                  <li key={obligation.obligation.id} className="space-y-1.5 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          #{installment.installment.installment_number} ·{' '}
                          {groupNameForCycle(snapshot, installment.cycleId)}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          Due {formatDate(installment.installment.scheduled_date)} · Recipient{' '}
                          {installment.recipient?.full_name ?? 'Not set'}
                          {position ? ` (Chit #${position})` : ''}
                        </p>
                      </div>
                      <StatusBadge status={obligation.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p>
                        <span className="text-muted-foreground">Expected </span>
                        {formatCurrency(obligation.obligation.expected_amount)}
                      </p>
                      <p className="text-right">
                        <span className="text-muted-foreground">Paid </span>
                        {formatCurrency(obligation.paidAmount)}
                      </p>
                      <p className="col-span-2 text-right">
                        <span className="text-muted-foreground">Outstanding </span>
                        <span
                          className={
                            obligation.remaining > 0
                              ? 'font-semibold text-destructive'
                              : 'font-semibold text-success'
                          }
                        >
                          {formatCurrency(obligation.remaining)}
                        </span>
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 sm:p-5">
          <h2 className="text-base font-semibold text-secondary">Payment history</h2>
          {payments.length === 0 ? (
            <p className="mt-3 rounded-lg bg-muted px-3 py-3 text-sm text-muted-foreground">
              No payments recorded yet. Payments appear here after your admin records them.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {payments.map((payment) => {
                const installment = snapshot.installments.find(
                  (entry) => entry.installment.id === payment.installment_id,
                )
                return (
                  <li key={payment.id} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {installment
                          ? `Installment #${installment.installment.installment_number} · ${groupNameForCycle(snapshot, installment.cycleId)}`
                          : 'Payment'}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {formatDate(payment.payment_date)} · {methodLabel[payment.payment_method]}
                        {payment.reference_number ? ` · ${payment.reference_number}` : ''}
                      </p>
                      {payment.is_voided && payment.correction_reason ? (
                        <p className="text-xs text-destructive">
                          Void reason: {payment.correction_reason}
                        </p>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        className={
                          payment.is_voided
                            ? 'text-sm font-semibold text-muted-foreground line-through'
                            : 'text-sm font-semibold text-success'
                        }
                      >
                        {formatCurrency(payment.amount)}
                      </p>
                      {payment.is_voided ? <Badge variant="destructive">Voided</Badge> : null}
                    </div>
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
