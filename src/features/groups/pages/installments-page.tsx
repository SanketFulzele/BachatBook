import { CalendarDays } from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { PageLoading } from '@/components/feedback/page-loading'
import { DataError } from '@/features/bhishi/components/data-error'
import { EmptyState } from '@/features/bhishi/components/empty-state'
import { InstallmentList } from '@/features/bhishi/components/installment-list'
import { useBhishiData } from '@/features/bhishi/hooks/use-bhishi'
import { groupNameForCycle } from '@/features/bhishi/lib/derive'

export function InstallmentsPage() {
  const query = useBhishiData()

  if (query.isPending) return <PageLoading />
  if (query.isError) {
    return (
      <DataError
        message={query.error instanceof Error ? query.error.message : undefined}
        onRetry={() => void query.refetch()}
      />
    )
  }

  const snapshot = query.data
  const cycles = snapshot.cycles.filter((cycle) => cycle.cycle.status !== 'draft')

  return (
    <div className="space-y-5">
      <PageHeader
        title="Installments"
        description="Monthly collection schedule and member status."
      />

      {cycles.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No installments yet"
          description="Installments will appear after a cycle is activated."
        />
      ) : (
        cycles.map((cycle) => (
          <section key={cycle.cycle.id} className="space-y-2">
            <Card>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div>
                  <h2 className="text-base font-semibold text-secondary">{cycle.cycle.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {groupNameForCycle(snapshot, cycle.cycle.id)}
                  </p>
                </div>
                <Badge variant={cycle.cycle.status === 'active' ? 'success' : 'neutral'}>
                  {cycle.cycle.status}
                </Badge>
              </CardContent>
            </Card>
            <InstallmentList cycle={cycle} currentProfileId={snapshot.profileId} />
          </section>
        ))
      )}
    </div>
  )
}
