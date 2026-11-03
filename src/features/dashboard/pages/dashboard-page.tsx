import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, UsersRound } from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { PageLoading } from '@/components/feedback/page-loading'
import { ROUTES } from '@/lib/constants'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DataError } from '@/features/bhishi/components/data-error'
import { EmptyState } from '@/features/bhishi/components/empty-state'
import { PayoutBadge } from '@/features/bhishi/components/status-badge'
import { useBhishiData } from '@/features/bhishi/hooks/use-bhishi'

const monthFormatter = new Intl.DateTimeFormat('en-IN', {
  month: 'long',
  year: 'numeric',
  timeZone: 'Asia/Kolkata',
})

export function DashboardPage() {
  const query = useBhishiData()
  const [selectedGroupId, setSelectedGroupId] = useState('')

  const activeGroups = useMemo(
    () => query.data?.groups.filter((group) => group.group.status === 'active') ?? [],
    [query.data],
  )

  if (query.isPending) return <PageLoading />
  if (query.isError) {
    return (
      <DataError
        message={query.error instanceof Error ? query.error.message : undefined}
        onRetry={() => void query.refetch()}
      />
    )
  }

  const selectedGroup =
    activeGroups.find((group) => group.group.id === selectedGroupId) ?? activeGroups[0] ?? null
  const cycle = selectedGroup?.activeCycle ?? null
  const installment = cycle?.currentInstallment ?? cycle?.nextInstallment ?? null
  const outstanding =
    installment?.obligations.reduce((total, obligation) => total + obligation.remaining, 0) ?? 0

  return (
    <div className="space-y-5">
      <PageHeader title="Home" description="Your Bhishi at a glance." />

      <Card>
        <CardContent className="flex items-center justify-between gap-3 p-4 sm:p-5">
          <div>
            <p className="text-sm text-muted-foreground">Active Bhishi groups</p>
            <p className="mt-1 text-2xl font-semibold text-secondary">{activeGroups.length}</p>
          </div>
          <UsersRound className="h-6 w-6 text-primary" aria-hidden="true" />
        </CardContent>
      </Card>

      {activeGroups.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No active Bhishi cycle"
          description="Once a group has an active cycle, its current installment and collection details will appear here."
          action={
            <Link
              to={ROUTES.admin.groups}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-medium"
            >
              View groups
            </Link>
          }
        />
      ) : (
        <>
          {activeGroups.length > 1 ? (
            <div className="space-y-1.5">
              <label htmlFor="dashboard-group" className="text-sm font-medium">
                Bhishi group
              </label>
              <Select
                id="dashboard-group"
                value={selectedGroup?.group.id ?? ''}
                onChange={(event) => setSelectedGroupId(event.target.value)}
              >
                {activeGroups.map((group) => (
                  <option key={group.group.id} value={group.group.id}>
                    {group.group.name}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}

          <Card>
            <CardContent className="space-y-4 p-4 sm:p-5">
              <div>
                <h2 className="text-lg font-semibold text-secondary">
                  {selectedGroup?.group.name}
                </h2>
                {cycle ? (
                  <p className="text-sm text-muted-foreground">{cycle.cycle.name}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">No active cycle</p>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 px-3.5 py-3">
                <span className="text-sm text-muted-foreground">Monthly contribution</span>
                <span className="text-lg font-semibold">
                  {formatCurrency(
                    cycle?.cycle.contribution_amount_snapshot ??
                      selectedGroup?.group.contribution_amount ??
                      0,
                  )}
                </span>
              </div>

              {installment ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                        Current installment
                      </p>
                      <h3 className="mt-1 text-lg font-semibold">
                        {monthFormatter.format(
                          new Date(`${installment.installment.scheduled_date}T12:00:00+05:30`),
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Due {formatDate(installment.installment.scheduled_date)}
                      </p>
                    </div>
                    <CalendarDays className="mt-1 h-5 w-5 text-primary" aria-hidden="true" />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-border px-3.5 py-3">
                      <p className="text-sm text-muted-foreground">Contributions received</p>
                      <p className="mt-1 text-xl font-semibold text-success">
                        {formatCurrency(installment.collectedAmount)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border px-3.5 py-3">
                      <p className="text-sm text-muted-foreground">Outstanding contributions</p>
                      <p className="mt-1 text-xl font-semibold text-secondary">
                        {formatCurrency(outstanding)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 rounded-xl bg-muted/60 px-3.5 py-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Scheduled recipient</span>
                      <span className="text-right font-semibold">
                        {installment.recipient?.full_name ?? 'Not set'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Monthly payout</span>
                      <PayoutBadge paid={Boolean(installment.payout)} />
                    </div>
                  </div>
                </>
              ) : (
                <p className="rounded-lg bg-muted px-3 py-3 text-sm text-muted-foreground">
                  The active cycle has no installment schedule yet.
                </p>
              )}
            </CardContent>
          </Card>

          {selectedGroup ? (
            <Link
              to={ROUTES.admin.group(selectedGroup.group.id)}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-medium"
            >
              Open group
            </Link>
          ) : null}
        </>
      )}
    </div>
  )
}
