import { formatShortDate } from '@/lib/utils'
import type { MemberLedger } from '@/features/members/types'
import type { MemberPayoutSeries, PayoutChartPoint } from '../types'

function toCents(value: number): number {
  return Math.round(value * 100)
}

function toAmount(cents: number): number {
  return Math.round(cents) / 100
}

/**
 * Derives payout charts from the already-computed member ledger so the figures
 * stay identical to the Member Financial Ledger.
 *
 * Only `payout` transactions are used: the ledger marks every voided payout as
 * `payout-voided`, and contribution payments never carry a payout type. Each
 * ledger transaction is one payout row, so two payouts on the same date remain
 * two separate points.
 */
export function computeMemberPayoutSeries(ledger: MemberLedger): MemberPayoutSeries {
  const payouts = ledger.transactions
    .filter((transaction) => transaction.type === 'payout')
    .sort((a, b) => a.dateIso.localeCompare(b.dateIso) || a.id.localeCompare(b.id))

  let cumulativeCents = 0
  const points: PayoutChartPoint[] = payouts.map((transaction, index) => {
    const amountCents = toCents(transaction.amount)
    cumulativeCents += amountCents
    const date = transaction.dateIso.slice(0, 10)

    return {
      id: transaction.id,
      date,
      dateLabel: formatShortDate(date),
      axisKey: `${date}#${index}`,
      amount: toAmount(amountCents),
      cumulative: toAmount(cumulativeCents),
      groupName: transaction.groupName,
      cycleName: transaction.cycleName,
    }
  })

  return {
    points,
    totalReceived: ledger.payoutReceived,
    payoutCount: points.length,
  }
}
