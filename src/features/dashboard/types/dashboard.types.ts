export type MetricTone = 'primary' | 'navy' | 'success' | 'warning' | 'destructive'

export interface SummaryMetric {
  id: 'groups' | 'members' | 'cycles' | 'expected' | 'collected' | 'pending'
  label: string
  value: number
  format: 'number' | 'currency'
  helper: string
  trend?: {
    label: string
    direction: 'up' | 'down' | 'neutral'
    tone: 'positive' | 'negative' | 'neutral'
  }
  tone: MetricTone
}

export interface MonthlyCollectionPoint {
  month: string
  collected: number
  expected: number
}

export type TransactionType = 'Contribution' | 'Payout'
export type TransactionStatus = 'Completed' | 'Pending' | 'Failed'

export interface RecentTransaction {
  id: string
  memberName: string
  groupName: string
  type: TransactionType
  amount: number
  date: string
  method: string
  status: TransactionStatus
}

export interface UpcomingCollection {
  id: string
  groupName: string
  date: string
  relativeLabel: string
  memberCount: number
  expectedAmount: number
}

export interface CurrentRecipient {
  name: string
  groupName: string
  cycleNumber: number
  totalCycles: number
  payoutAmount: number
  paidMembers: number
  totalMembers: number
  scheduledDate: string
  scheduledLabel: string
}

export interface DashboardSampleData {
  isSampleData: true
  periodLabel: string
  summary: SummaryMetric[]
  monthlyCollections: MonthlyCollectionPoint[]
  recentTransactions: RecentTransaction[]
  upcomingCollections: UpcomingCollection[]
  currentRecipient: CurrentRecipient
}
