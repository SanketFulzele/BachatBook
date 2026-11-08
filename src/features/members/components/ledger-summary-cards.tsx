import { formatCurrency } from '@/lib/utils'
import type { MemberLedger } from '../types'

interface LedgerSummaryCardsProps {
  ledger: MemberLedger
}

export function LedgerSummaryCards({ ledger }: LedgerSummaryCardsProps) {
  const items: {
    label: string
    amount: number
    tone: 'default' | 'success' | 'warning' | 'accent'
  }[] = [
    { label: 'Total Contribution', amount: ledger.expected, tone: 'default' },
    { label: 'Total Paid', amount: ledger.paid, tone: 'success' },
    { label: 'Pending Amount', amount: ledger.pending, tone: 'warning' },
    { label: 'Payout Received', amount: ledger.payoutReceived, tone: 'accent' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-border bg-card p-3.5 text-sm shadow-card sm:p-4"
        >
          <p className="text-xs text-muted-foreground">{item.label}</p>
          <p
            className={[
              'mt-1 font-semibold',
              item.tone === 'success'
                ? 'text-success'
                : item.tone === 'warning'
                  ? 'text-warning'
                  : 'text-secondary',
            ].join(' ')}
          >
            {formatCurrency(item.amount)}
          </p>
        </div>
      ))}
    </div>
  )
}
