import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, HandCoins, Link2, Plus, UsersRound, Wallet } from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { Card, CardContent } from '@/components/ui/card'
import { PageLoading } from '@/components/feedback/page-loading'
import { ROUTES } from '@/lib/constants'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ActivateCycleDialog } from '@/features/bhishi/components/activate-cycle-dialog'
import { AddMemberDialog } from '@/features/bhishi/components/add-member-dialog'
import { ChitOrderEditor } from '@/features/bhishi/components/chit-order-editor'
import { CreateCycleDialog } from '@/features/bhishi/components/create-cycle-dialog'
import { DataError } from '@/features/bhishi/components/data-error'
import { EmptyState } from '@/features/bhishi/components/empty-state'
import { InstallmentList } from '@/features/bhishi/components/installment-list'
import { LinkLoginDialog } from '@/features/bhishi/components/link-login-dialog'
import { MemberList } from '@/features/bhishi/components/member-list'
import { RecordPaymentDialog } from '@/features/bhishi/components/record-payment-dialog'
import { RecordPayoutDialog } from '@/features/bhishi/components/record-payout-dialog'
import { useBhishiData } from '@/features/bhishi/hooks/use-bhishi'
import { cycleProgress, paymentOptions, payoutOptions } from '@/features/bhishi/lib/derive'
import type { InstallmentView, MemberRow, ObligationView } from '@/features/bhishi/types'

const groupStatusLabel = {
  draft: { label: 'Not started', variant: 'warning' as const },
  active: { label: 'Active', variant: 'success' as const },
  completed: { label: 'Completed', variant: 'neutral' as const },
  archived: { label: 'Archived', variant: 'outline' as const },
}

