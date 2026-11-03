import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { MonthlyCollectionPoint } from '@/features/dashboard/types/dashboard.types'
import { formatCurrency } from '@/lib/utils'

export function CollectionChart({ data }: { data: MonthlyCollectionPoint[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Monthly collection overview</CardTitle>
            <CardDescription>Collected amount against the monthly target.</CardDescription>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
              Collected
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-0.5 w-4 rounded-full border-t-2 border-dashed border-secondary/50"
                aria-hidden="true"
              />
              Expected
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[270px] w-full sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="bachat-book-collected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                dy={8}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={42}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}
              />
              <Tooltip
                cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 12,
                  boxShadow: '0 12px 32px -12px rgb(15 23 42 / 0.22)',
                  fontSize: 12,
                }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600, marginBottom: 4 }}
                formatter={(value) => formatCurrency(Number(value))}
              />
              <Area
                type="monotone"
                dataKey="collected"
                name="Collected"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                fill="url(#bachat-book-collected)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, fill: 'hsl(var(--card))' }}
              />
              <Line
                type="monotone"
                dataKey="expected"
                name="Expected"
                stroke="hsl(var(--secondary))"
                strokeOpacity={0.45}
                strokeWidth={1.5}
                strokeDasharray="5 5"
                dot={false}
                activeDot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-muted-foreground/70">
          Figures show total contributions across all sample groups. Chart data is static.
        </p>
      </CardContent>
    </Card>
  )
}
