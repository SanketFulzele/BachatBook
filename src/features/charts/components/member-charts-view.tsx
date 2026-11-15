import type { MemberPayoutSeries } from '../types'
import { PayoutSummaryCards } from './payout-summary-cards'
import { CumulativePayoutChart, IndividualPayoutChart } from './payout-charts'

interface MemberChartsViewProps {
  memberName: string
  series: MemberPayoutSeries
}

/** Summary cards plus the two payout line charts for one member. */
export function MemberChartsView({ memberName, series }: MemberChartsViewProps) {
  return (
    <div className="space-y-4 sm:space-y-5">
      <PayoutSummaryCards series={series} />
      <CumulativePayoutChart memberName={memberName} points={series.points} />
      <IndividualPayoutChart memberName={memberName} points={series.points} />
    </div>
  )
}
