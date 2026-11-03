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

    const myPayments = snapshot.payments
      .filter((payment) => ownIds.has(payment.member_id))
      .sort((a, b) => b.payment_date.localeCompare(a.payment_date))

    return {
      snapshot,
      hasLinkedMember: myMembers.length > 0,
      rows,
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

  const { snapshot, hasLinkedMember, rows, pendingRows, payments, pendingTotal, paidTotal } =
    derived

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
          <h2 className="text-base font-semibold text-secondary">Pending contributions</h2>
          {pendingRows.length === 0 ? (
            <p className="mt-3 rounded-lg bg-success-soft px-3 py-3 text-sm text-success">
              Nothing pending. You are all caught up.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {pendingRows.map(({ installment, obligation }) => (
                <li key={obligation.obligation.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      Installment #{installment.installment.installment_number} ·{' '}
                      {groupNameForCycle(snapshot, installment.cycleId)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      Due {formatDate(installment.installment.scheduled_date)} · Paid{' '}
                      {formatCurrency(obligation.paidAmount)} of{' '}
                      {formatCurrency(obligation.obligation.expected_amount)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-destructive">
                      {formatCurrency(obligation.remaining)}
                    </p>
                    <StatusBadge status={obligation.status} />
                  </div>
                </li>
              ))}
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

      {rows.length === 0 ? (
        <p className="rounded-xl border border-border bg-card px-4 py-4 text-sm text-muted-foreground">
          Your installment plan will appear once your admin starts the cycle.
        </p>
      ) : null}
    </div>
  )
}
