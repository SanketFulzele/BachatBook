import { useMemo, useState } from 'react'
import { Wallet } from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageLoading } from '@/components/feedback/page-loading'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DataError } from '@/features/bhishi/components/data-error'
import { InstallmentList } from '@/features/bhishi/components/installment-list'
import { RecordPayoutDialog } from '@/features/bhishi/components/record-payout-dialog'
import { useBhishiData } from '@/features/bhishi/hooks/use-bhishi'
import { groupNameForCycle, payoutOptions } from '@/features/bhishi/lib/derive'
import type { InstallmentView } from '@/features/bhishi/types'

export function PayoutsPage() {
  const query = useBhishiData()
  const [payoutOpen, setPayoutOpen] = useState(false)
  const [initialInstallmentId, setInitialInstallmentId] = useState<string>()

  const options = useMemo(() => (query.data ? payoutOptions(query.data) : []), [query.data])

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
  const cycleIdsWithDuePayout = new Set(options.map((option) => option.installment.cycleId))
  const cycles = snapshot.cycles.filter(
    (cycle) => cycle.cycle.status === 'active' || cycleIdsWithDuePayout.has(cycle.cycle.id),
  )
  const memberById = new Map(snapshot.members.map((member) => [member.id, member]))
  const installmentById = new Map(
    snapshot.installments.map((installment) => [installment.installment.id, installment]),
  )
  const paidOut = snapshot.payouts
    .filter((payout) => !payout.is_voided)
    .reduce((total, payout) => total + Number(payout.amount), 0)
  const recentPayouts = snapshot.payouts.slice(0, 15)

  const openPayout = (installment?: InstallmentView) => {
    setInitialInstallmentId(installment?.installment.id)
    setPayoutOpen(true)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Payouts"
        description="Who receives this month's money, and what has already been paid."
        actions={
          <Button
            size="lg"
            leftIcon={<Wallet className="h-4 w-4" />}
            onClick={() => openPayout()}
            disabled={options.length === 0}
          >
            Record payout
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Payouts due</p>
            <p className="mt-1 text-lg font-semibold text-warning">{options.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total paid out</p>
            <p className="mt-1 text-lg font-semibold text-success">{formatCurrency(paidOut)}</p>
          </CardContent>
        </Card>
      </div>

      {cycles.length === 0 ? (
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">
              Start a cycle to generate monthly payouts.
            </p>
          </CardContent>
        </Card>
      ) : (
        cycles.map((cycle) => (
          <section key={cycle.cycle.id} className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-secondary">{cycle.cycle.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {groupNameForCycle(snapshot, cycle.cycle.id)}
                </p>
              </div>
              <Badge variant={cycle.cycle.status === 'active' ? 'success' : 'neutral'}>
                {cycle.cycle.status}
              </Badge>
            </div>
            <InstallmentList cycle={cycle} onRecordPayout={openPayout} />
          </section>
        ))
      )}

      <Card>
        <CardContent className="p-4 sm:p-5">
          <h2 className="text-base font-semibold text-secondary">Recent payouts</h2>

          {recentPayouts.length === 0 ? (
            <p className="mt-3 rounded-lg bg-muted px-3 py-3 text-sm text-muted-foreground">
              No payouts recorded yet.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {recentPayouts.map((payout) => {
                const member = memberById.get(payout.recipient_member_id)
                const installment = installmentById.get(payout.installment_id)
                return (
                  <li key={payout.id} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {member?.full_name ?? 'Recipient'}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {installment
                          ? `${groupNameForCycle(snapshot, installment.cycleId)} · #${installment.installment.installment_number}`
                          : 'Payout'}{' '}
                        · {formatDate(payout.payout_date)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-success">
                        {formatCurrency(payout.amount)}
                      </p>
                      {payout.is_voided ? <Badge variant="destructive">Voided</Badge> : null}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <RecordPayoutDialog
        open={payoutOpen}
        onOpenChange={setPayoutOpen}
        options={options}
        initialInstallmentId={initialInstallmentId}
      />
    </div>
  )
}
