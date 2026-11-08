import { useMemo, useState } from 'react'
import { HandCoins } from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageLoading } from '@/components/feedback/page-loading'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DataError } from '@/features/bhishi/components/data-error'
import { EmptyState } from '@/features/bhishi/components/empty-state'
import { RecordPaymentDialog } from '@/features/bhishi/components/record-payment-dialog'
import { StatusBadge } from '@/features/bhishi/components/status-badge'
import { VoidPaymentDialog } from '@/features/bhishi/components/void-payment-dialog'
import { useBhishiData } from '@/features/bhishi/hooks/use-bhishi'
import { groupNameForCycle, paymentOptions } from '@/features/bhishi/lib/derive'
import type { PaymentMethod, PaymentOption, PaymentRow } from '@/features/bhishi/types'

const methodLabel: Record<PaymentMethod, string> = {
  cash: 'Cash',
  upi: 'UPI',
  bank_transfer: 'Bank transfer',
  other: 'Other',
}

export function PaymentsPage() {
  const query = useBhishiData()
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [initialObligationId, setInitialObligationId] = useState<string>()
  const [paymentToVoid, setPaymentToVoid] = useState<PaymentRow | null>(null)

  const options = useMemo(() => (query.data ? paymentOptions(query.data) : []), [query.data])

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
  const memberById = new Map(snapshot.members.map((member) => [member.id, member]))
  const installmentById = new Map(
    snapshot.installments.map((installment) => [installment.installment.id, installment]),
  )
  const outstandingTotal = options.reduce((total, option) => total + option.obligation.remaining, 0)
  const paymentHistory = [...snapshot.payments].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  )

  const openPayment = (obligation?: PaymentOption['obligation']) => {
    setInitialObligationId(obligation?.obligation.id)
    setPaymentOpen(true)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Payments"
        description="Money received from members and contributions still pending. Recipients of a payout do not contribute in their own month."
        actions={
          <Button
            size="lg"
            leftIcon={<HandCoins className="h-4 w-4" />}
            onClick={() => openPayment()}
            disabled={options.length === 0}
          >
            Record payment
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Outstanding</p>
            <p className="mt-1 text-lg font-semibold text-destructive">
              {formatCurrency(outstandingTotal)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pending contributions</p>
            <p className="mt-1 text-lg font-semibold">{options.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-5">
          <h2 className="text-base font-semibold text-secondary">Outstanding contributions</h2>

          {options.length === 0 ? (
            <p className="mt-3 rounded-lg bg-success-soft px-3 py-3 text-sm text-success">
              Nothing is pending right now.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {options.map((option) => (
                <li key={option.obligation.obligation.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {option.obligation.member.full_name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {option.groupName} · #{option.installment.installment.installment_number} ·{' '}
                      {formatDate(option.installment.installment.scheduled_date)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Paid {formatCurrency(option.obligation.paidAmount)} of{' '}
                      {formatCurrency(option.obligation.obligation.expected_amount)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <StatusBadge status="pending" />
                    <p className="text-sm font-semibold text-destructive">
                      {formatCurrency(option.obligation.remaining)}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openPayment(option.obligation)}
                    >
                      Record
                    </Button>
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

          {paymentHistory.length === 0 ? (
            <EmptyState
              icon={HandCoins}
              title="No payments yet"
              description="Recorded member payments will appear here."
            />
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {paymentHistory.map((payment) => {
                const member = memberById.get(payment.member_id)
                const installment = installmentById.get(payment.installment_id)
                const recordedBy = snapshot.profiles.find(
                  (profile) => profile.id === payment.recorded_by,
                )
                const voidedBy = snapshot.profiles.find(
                  (profile) => profile.id === payment.voided_by,
                )
                return (
                  <li key={payment.id} className="flex items-start gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {member?.full_name ?? 'Member'}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {installment
                          ? `${groupNameForCycle(snapshot, installment.cycleId)} · #${installment.installment.installment_number}`
                          : 'Payment'}{' '}
                        · {formatDate(payment.payment_date)} · {methodLabel[payment.payment_method]}
                      </p>
                      {payment.reference_number ? (
                        <p className="truncate text-xs text-muted-foreground">
                          Ref {payment.reference_number}
                        </p>
                      ) : null}
                      {payment.notes ? (
                        <p className="truncate text-xs text-muted-foreground">{payment.notes}</p>
                      ) : null}
                      <p className="truncate text-xs text-muted-foreground">
                        Recorded {formatDate(payment.created_at)} by{' '}
                        {recordedBy?.full_name ?? 'Admin'}
                        {payment.is_voided
                          ? ` · Voided ${payment.voided_at ? formatDate(payment.voided_at) : ''}${voidedBy ? ` by ${voidedBy.full_name}` : ''}`
                          : ''}
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
                      {payment.is_voided ? (
                        <Badge variant="destructive">Voided</Badge>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => setPaymentToVoid(payment)}>
                          Void
                        </Button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <RecordPaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        options={options}
        initialObligationId={initialObligationId}
      />
      <VoidPaymentDialog
        payment={paymentToVoid}
        memberName={
          paymentToVoid ? (memberById.get(paymentToVoid.member_id)?.full_name ?? 'Member') : ''
        }
        onClose={() => setPaymentToVoid(null)}
      />
    </div>
  )
}
