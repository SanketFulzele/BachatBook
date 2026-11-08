import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast-context'
import { Field } from './field'
import { useCreateCycleDraft, useUpdateScheduledCycle } from '../hooks/use-bhishi'
import { currentMonthISO, cycleDefaultName, cycleStartDate, todayISO } from '../lib/dates'
import type { CycleView, GroupView } from '../types'

interface CreateCycleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: GroupView
  cycle?: CycleView
}

/** The form only mounts while open, so the draft defaults start fresh each time. */
export function CreateCycleDialog({ open, onOpenChange, group, cycle }: CreateCycleDialogProps) {
  if (!open) return null
  return (
    <CreateCycleForm
      key={cycle?.cycle.id ?? 'new'}
      group={group}
      cycle={cycle}
      onClose={() => onOpenChange(false)}
    />
  )
}

function nextCycleMonth(group: GroupView): string {
  const previousCycle =
    group.activeCycle ?? group.cycles.find((entry) => entry.cycle.status === 'completed') ?? null

  if (previousCycle) {
    const start = previousCycle.cycle.start_date
    const nextMonth = new Date(
      Date.UTC(
        Number(start.slice(0, 4)),
        Number(start.slice(5, 7)) - 1 + previousCycle.cycle.duration_months,
        1,
      ),
    )
    return `${nextMonth.getUTCFullYear()}-${String(nextMonth.getUTCMonth() + 1).padStart(2, '0')}`
  }

  const currentMonth = currentMonthISO()
  const today = todayISO()
  if (Number(today.slice(8, 10)) <= group.group.collection_day) return currentMonth

  const nextMonth = new Date(
    Date.UTC(Number(currentMonth.slice(0, 4)), Number(currentMonth.slice(5, 7)), 1),
  )
  return `${nextMonth.getUTCFullYear()}-${String(nextMonth.getUTCMonth() + 1).padStart(2, '0')}`
}

function CreateCycleForm({
  group,
  cycle,
  onClose,
}: {
  group: GroupView
  cycle?: CycleView
  onClose: () => void
}) {
  const { toast } = useToast()
  const createMutation = useCreateCycleDraft()
  const updateMutation = useUpdateScheduledCycle()
  const activeMembers = group.members.filter(
    (membership) => membership.membership.status === 'active' && membership.member.is_active,
  )
  const currentActiveMemberIds = new Set(activeMembers.map((membership) => membership.member.id))
  const initialMonth = cycle ? cycle.cycle.start_date.slice(0, 7) : nextCycleMonth(group)
  const [month, setMonth] = useState(initialMonth)
  const [name, setName] = useState(
    cycle?.cycle.name ?? cycleDefaultName(group.group.name, Number(initialMonth.slice(0, 4))),
  )
  const [contribution, setContribution] = useState(
    String(cycle?.cycle.contribution_amount_snapshot ?? group.group.contribution_amount),
  )
  const [collectionDay, setCollectionDay] = useState(
    String(cycle?.cycle.collection_day_snapshot ?? group.group.collection_day),
  )
  const [selectedMemberIds, setSelectedMemberIds] = useState(() =>
    cycle
      ? cycle.members
          .filter((entry) => currentActiveMemberIds.has(entry.member.id))
          .map((entry) => entry.member.id)
      : activeMembers.map((membership) => membership.member.id),
  )
  const [error, setError] = useState<string | null>(null)
  const isPending = createMutation.isPending || updateMutation.isPending
  const dialogTitle = cycle
    ? 'Edit scheduled cycle'
    : group.cycles.some((entry) => entry.cycle.status !== 'cancelled')
      ? 'Create next cycle'
      : 'Create cycle'

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Enter a cycle name.')
      return
    }
    if (!/^\d{4}-\d{2}$/.test(month)) {
      setError('Choose the month the cycle starts.')
      return
    }
    if (selectedMemberIds.length < 2) {
      setError('Select at least two active group members for this cycle.')
      return
    }

    const amount = Number(contribution)
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a monthly contribution greater than zero.')
      return
    }

    const day = Number(collectionDay)
    if (!Number.isInteger(day) || day < 1 || day > 31) {
      setError('Collection day must be between 1 and 31.')
      return
    }

    const onSuccess = () => {
      toast({
        title: cycle ? 'Scheduled cycle updated' : 'Cycle scheduled',
        description:
          'Review the chit order. The cycle activates on its start date after prior cycles complete.',
        variant: 'success',
      })
      onClose()
    }
    const onError = (mutationError: Error) => setError(mutationError.message)
    const input = {
      name: name.trim(),
      startDate: cycleStartDate(month, day),
      contributionAmount: amount,
      collectionDay: day,
      memberIds: selectedMemberIds,
    }

    if (cycle) {
      updateMutation.mutate({ ...input, cycleId: cycle.cycle.id }, { onSuccess, onError })
    } else {
      createMutation.mutate({ ...input, groupId: group.group.id }, { onSuccess, onError })
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      size="lg"
      title={dialogTitle}
      description="Set the start month, contribution, collection day and participating members. The cycle remains financially inactive until its scheduled start date."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="create-cycle-form" isLoading={isPending}>
            {cycle ? 'Save schedule' : 'Schedule cycle'}
          </Button>
        </>
      }
    >
      <form id="create-cycle-form" className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cycle name" htmlFor="cycle-name" required>
            <Input
              id="cycle-name"
              className="h-11"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={80}
              required
            />
          </Field>
          <Field label="Start month" htmlFor="cycle-month" required>
            <Input
              id="cycle-month"
              className="h-11"
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              required
            />
          </Field>
          <Field
            label="Monthly contribution"
            htmlFor="cycle-contribution"
            hint="Copied from the group, but saved on this cycle."
            required
          >
            <Input
              id="cycle-contribution"
              className="h-11"
              type="number"
              min={1}
              step={1}
              inputMode="decimal"
              value={contribution}
              onChange={(event) => setContribution(event.target.value)}
              required
            />
          </Field>
          <Field label="Collection day" htmlFor="cycle-day" hint="Day of every month." required>
            <Input
              id="cycle-day"
              className="h-11"
              type="number"
              min={1}
              max={31}
              inputMode="numeric"
              value={collectionDay}
              onChange={(event) => setCollectionDay(event.target.value)}
              required
            />
          </Field>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Participating members ({selectedMemberIds.length})</p>
          <p className="text-xs text-muted-foreground">
            Select at least two active group members. Arrange their chit order after saving.
          </p>
          <div className="divide-y divide-border rounded-xl border border-border">
            {activeMembers.map((membership) => (
              <label
                key={membership.member.id}
                className="flex cursor-pointer items-center gap-3 px-3 py-2.5"
              >
                <input
                  type="checkbox"
                  checked={selectedMemberIds.includes(membership.member.id)}
                  onChange={(event) =>
                    setSelectedMemberIds((selected) =>
                      event.target.checked
                        ? [...selected, membership.member.id]
                        : selected.filter((memberId) => memberId !== membership.member.id),
                    )
                  }
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {membership.member.full_name}
                  </span>
                  {membership.member.phone ? (
                    <span className="block truncate text-xs text-muted-foreground">
                      {membership.member.phone}
                    </span>
                  ) : null}
                </span>
              </label>
            ))}
          </div>
        </div>

        {selectedMemberIds.length < 2 ? (
          <p className="rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning-foreground">
            A cycle needs at least two active members.
          </p>
        ) : null}

        {error ? (
          <p
            className="rounded-lg bg-destructive-soft px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </form>
    </Dialog>
  )
}
