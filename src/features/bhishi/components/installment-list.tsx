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
        const pending = installment.obligations.filter((obligation) => obligation.remaining > 0)
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
                <p className="text-xs text-muted-foreground">Payout</p>
                <p className="mt-0.5 font-medium">
                  {installment.payout
                    ? formatCurrency(installment.payout.amount)
                    : formatCurrency(installment.expectedTotal)}
                </p>
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

            {onRecordPayment || onRecordPayout ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {onRecordPayment && pending.length > 0 ? (
                  <Button
                    size="md"
                    variant="outline"
                    onClick={() => {
                      const first = pending[0]
                      if (first) onRecordPayment(first)
                    }}
                  >
                    Record payment ({pending.length})
                  </Button>
                ) : null}
                {onRecordPayout && !installment.payout ? (
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
