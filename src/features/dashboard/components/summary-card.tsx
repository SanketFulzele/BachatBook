import {
  ArrowDownRight,
  ArrowUpRight,
  Clock3,
  Minus,
  RefreshCw,
  Target,
  UserRound,
  UsersRound,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import type { MetricTone, SummaryMetric } from '@/features/dashboard/types/dashboard.types'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { cn } from '@/lib/utils'

const metricIcons: Record<SummaryMetric['id'], LucideIcon> = {
  groups: UsersRound,
  members: UserRound,
  cycles: RefreshCw,
  expected: Target,
  collected: Wallet,
  pending: Clock3,
}

const toneClasses: Record<MetricTone, string> = {
  primary: 'bg-primary-soft text-primary',
  navy: 'bg-secondary-soft text-secondary',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning-foreground',
  destructive: 'bg-destructive-soft text-destructive',
}

const trendToneClasses = {
  positive: 'text-success',
  negative: 'text-warning',
  neutral: 'text-muted-foreground',
} as const

export function SummaryCard({ metric }: { metric: SummaryMetric }) {
  const Icon = metricIcons[metric.id]
  const TrendIcon =
    metric.trend?.direction === 'up'
      ? ArrowUpRight
      : metric.trend?.direction === 'down'
        ? ArrowDownRight
        : Minus

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
            toneClasses[metric.tone],
          )}
        >
          <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
      </div>

      <p className="mt-2.5 text-[26px] font-bold leading-none tracking-tight text-secondary">
        {metric.format === 'currency' ? formatCurrency(metric.value) : formatNumber(metric.value)}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        {metric.trend ? (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 font-semibold',
              trendToneClasses[metric.trend.tone],
            )}
          >
            <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {metric.trend.label}
          </span>
        ) : null}
        <span className="text-muted-foreground">{metric.helper}</span>
      </div>
    </Card>
  )
}

export function SummaryCardGrid({ metrics }: { metrics: SummaryMetric[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {metrics.map((metric) => (
        <SummaryCard key={metric.id} metric={metric} />
      ))}
    </div>
  )
}
