import { ArrowRight, CalendarDays, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { UpcomingCollection } from '@/features/dashboard/types/dashboard.types'
import { ROUTES } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'

function DateTile({ date }: { date: string }) {
  const parsed = new Date(date)
  const day = new Intl.DateTimeFormat('en-GB', { day: '2-digit' }).format(parsed)
  const month = new Intl.DateTimeFormat('en-GB', { month: 'short' }).format(parsed)

  return (
    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg border border-border bg-muted/40">
      <span className="text-sm font-bold leading-none text-secondary">{day}</span>
      <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {month}
      </span>
    </div>
  )
}

export function UpcomingCollections({ collections }: { collections: UpcomingCollection[] }) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle>Upcoming collections</CardTitle>
          <CardDescription>The next scheduled contribution dates.</CardDescription>
        </div>
        <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ul className="divide-y divide-border/80">
          {collections.map((collection) => (
            <li key={collection.id} className="flex items-center gap-3 px-5 py-3.5 sm:px-6">
              <DateTile date={collection.date} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {collection.groupName}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <UsersRound className="h-3 w-3" aria-hidden="true" />
                  {collection.memberCount} members
                  <span aria-hidden="true">·</span>
                  {collection.relativeLabel}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                {formatCurrency(collection.expectedAmount)}
              </p>
            </li>
          ))}
        </ul>
      </CardContent>
      <div className="border-t border-border p-4 sm:px-6">
        <Link to={ROUTES.admin.collections} className="block">
          <Button variant="outline" size="sm" className="w-full">
            View collection schedule
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </Link>
      </div>
    </Card>
  )
}
