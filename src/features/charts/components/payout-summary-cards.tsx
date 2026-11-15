import { HandCoins, Wallet } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency, formatNumber } from '@/lib/utils'
import type { MemberPayoutSeries } from '../types'

interface PayoutSummaryCardsProps {
  series: MemberPayoutSeries
}

export function PayoutSummaryCards({ series }: PayoutSummaryCardsProps) {
  const payoutLabel = series.payoutCount === 1 ? 'completed payout' : 'completed payouts'

  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
      <Card className="h-full">
        <CardContent className="flex items-start justify-between gap-3 p-4 sm:p-5">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">Total Payout Received</p>
            <p className="mt-1.5 text-2xl font-semibold tracking-tight text-success sm:text-3xl">
              {formatCurrency(series.totalReceived)}
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              All completed payouts · voided payouts excluded
            </p>
          </div>
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success-soft text-success"
          >
            <HandCoins className="h-5 w-5" aria-hidden="true" />
          </span>
        </CardContent>
      </Card>

      <Card className="h-full">
        <CardContent className="flex items-start justify-between gap-3 p-4 sm:p-5">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">Total Payouts</p>
            <p className="mt-1.5 text-2xl font-semibold tracking-tight text-secondary sm:text-3xl">
              {formatNumber(series.payoutCount)}
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {payoutLabel} · voided payouts excluded
            </p>
          </div>
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary"
          >
            <Wallet className="h-5 w-5" aria-hidden="true" />
          </span>
        </CardContent>
      </Card>
    </div>
  )
}
