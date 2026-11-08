import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast-context'
import { Field } from './field'
import { useCreateGroup } from '../hooks/use-bhishi'
import { todayISO } from '../lib/dates'

interface CreateGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * The form only mounts while the dialog is open, so its state starts fresh on
 * every open without a reset effect.
 */
export function CreateGroupDialog({ open, onOpenChange }: CreateGroupDialogProps) {
  if (!open) return null
  return <CreateGroupForm onClose={() => onOpenChange(false)} />
}

function CreateGroupForm({ onClose }: { onClose: () => void }) {
  const { toast } = useToast()
  const mutation = useCreateGroup()
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('5000')
  const [collectionDay, setCollectionDay] = useState('12')
  const [startDate, setStartDate] = useState(todayISO)
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const parsedAmount = Number(amount)
    const parsedDay = Number(collectionDay)

    if (!name.trim()) {
      setError('Enter a group name.')
      return
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Enter a contribution amount greater than zero.')
      return
    }
    if (!Number.isInteger(parsedDay) || parsedDay < 1 || parsedDay > 31) {
      setError('Collection day must be between 1 and 31.')
      return
    }

    mutation.mutate(
      {
        name: name.trim(),
        description,
        contributionAmount: parsedAmount,
        collectionDay: parsedDay,
        startDate: startDate || null,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Group created',
            description: 'Next, add the members who save together.',
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
      title="New Bhishi group"
      description="Only the basics. You can start the cycle after adding members."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="create-group-form" isLoading={mutation.isPending}>
            Create group
          </Button>
        </>
      }
    >
      <form id="create-group-form" className="space-y-4" onSubmit={handleSubmit}>
        <Field label="Group name" htmlFor="group-name" required>
          <Input
            id="group-name"
            className="h-11"
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Family Bhishi"
            maxLength={80}
            required
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Contribution (₹ / month)" htmlFor="group-amount" required>
            <Input
              id="group-amount"
              className="h-11"
              type="number"
              min={1}
              step="0.01"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              required
            />
          </Field>
          <Field label="Collection day" htmlFor="group-day" hint="Day of each month" required>
            <Input
              id="group-day"
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

        <Field
          label="First collection date"
          htmlFor="group-start"
          hint="Optional. Used when the cycle starts."
        >
          <Input
            id="group-start"
            className="h-11"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </Field>

        <Field label="Note" htmlFor="group-description" hint="Optional, for your family group.">
          <Input
            id="group-description"
            className="h-11"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Monthly family savings"
            maxLength={200}
          />
        </Field>

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
