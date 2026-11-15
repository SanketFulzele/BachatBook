import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts'
import { TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate, formatShortDate } from '@/lib/utils'
import { formatAxisCurrency } from '../lib/chart-format'
import type { PayoutChartPoint } from '../types'

type ChartMode = 'cumulative' | 'individual'

interface PayoutTooltipProps extends Partial<TooltipContentProps<number, string>> {
  mode: ChartMode
}

function PayoutTooltip({ active, payload, mode }: PayoutTooltipProps) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload as PayoutChartPoint | undefined
  if (!point) return null

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-elevated">
      <p className="font-medium text-foreground">{formatDate(point.date)}</p>
      {mode === 'individual' ? (
        <p className="mt-0.5 text-muted-foreground">
          {point.groupName} · {point.cycleName}
        </p>
      ) : null}
      <p className="mt-1.5 flex items-baseline gap-2">
        <span className="text-muted-foreground">
          {mode === 'cumulative' ? 'Cumulative' : 'Payout'}
        </span>
        <span className="font-semibold text-success">
          {formatCurrency(mode === 'cumulative' ? point.cumulative : point.amount)}
        </span>
      </p>
    </div>
  )
}

interface PayoutChartCardProps {
  title: string
  description: string
  memberName: string
  points: PayoutChartPoint[]
  mode: ChartMode
  emptyDescription: string
}

function PayoutChartCard({
  title,
  description,
  memberName,
  points,
  mode,
  emptyDescription,
}: PayoutChartCardProps) {
  const dataKey = mode === 'cumulative' ? 'cumulative' : 'amount'
  const chartLabel =
    mode === 'cumulative'
      ? `Cumulative payout line chart for ${memberName}`
      : `Individual payout line chart for ${memberName}`

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {points.length === 0 ? (
          <div className="flex h-56 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-4 text-center sm:h-64">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-soft text-success"
            >
              <TrendingUp className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-3 text-sm font-medium text-secondary">No payouts recorded yet</p>
            <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
              {emptyDescription}
            </p>
          </div>
        ) : (
          <div role="img" aria-label={chartLabel} className="h-64 w-full sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="axisKey"
                  tickFormatter={(value) => formatShortDate(String(value).slice(0, 10))}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickMargin={8}
                  minTickGap={26}
                  interval="preserveStartEnd"
                  padding={{ left: 6, right: 6 }}
                />
                <YAxis
                  width={64}
                  domain={[0, 'auto']}
                  tickFormatter={formatAxisCurrency}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                />
                <Tooltip
                  content={<PayoutTooltip mode={mode} />}
                  cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
                />
                <Line
                  type="linear"
                  dataKey={dataKey}
                  name={mode === 'cumulative' ? 'Cumulative payout' : 'Payout'}
                  stroke="hsl(var(--success))"
                  strokeWidth={2}
                  dot={{
                    r: 3.5,
                    strokeWidth: 2,
                    fill: 'hsl(var(--card))',
                    stroke: 'hsl(var(--success))',
                  }}
                  activeDot={{ r: 5, strokeWidth: 2, fill: 'hsl(var(--card))' }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface PayoutChartsProps {
  memberName: string
  points: PayoutChartPoint[]
}

export function CumulativePayoutChart({ memberName, points }: PayoutChartsProps) {
  return (
    <PayoutChartCard
      title="Cumulative Payout"
      description="Total money received by the selected member over time."
      memberName={memberName}
      points={points}
      mode="cumulative"
      emptyDescription={`${memberName}'s cumulative payout will build up here after the first completed payout.`}
    />
  )
}

export function IndividualPayoutChart({ memberName, points }: PayoutChartsProps) {
  return (
    <PayoutChartCard
      title="Individual Payout"
      description="Amount received by the selected member for each payout."
      memberName={memberName}
      points={points}
      mode="individual"
      emptyDescription={`Each payout received by ${memberName} will appear here on its actual payout date.`}
    />
  )
}
