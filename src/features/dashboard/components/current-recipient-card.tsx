import { CalendarDays, CircleDollarSign } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { CurrentRecipient } from '@/features/dashboard/types/dashboard.types'
import { formatCurrency } from '@/lib/utils'

export function CurrentRecipientCard({ recipient }: { recipient: CurrentRecipient }) {
  const progress = Math.round((recipient.paidMembers / recipient.totalMembers) * 100)

  return (
    <Card className="relative overflow-hidden border-secondary bg-secondary text-white">
      <div
        className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full border border-white/[0.07]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-28 -left-16 h-56 w-56 rounded-full border border-white/[0.07]"
        aria-hidden="true"
      />

      <div className="relative p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/50">
              Current recipient
            </p>
            <p className="mt-1 text-sm text-white/70">{recipient.groupName}</p>
          </div>
          <Badge className="border border-white/10 bg-white/[0.07] text-white/80">
            Cycle {recipient.cycleNumber} / {recipient.totalCycles}
          </Badge>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Avatar name={recipient.name} size="lg" className="bg-white/10 text-white" decorative />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-white">{recipient.name}</p>
            <p className="text-xs text-white/50">Next payout recipient</p>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-xs text-white/50">Payout amount</p>
          <p className="mt-1 text-[30px] font-bold leading-none tracking-tight">
            {formatCurrency(recipient.payoutAmount)}
          </p>
        </div>

        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/60">Contributions received</span>
            <span className="font-semibold text-white">{progress}%</span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-label="Contributions received for current payout"
          >
            <div
              className="h-full rounded-full bg-primary-soft transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-white/50">
            {recipient.paidMembers} of {recipient.totalMembers} members paid
          </p>
        </div>

        <div className="mt-6 flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2.5">
          <CalendarDays className="h-4 w-4 text-primary-soft" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-white/45">Scheduled payout</p>
            <p className="truncate text-xs font-medium text-white/85">{recipient.scheduledLabel}</p>
          </div>
          <CircleDollarSign className="h-4 w-4 text-white/30" aria-hidden="true" />
        </div>

        <p className="mt-4 text-[10px] leading-4 text-white/30">
          Sample data only. No payout will be processed in Sprint 1.
        </p>
      </div>
    </Card>
  )
}
