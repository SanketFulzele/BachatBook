import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Archive,
  ArrowLeft,
  CalendarDays,
  Ellipsis,
  HandCoins,
  Link2,
  Plus,
  Trash2,
  UsersRound,
  Wallet,
} from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast-context'
import { PageLoading } from '@/components/feedback/page-loading'
import { ROUTES } from '@/lib/constants'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useAuth } from '@/features/auth/components/auth-context'
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
import {
  useArchiveGroup,
  useBhishiData,
  useDeleteEmptyGroup,
} from '@/features/bhishi/hooks/use-bhishi'
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
  const navigate = useNavigate()
  const auth = useAuth()
  const { toast } = useToast()
  const query = useBhishiData()
  const archiveMutation = useArchiveGroup()
  const deleteMutation = useDeleteEmptyGroup()
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [createCycleOpen, setCreateCycleOpen] = useState(false)
  const [activateCycleOpen, setActivateCycleOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [payoutOpen, setPayoutOpen] = useState(false)
  const [linkMember, setLinkMember] = useState<MemberRow | null>(null)
  const [manageAction, setManageAction] = useState<'archive' | 'delete' | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
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
  const isAdmin = auth.user?.role === 'admin'
  const isArchived = group.group.status === 'archived'
  const hasHistory = group.cycles.length > 0
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

  const archiveGroup = () => {
    archiveMutation.mutate(group.group.id, {
      onSuccess: () => {
        toast({
          title: 'Group archived',
          description: 'Its history remains available.',
          variant: 'success',
        })
        setManageAction(null)
      },
    })
  }

  const deleteGroup = () => {
    deleteMutation.mutate(
      { groupId: group.group.id, confirmationName: deleteConfirmation },
      {
        onSuccess: () => {
          toast({ title: 'Group deleted', variant: 'success' })
          void navigate(ROUTES.admin.groups, { replace: true })
        },
      },
    )
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
          <div className="flex flex-wrap items-center gap-2">
            {!isArchived ? (
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
            ) : null}
            {isAdmin && (!isArchived || !hasHistory) ? (
              <div className="ml-1 border-l border-border pl-2">
                <DropdownMenu
                  label="Group actions"
                  trigger={
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
                      <Ellipsis className="h-5 w-5" aria-hidden="true" />
                    </span>
                  }
                >
                  {hasHistory ? (
                    !isArchived ? (
                      <DropdownMenuItem
                        icon={Archive}
                        destructive
                        onSelect={() => setManageAction('archive')}
                      >
                        Archive group
                      </DropdownMenuItem>
                    ) : null
                  ) : (
                    <DropdownMenuItem
                      icon={Trash2}
                      destructive
                      onSelect={() => setManageAction('delete')}
                    >
                      Delete group
                    </DropdownMenuItem>
                  )}
                </DropdownMenu>
              </div>
            ) : null}
          </div>
        }
      />

      {isArchived ? (
        <Alert variant="warning" title="Archived group">
          This group is read-only. Historical cycles and financial records remain available, but new
          members, cycles, payments and payouts are disabled.
        </Alert>
      ) : null}

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
          {!isArchived ? (
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => setAddMemberOpen(true)}
            >
              Add
            </Button>
          ) : null}
        </div>
        {group.members.length === 0 ? (
          <p className="rounded-xl border border-border bg-card px-3 py-4 text-sm text-muted-foreground">
            No members yet. Add at least two people to start a cycle.
          </p>
        ) : (
          <MemberList
            members={group.members}
            onLinkLogin={isArchived ? undefined : (member) => setLinkMember(member)}
          />
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
            {!isArchived ? (
              <Button size="lg" onClick={() => setActivateCycleOpen(true)}>
                Activate cycle
              </Button>
            ) : null}
          </div>

          {!isArchived ? (
            <div className="rounded-xl bg-muted/60 px-3.5 py-2.5 text-sm text-muted-foreground">
              Arrange the order below, then activate. Members cannot see this cycle until it is
              activated.
            </div>
          ) : null}

          {isArchived ? (
            <div className="divide-y divide-border rounded-xl border border-border bg-card">
              {draftCycle.members.map((entry) => (
                <div key={entry.cycleMember.id} className="flex items-center gap-3 px-3 py-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                    {entry.cycleMember.chit_number}
                  </span>
                  <span className="truncate text-sm font-medium">{entry.member.full_name}</span>
                </div>
              ))}
            </div>
          ) : (
            <ChitOrderEditor cycle={draftCycle} />
          )}
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
              {!isArchived ? (
                <>
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
                </>
              ) : null}
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
              onRecordPayment={isArchived ? undefined : openPayment}
              onRecordPayout={isArchived ? undefined : openPayout}
            />
          </div>
        </section>
      ) : null}

      {!isArchived && !activeCycle && !draftCycle && previousCycles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-6 text-center sm:p-7">
            <h2 className="text-base font-semibold text-secondary">Ready to start?</h2>
            <p className="mx-auto max-w-md text-sm leading-6 text-muted-foreground">
              Add all members, then create the cycle. You can review the chit order before
              activating it.
            </p>
            <Button className="mt-2" size="lg" onClick={() => setCreateCycleOpen(true)}>
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
      <Dialog
        open={manageAction === 'delete'}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) {
            setManageAction(null)
            setDeleteConfirmation('')
          }
        }}
        title="Delete this group?"
        description="This group has no financial history. Deleting it will permanently remove the group and its member associations. This action cannot be undone."
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setManageAction(null)
                setDeleteConfirmation('')
              }}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteGroup}
              isLoading={deleteMutation.isPending}
              disabled={deleteConfirmation !== group.group.name}
            >
              Delete group
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          <label htmlFor="delete-group-confirmation" className="text-sm font-medium">
            Type <span className="font-semibold">{group.group.name}</span> to confirm
          </label>
          <Input
            id="delete-group-confirmation"
            value={deleteConfirmation}
            onChange={(event) => setDeleteConfirmation(event.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          {deleteMutation.error ? (
            <Alert variant="error" title="Could not delete group">
              {deleteMutation.error.message}
            </Alert>
          ) : null}
        </div>
      </Dialog>
      <Dialog
        open={manageAction === 'archive'}
        onOpenChange={(open) => {
          if (!open && !archiveMutation.isPending) setManageAction(null)
        }}
        title="Archive this group?"
        description="This group has cycle or financial history. Archiving preserves its history and prevents new activity."
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setManageAction(null)}
              disabled={archiveMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={archiveGroup}
              isLoading={archiveMutation.isPending}
            >
              Archive group
            </Button>
          </>
        }
      >
        {archiveMutation.error ? (
          <Alert variant="error" title="Could not archive group">
            {archiveMutation.error.message}
          </Alert>
        ) : null}
      </Dialog>
    </div>
  )
}
