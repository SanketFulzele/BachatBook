import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast-context'
import { Field } from './field'
import { useCreateCycleDraft } from '../hooks/use-bhishi'
import { currentMonthISO, cycleDefaultName, cycleStartDate } from '../lib/dates'
import type { GroupView } from '../types'

interface CreateCycleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: GroupView
}

/** The form only mounts while open, so the draft defaults start fresh each time. */
export function CreateCycleDialog({ open, onOpenChange, group }: CreateCycleDialogProps) {
  if (!open) return null
  return <CreateCycleForm group={group} onClose={() => onOpenChange(false)} />
}

function CreateCycleForm({ group, onClose }: { group: GroupView; onClose: () => void }) {
  const { toast } = useToast()
  const mutation = useCreateCycleDraft()
  const activeMembers = group.members.filter(
    (membership) => membership.membership.status === 'active' && membership.member.is_active,
  )
  const initialMonth = currentMonthISO()
  const [month, setMonth] = useState(initialMonth)
  const [name, setName] = useState(() =>
    cycleDefaultName(group.group.name, Number(initialMonth.slice(0, 4))),
  )
  const [contribution, setContribution] = useState(String(group.group.contribution_amount))
  const [collectionDay, setCollectionDay] = useState(String(group.group.collection_day))
  const [error, setError] = useState<string | null>(null)

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
    if (activeMembers.length < 2) {
      setError('Add at least two active members before creating a cycle.')
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

    mutation.mutate(
      {
        groupId: group.group.id,
        name: name.trim(),
        startDate: cycleStartDate(month, day),
        contributionAmount: amount,
        collectionDay: day,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Cycle draft created',
            description: 'Review the chit order, then activate the cycle.',
            variant: 'success',
          })
          onClose()
        },
        onError: (mutationError) => setError(mutationError.message),
      },
    )
  }

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      size="lg"
      title="Create cycle"
      description="Set the month, contribution and collection day. The chit order can be changed before activation."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="create-cycle-form" isLoading={mutation.isPending}>
            Save draft
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
          <p className="text-sm font-medium">Participating members ({activeMembers.length})</p>
          <p className="text-xs text-muted-foreground">
            Every active member of this group takes part. The order can be changed after saving.
          </p>
          <div className="divide-y divide-border rounded-xl border border-border">
            {activeMembers.map((membership) => (
              <div key={membership.member.id} className="px-3 py-2.5">
                <p className="truncate text-sm font-medium">{membership.member.full_name}</p>
                {membership.member.phone ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {membership.member.phone}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {activeMembers.length < 2 ? (
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
