import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { PayoutBadge, StatusBadge } from './status-badge'
import type { CycleView, InstallmentView, ObligationView } from '../types'

interface InstallmentListProps {
  cycle: CycleView
  onRecordPayment?: (obligation: ObligationView) => void
  onRecordPayout?: (installment: InstallmentView) => void
}

export function InstallmentList({ cycle, onRecordPayment, onRecordPayout }: InstallmentListProps) {
  return (
    <div className="space-y-3">
      {cycle.installments.map((installment) => {
        const row = installment.installment
        const chitNumber = installment.recipient
          ? (cycle.members.find((entry) => entry.member.id === installment.recipient?.id)
              ?.cycleMember.chit_number ?? null)
          : null

        return (
          <div key={row.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-secondary">
                  Installment #{row.installment_number}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Due {formatDate(row.scheduled_date)}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <StatusBadge status={installment.status} />
                <PayoutBadge paid={Boolean(installment.payout)} />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Recipient</p>
                <p className="mt-0.5 truncate font-medium">
                  {installment.recipient?.full_name ?? 'Not set'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {chitNumber ? `Chit #${chitNumber}` : 'No chit position'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Expected collection</p>
                <p className="mt-0.5 font-medium">{formatCurrency(installment.expectedTotal)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Collected</p>
                <p className="mt-0.5 font-medium">
                  {formatCurrency(installment.collectedAmount)}{' '}
                  <span className="font-normal text-muted-foreground">
                    / {formatCurrency(installment.expectedTotal)}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Members paid</p>
                <p className="mt-0.5 font-medium">
                  {installment.paidCount} of {installment.obligations.length}
                </p>
              </div>
            </div>
            <div className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-sm">
              {installment.payout ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Actual payout</span>
                  <span className="text-right font-medium">
                    {formatCurrency(installment.payout.amount)} ·{' '}
                    {formatDate(installment.payout.payout_date)}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Payout</span>
                  <span className="font-medium">Pending</span>
                </div>
              )}
            </div>

            <details className="mt-3 rounded-lg border border-border">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-sm">
                <span className="font-medium">Members &amp; status</span>
                <span className="text-xs text-muted-foreground">
                  {installment.paidCount} paid · {installment.pendingCount} pending
                </span>
              </summary>
              <ul className="divide-y divide-border border-t border-border">
                {installment.obligations.map((obligation) => (
                  <li
                    key={obligation.obligation.id}
                    className="flex items-center gap-3 px-3 py-2.5"
                  >
                    <Avatar name={obligation.member.full_name} size="sm" decorative />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{obligation.member.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Paid {formatCurrency(obligation.paidAmount)} of{' '}
                        {formatCurrency(obligation.obligation.expected_amount)} · Outstanding{' '}
                        {formatCurrency(obligation.remaining)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <StatusBadge status={obligation.status} />
                      {onRecordPayment && obligation.remaining > 0 ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onRecordPayment(obligation)}
                        >
                          Record
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </details>

            {onRecordPayout ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {!installment.payout ? (
                  <Button size="md" variant="ghost" onClick={() => onRecordPayout(installment)}>
                    Record payout
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