export function GroupDetailPage() {
  const { groupId = '' } = useParams()
  const query = useBhishiData()
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [createCycleOpen, setCreateCycleOpen] = useState(false)
  const [activateCycleOpen, setActivateCycleOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [payoutOpen, setPayoutOpen] = useState(false)
  const [linkMember, setLinkMember] = useState<MemberRow | null>(null)
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
  const group = snapshot.groups.find((entry) => entry.group.id === groupId)

  if (!group) {
    return (
      <div className="space-y-5">
        <EmptyState
          icon={UsersRound}
          title="Group not found"
          description="This group may have been archived, or you no longer have access to it."
          action={
            <Link to={ROUTES.admin.groups} className={buttonVariants({ size: 'lg' })}>
              Back to groups
            </Link>
          }
        />
      </div>
    )
  }

  const status = groupStatusLabel[group.group.status]
  const activeCycle = group.activeCycle
  const draftCycle = group.draftCycle
  const summaryCycle = activeCycle ?? draftCycle
  const progress = activeCycle ? cycleProgress(activeCycle) : null
  const previousCycles = group.cycles.filter(
    (cycle) => cycle.cycle.status !== 'draft' && cycle.cycle.id !== activeCycle?.cycle.id,
  )
  const linkedProfileIds = new Set(
    snapshot.members
      .map((member) => member.profile_id)
      .filter((profileId): profileId is string => Boolean(profileId)),
  )

  const openPayment = (obligation?: ObligationView) => {
    setInitialObligationId(obligation?.obligation.id)
    setPaymentOpen(true)
  }

  const openPayout = (installment?: InstallmentView) => {
    setInitialInstallmentId(installment?.installment.id)
    setPayoutOpen(true)
  }

  return (
    <div className="space-y-5">
      <Link
        to={ROUTES.admin.groups}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        All groups
      </Link>

      <PageHeader
        title={group.group.name}
        description={group.group.description ?? 'Monthly family Bhishi.'}
        actions={
          <>
            <Button
              size="lg"
              variant="outline"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setAddMemberOpen(true)}
            >
              Add member
            </Button>
            {!activeCycle && !draftCycle ? (
              <Button size="lg" onClick={() => setCreateCycleOpen(true)}>
                Create cycle
              </Button>
            ) : null}
          </>
        }
      />

      <Card>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Monthly contribution</p>
            <p className="text-lg font-semibold text-secondary">
              {formatCurrency(
                summaryCycle?.cycle.contribution_amount_snapshot ?? group.group.contribution_amount,
              )}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border px-3.5 py-3">
              <p className="text-xs text-muted-foreground">Members</p>
              <p className="mt-1 text-base font-semibold">{group.members.length}</p>
            </div>
            <div className="rounded-xl border border-border px-3.5 py-3">
              <p className="text-xs text-muted-foreground">Collection day</p>
              <p className="mt-1 text-base font-semibold">
                {summaryCycle?.cycle.collection_day_snapshot ?? group.group.collection_day}
              </p>
            </div>
            <div className="rounded-xl border border-border px-3.5 py-3">
              <p className="text-xs text-muted-foreground">Status</p>
              <div className="mt-1">
                <Badge variant={status.variant} withDot>
                  {status.label}
                </Badge>
              </div>
            </div>
            <div className="rounded-xl border border-border px-3.5 py-3">
              <p className="text-xs text-muted-foreground">Cycle</p>
              <p className="mt-1 truncate text-base font-semibold">
                {summaryCycle?.cycle.name ?? 'Not started'}
              </p>
            </div>
          </div>
          {summaryCycle ? (
            <p className="text-xs text-muted-foreground">
              These amounts are saved on the cycle, so editing the group later will not change its
              history.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-secondary">Members</h2>
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => setAddMemberOpen(true)}
          >
            Add
          </Button>
        </div>
        {group.members.length === 0 ? (
          <p className="rounded-xl border border-border bg-card px-3 py-4 text-sm text-muted-foreground">
            No members yet. Add at least two people to start a cycle.
          </p>
        ) : (
          <MemberList members={group.members} onLinkLogin={(member) => setLinkMember(member)} />
        )}
      </section>

      {draftCycle ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-secondary">{draftCycle.cycle.name}</h2>
                <Badge variant="warning" withDot>
                  Draft
                </Badge>
              </div>
              <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                Starts {formatDate(draftCycle.cycle.start_date)} · {draftCycle.cycle.total_members}{' '}
                members · {formatCurrency(draftCycle.cycle.contribution_amount_snapshot)} on day{' '}
                {draftCycle.cycle.collection_day_snapshot}
              </p>
            </div>
            <Button size="lg" onClick={() => setActivateCycleOpen(true)}>
              Activate cycle
            </Button>
          </div>

          <div className="rounded-xl bg-muted/60 px-3.5 py-2.5 text-sm text-muted-foreground">
            Arrange the order below, then activate. Members cannot see this cycle until it is
            activated.
          </div>

          <ChitOrderEditor cycle={draftCycle} />
        </section>
      ) : null}

      {activeCycle ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-secondary">{activeCycle.cycle.name}</h2>
                <Badge variant="success" withDot>
                  Active
                </Badge>
              </div>
              <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                Started {formatDate(activeCycle.cycle.start_date)} ·{' '}
                {formatCurrency(activeCycle.cycle.contribution_amount_snapshot)} on day{' '}
                {activeCycle.cycle.collection_day_snapshot}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                leftIcon={<HandCoins className="h-3.5 w-3.5" />}
                onClick={() => openPayment()}
                disabled={options.length === 0}
              >
                Record payment
              </Button>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<Wallet className="h-3.5 w-3.5" />}
                onClick={() => openPayout()}
                disabled={payoutChoices.length === 0}
              >
                Record payout
              </Button>
            </div>
          </div>

          {progress ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-card px-3.5 py-3">
                <p className="text-xs text-muted-foreground">Months collected</p>
                <p className="mt-1 text-base font-semibold">
                  {progress.collectedMonths} of {progress.totalMonths}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card px-3.5 py-3">
                <p className="text-xs text-muted-foreground">Payouts recorded</p>
                <p className="mt-1 text-base font-semibold">
                  {progress.paidPayouts} of {progress.totalMonths}
                </p>
              </div>
            </div>
          ) : null}

          <div>
            <h3 className="mb-2 text-sm font-semibold text-secondary">Chit order</h3>
            <div className="divide-y divide-border rounded-xl border border-border bg-card">
              {activeCycle.members.map((cycleMember) => (
                <div
                  key={cycleMember.cycleMember.id}
                  className="flex items-center gap-3 px-3.5 py-2.5"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                    {cycleMember.cycleMember.chit_number}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{cycleMember.member.full_name}</p>
                    {cycleMember.member.phone ? (
                      <p className="truncate text-xs text-muted-foreground">
                        {cycleMember.member.phone}
                      </p>
                    ) : null}
                  </div>
                  {cycleMember.member.profile_id ? (
                    <Link2 className="h-4 w-4 text-success" aria-label="Login linked" />
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-secondary">Cycle schedule</h3>
            <InstallmentList
              cycle={activeCycle}
              onRecordPayment={openPayment}
              onRecordPayout={openPayout}
            />
          </div>
        </section>
      ) : null}

      {!activeCycle && !draftCycle && previousCycles.length === 0 ? (
        <Card>
          <CardContent className="p-5 text-center">
            <h2 className="text-base font-semibold text-secondary">Ready to start?</h2>
            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
              Add all members, then create the cycle. You can review the chit order before
              activating it.
            </p>
            <Button className="mt-4" size="lg" onClick={() => setCreateCycleOpen(true)}>
              Create cycle
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {previousCycles.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-secondary">Previous cycles</h2>
          {previousCycles.map((cycle) => (
            <details key={cycle.cycle.id} className="rounded-xl border border-border bg-card">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium">
                {cycle.cycle.name} · {formatDate(cycle.cycle.start_date)} ·{' '}
                {formatCurrency(cycle.cycle.contribution_amount_snapshot)}
              </summary>
              <div className="space-y-3 border-t border-border p-3">
                <div className="divide-y divide-border rounded-xl border border-border">
                  {cycle.members.map((entry) => (
                    <div
                      key={entry.cycleMember.id}
                      className="flex items-center gap-3 px-3.5 py-2.5"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                        {entry.cycleMember.chit_number}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {entry.member.full_name}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        Chit #{entry.cycleMember.chit_number}
                      </span>
                    </div>
                  ))}
                </div>
                <InstallmentList cycle={cycle} />
              </div>
            </details>
          ))}
        </section>
      ) : null}

      <AddMemberDialog
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
        groupId={group.group.id}
        groupName={group.group.name}
      />
      <CreateCycleDialog open={createCycleOpen} onOpenChange={setCreateCycleOpen} group={group} />
      {draftCycle ? (
        <ActivateCycleDialog
          open={activateCycleOpen}
          onOpenChange={setActivateCycleOpen}
          groupName={group.group.name}
          cycle={draftCycle}
        />
      ) : null}
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
      <LinkLoginDialog
        open={Boolean(linkMember)}
        onOpenChange={(open) => {
          if (!open) setLinkMember(null)
        }}
        member={linkMember}
        profiles={snapshot.profiles}
        linkedProfileIds={linkedProfileIds}
      />
    </div>
  )
}
