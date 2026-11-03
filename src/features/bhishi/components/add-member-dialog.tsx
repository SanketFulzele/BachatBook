import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast-context'
import { Field } from './field'
import { useAddGroupMember } from '../hooks/use-bhishi'

interface AddMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
  groupName: string
}

/** The form only mounts while open, so its fields reset without an effect. */
export function AddMemberDialog({ open, onOpenChange, groupId, groupName }: AddMemberDialogProps) {
  if (!open) return null
  return (
    <AddMemberForm groupId={groupId} groupName={groupName} onClose={() => onOpenChange(false)} />
  )
}

function AddMemberForm({
  groupId,
  groupName,
  onClose,
}: {
  groupId: string
  groupName: string
  onClose: () => void
}) {
  const { toast } = useToast()
  const mutation = useAddGroupMember()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!fullName.trim()) {
      setError('Enter the member name.')
      return
    }

    mutation.mutate(
      { groupId, fullName, phone, email },
      {
        onSuccess: () => {
          toast({
            title: 'Member added',
            description: `${fullName.trim()} is now part of ${groupName}.`,
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
      title="Add member"
      description={`Add a person to ${groupName}. A login is optional.`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="add-member-form" isLoading={mutation.isPending}>
            Add member
          </Button>
        </>
      }
    >
      <form id="add-member-form" className="space-y-4" onSubmit={handleSubmit}>
        <Field label="Full name" htmlFor="member-name" required>
          <Input
            id="member-name"
            className="h-11"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Member name"
            maxLength={80}
            autoComplete="name"
            required
          />
        </Field>

        <Field label="Phone" htmlFor="member-phone" hint="Optional, used to contact them.">
          <Input
            id="member-phone"
            className="h-11"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="98XXXXXXXX"
            maxLength={20}
            autoComplete="tel"
          />
        </Field>

        <Field label="Email" htmlFor="member-email" hint="Optional.">
          <Input
            id="member-email"
            className="h-11"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            maxLength={120}
            autoComplete="email"
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
