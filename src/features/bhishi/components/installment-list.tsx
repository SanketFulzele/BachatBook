import { CalendarDays, Gift } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { PayoutBadge, StatusBadge } from './status-badge'
import type { CycleView, InstallmentView, ObligationView } from '../types'

interface InstallmentListProps {
  cycle: CycleView
  currentProfileId?: string
  onRecordPayment?: (obligation: ObligationView) => void
  onRecordPayout?: (installment: InstallmentView) => void
}

function currentCalendarMonth(): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(new Date())

  return {
    year: Number(parts.find((part) => part.type === 'year')?.value),
    month: Number(parts.find((part) => part.type === 'month')?.value),
  }
}

function isInCurrentMonth(scheduledDate: string, currentMonth: { year: number; month: number }) {
  const dueDate = new Date(`${scheduledDate.slice(0, 10)}T00:00:00Z`)
  return (
    !Number.isNaN(dueDate.getTime()) &&
    dueDate.getUTCFullYear() === currentMonth.year &&
    dueDate.getUTCMonth() + 1 === currentMonth.month
  )
}

export function InstallmentList({
  cycle,
  currentProfileId,
  onRecordPayment,
  onRecordPayout,
}: InstallmentListProps) {
  const currentMonth = currentCalendarMonth()

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full border border-emerald-300 bg-emerald-100" />
          Current month
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full border border-violet-300 bg-violet-100" />
          Your payout turn
        </span>
      </div>
      {cycle.installments.map((installment) => {
        const row = installment.installment
        const chitNumber = installment.recipient
          ? (cycle.members.find((entry) => entry.member.id === installment.recipient?.id)
              ?.cycleMember.chit_number ?? null)
          : null
        const isCurrentMonth = isInCurrentMonth(row.scheduled_date, currentMonth)
        const isPersonalRecipient =
          Boolean(currentProfileId) && installment.recipient?.profile_id === currentProfileId
        const isPersonalUpcoming = isPersonalRecipient && !installment.isPast && !installment.payout
        const hasBothHighlights = isCurrentMonth && isPersonalUpcoming
        const cardStyle = hasBothHighlights
          ? 'border-emerald-200 bg-emerald-50/60'
          : isPersonalUpcoming
            ? 'border-violet-200 bg-violet-50/60'
            : isCurrentMonth
              ? 'border-emerald-200 bg-emerald-50/60'
              : 'border-border bg-card'
        const iconStyle =
          isPersonalUpcoming && !isCurrentMonth
            ? 'bg-violet-100 text-violet-700'
            : isCurrentMonth
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-muted text-muted-foreground'

        return (
          <div
            key={row.id}
            className={`rounded-xl border p-4 shadow-card ${
              hasBothHighlights ? 'border-l-4 border-l-violet-400' : ''
            } ${cardStyle}`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconStyle}`}
                >
                  <CalendarDays className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p
                    className={`text-sm font-semibold ${
                      isCurrentMonth ? 'text-emerald-900' : 'text-secondary'
                    }`}
                  >
                    Installment #{row.installment_number}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Due {formatDate(row.scheduled_date)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                {isCurrentMonth ? (
                  <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
                    Current month
                  </span>
                ) : null}
                {isPersonalUpcoming ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-100 px-2.5 py-1 text-[11px] font-semibold text-violet-800">
                    <Gift className="h-3 w-3" aria-hidden="true" />
                    Your payout turn
                  </span>
                ) : null}
                {!isCurrentMonth && !isPersonalUpcoming && !installment.isPast ? (
                  <span className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                    Upcoming installment
                  </span>
                ) : null}
                <StatusBadge status={installment.status} />
                <PayoutBadge paid={Boolean(installment.payout)} />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 text-sm sm:grid-cols-4">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Recipient</p>
                <p className="mt-0.5 truncate font-medium">
                  {installment.recipient?.full_name ?? 'Not set'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {chitNumber ? `Chit #${chitNumber}` : 'No chit position'}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Does not contribute this cycle
                </p>
              </div>
              <div className="sm:text-right">
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
              <div className="sm:text-right">
                <p className="text-xs text-muted-foreground">Members paid / pending</p>
                <p className="mt-0.5 font-medium">
                  {installment.paidCount} paid · {installment.pendingCount} pending
                </p>
              </div>
            </div>
            <div className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-sm">
              {isPersonalRecipient && installment.payout ? (
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="font-medium text-violet-800">Your payout completed</span>
                  <span className="text-right font-medium">
                    {formatCurrency(installment.payout.amount)} ·{' '}
                    {formatDate(installment.payout.payout_date)}
                  </span>
                </div>
              ) : installment.payout ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Actual payout</span>
                  <span className="text-right font-medium">
                    {formatCurrency(installment.payout.amount)} ·{' '}
                    {formatDate(installment.payout.payout_date)}
                  </span>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="text-muted-foreground">Payout pending</span>
                  <span className="font-medium">
                    Expected {formatCurrency(installment.expectedTotal)}
                  </span>
                </div>
              )}
            </div>
            {isPersonalUpcoming ? (
              <p className="mt-3 flex items-start gap-2 rounded-lg border border-violet-200 bg-violet-100/70 px-3 py-2.5 text-sm font-medium text-violet-900">
                <Gift className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  You will receive{' '}
                  {formatCurrency(installment.payout?.amount ?? installment.expectedTotal)} in this
                  cycle.
                </span>
              </p>
            ) : null}

            <details className="mt-3 rounded-lg border border-border">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-sm">
                <span className="font-medium">Members &amp; status</span>
                <span className="text-xs text-muted-foreground">
                  {installment.paidCount} paid · {installment.pendingCount} pending
                </span>
              </summary>
              <ul className="divide-y divide-border border-t border-border">
                {installment.recipient ? (
                  <li className="flex items-center gap-3 px-3 py-2.5">
                    <Avatar name={installment.recipient.full_name} size="sm" decorative />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {installment.recipient.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Recipient — does not contribute this cycle
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      Recipient
                    </span>
                  </li>
                ) : null}
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
