/** One non-voided payout transaction, positioned on a chart. */
export interface PayoutChartPoint {
  /** Payout row id. */
  id: string
  /** Actual payout date (`yyyy-mm-dd`). */
  date: string
  /** Short axis label, e.g. `12 Oct`. */
  dateLabel: string
  /** Unique category for the x-axis so same-date payouts stay separate points. */
  axisKey: string
  /** Amount received by this payout. */
  amount: number
  /** Total received up to and including this payout. */
  cumulative: number
  groupName: string
  cycleName: string
}

export interface MemberPayoutSeries {
  points: PayoutChartPoint[]
  /** Sum of every non-voided payout received by the member. */
  totalReceived: number
  /** Number of non-voided payout transactions. */
  payoutCount: number
}
