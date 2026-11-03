import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, HandCoins, Plus, UsersRound, Wallet } from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { Card, CardContent } from '@/components/ui/card'
import { PageLoading } from '@/components/feedback/page-loading'
import { useAuth } from '@/features/auth/components/auth-context'
import { ROUTES } from '@/lib/constants'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DataError } from '@/features/bhishi/components/data-error'
import { EmptyState } from '@/features/bhishi/components/empty-state'
import { GroupCard } from '@/features/bhishi/components/group-card'
import { PayoutBadge, StatusBadge } from '@/features/bhishi/components/status-badge'
import { CreateGroupDialog } from '@/features/bhishi/components/create-group-dialog'
import { RecordPaymentDialog } from '@/features/bhishi/components/record-payment-dialog'
import { RecordPayoutDialog } from '@/features/bhishi/components/record-payout-dialog'
import { useBhishiData } from '@/features/bhishi/hooks/use-bhishi'
import { currentCycle, paymentOptions, payoutOptions } from '@/features/bhishi/lib/derive'
import type { ObligationView, PayoutOption } from '@/features/bhishi/types'

export function DashboardPage() {
  const auth = useAuthSafeName()
  const query = useBhishiData()
  const [createOpen, setCreateOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [payoutOpen, setPayoutOpen] = useState(false)
  const [initialObligationId, setInitialObligationId] = useState<string>()
  const [initialInstallmentId, setInitialInstallmentId] = useState<string>()

  const options = useMemo(() => (query.data ? paymentOptions(query.data) : []), [query.data])
  const payoutChoices = useMemo(() => (query.data ? payoutOptions(query.data) : []), [query.data])

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
  const groups = snapshot.groups
  const activeGroups = groups.filter((group) => group.group.status === 'active')
  const primaryGroup = activeGroups[0] ?? groups[0]
  const cycle = primaryGroup ? currentCycle(primaryGroup) : null
  const installment = cycle?.currentInstallment ?? cycle?.nextInstallment ?? null
  const activeInstallments = activeGroups.flatMap((group) => group.activeCycle?.installments ?? [])
  const collected = activeInstallments.reduce((total, entry) => total + entry.collectedAmount, 0)
  const expected = activeInstallments.reduce((total, entry) => total + entry.expectedTotal, 0)
  const pendingTotal = options.reduce((total, option) => total + option.obligation.remaining, 0)
  const pendingPreview = options.slice(0, 5)

  const openPayment = (obligation?: ObligationView) => {
    setInitialObligationId(obligation?.obligation.id)
    setPaymentOpen(true)
  }

  const openPayout = (option?: PayoutOption) => {
    setInitialInstallmentId(option?.installment.installment.id)
    setPayoutOpen(true)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Namaste, ${auth.firstName}`}
        description="A simple view of your family Bhishi."
        actions={
          <Button
            size="lg"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setCreateOpen(true)}
          >
            New group
          </Button>
        }
      />

      {groups.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="Start your first Bhishi"
          description="Create a group, add your family members and start the monthly cycle. It only takes a minute."
          action={
            <Button
              size="lg"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setCreateOpen(true)}
            >
              Create group
            </Button>
          }
        />
      ) : (
        <>
          {primaryGroup ? (
            <GroupCard
              group={primaryGroup}
              href={ROUTES.admin.group(primaryGroup.group.id)}
              showDraft
            />
          ) : null}

          <Card>
            <CardContent className="space-y-4 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    This month
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-secondary">
                    {installment
                      ? `Installment #${installment.installment.installment_number}`
                      : 'No cycle yet'}
                  </h2>
                  {installment ? (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Due {formatDate(installment.installment.scheduled_date)}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Add members, then start the cycle.
                    </p>
                  )}
                </div>
                {installment ? <StatusBadge status={installment.status} /> : null}
              </div>

              {installment ? (
                <>
                  <div className="rounded-xl bg-muted/60 px-3.5 py-3">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="inline-flex items-center gap-2 text-muted-foreground">
                        <Wallet className="h-4 w-4" aria-hidden="true" />
                        Payout recipient
                      </span>
                      <span className="font-semibold">
                        {installment.recipient?.full_name ?? 'Not set'}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">Group contribution</span>
                      <span className="font-semibold">
                        {formatCurrency(installment.expectedTotal)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">Payout</span>
                      <PayoutBadge paid={Boolean(installment.payout)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border px-3.5 py-3">
                      <p className="text-xs text-muted-foreground">Collected</p>
                      <p className="mt-1 text-lg font-semibold text-success">
                        {formatCurrency(collected)}
                      </p>
                      <p className="text-xs text-muted-foreground">of {formatCurrency(expected)}</p>
                    </div>
                    <div className="rounded-xl border border-border px-3.5 py-3">
                      <p className="text-xs text-muted-foreground">Pending</p>
                      <p className="mt-1 text-lg font-semibold text-destructive">
                        {formatCurrency(pendingTotal)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {options.length} contribution{options.length === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="lg"
                      className="flex-1"
                      leftIcon={<HandCoins className="h-4 w-4" />}
                      onClick={() => openPayment()}
                      disabled={options.length === 0}
                    >
                      Record payment
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="flex-1"
                      leftIcon={<Wallet className="h-4 w-4" />}
                      onClick={() => openPayout()}
                      disabled={payoutChoices.length === 0}
                    >
                      Record payout
                    </Button>
                  </div>
                </>
              ) : (
                <Link
                  to={
                    primaryGroup ? ROUTES.admin.group(primaryGroup.group.id) : ROUTES.admin.groups
                  }
                  className={buttonVariants({
                    variant: 'outline',
                    size: 'lg',
                    className: 'w-full',
                  })}
                >
                  <UsersRound className="h-4 w-4" aria-hidden="true" />
                  Open a group to start the cycle
                </Link>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-secondary">Pending payments</h2>
                <Link
                  to={ROUTES.admin.payments}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary"
                >
                  All payments
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>

              {pendingPreview.length === 0 ? (
                <p className="mt-3 rounded-lg bg-success-soft px-3 py-3 text-sm text-success">
                  Everything is collected. Well done.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-border">
                  {pendingPreview.map((option) => (
                    <li
                      key={option.obligation.obligation.id}
                      className="flex items-center gap-3 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {option.obligation.member.full_name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {option.groupName} · #{option.installment.installment.installment_number}{' '}
                          · {formatDate(option.installment.installment.scheduled_date)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-destructive">
                          {formatCurrency(option.obligation.remaining)}
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openPayment(option.obligation)}
                        >
                          Record
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2">
            <Link
              to={ROUTES.admin.groups}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium"
            >
              <UsersRound className="h-4 w-4" aria-hidden="true" />
              Groups
            </Link>
            <Link
              to={ROUTES.admin.payouts}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium"
            >
              <Wallet className="h-4 w-4" aria-hidden="true" />
              Payouts
            </Link>
          </div>
        </>
      )}

      <CreateGroupDialog open={createOpen} onOpenChange={setCreateOpen} />
      <RecordPaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        options={options}
        initialObligationId={initialObligationId}
      />
      <RecordPayoutDialog
        open={payoutOpen}
        onOpenChange={setPayoutOpen}
        options={payoutChoices}
        initialInstallmentId={initialInstallmentId}
      />
    </div>
  )
}

/** Local helper keeps the page readable while the auth user is required. */
function useAuthSafeName() {
  const auth = useAuth()
  const fullName = auth.user?.fullName ?? ''
  const firstName = fullName.trim().split(/\s+/)[0] || 'there'
  return { firstName }
}
