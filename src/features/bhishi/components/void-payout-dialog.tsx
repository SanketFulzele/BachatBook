import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast-context'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useVoidPayout } from '../hooks/use-bhishi'
import type { PayoutRow } from '../types'

interface VoidPayoutDialogProps {
  payout: PayoutRow | null
  recipientName: string
  onClose: () => void
}

export function VoidPayoutDialog({ payout, recipientName, onClose }: VoidPayoutDialogProps) {
  if (!payout) return null

  return <VoidPayoutForm payout={payout} recipientName={recipientName} onClose={onClose} />
}

function VoidPayoutForm({
  payout,
  recipientName,
  onClose,
}: {
  payout: PayoutRow
  recipientName: string
  onClose: () => void
}) {
  const { toast } = useToast()
  const mutation = useVoidPayout()
  const [reason, setReason] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    if (!reason.trim()) {
      setError('Enter a reason for voiding this payout.')
      return
    }

    if (!confirming) {
      setConfirming(true)
      return
    }

    mutation.mutate(
      { payoutId: payout.id, reason: reason.trim() },
      {
        onSuccess: () => {
          toast({
            title: 'Payout voided',
            description: `${recipientName} · ${formatCurrency(payout.amount)}`,
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
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title="Void payout"
      description="The payout stays in history but is no longer counted as completed."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {confirming ? (
            <Button type="button" variant="outline" onClick={() => setConfirming(false)}>
              Back
            </Button>
          ) : null}
          <Button
            type="submit"
            form="void-payout-form"
            variant="destructive"
            isLoading={mutation.isPending}
          >
            {confirming ? 'Confirm void' : 'Review void'}
          </Button>
        </>
      }
    >
      <form id="void-payout-form" className="space-y-4" onSubmit={handleSubmit}>
        <div className="rounded-xl bg-muted/60 px-3.5 py-3 text-sm">
          <p className="font-medium">{recipientName}</p>
          <p className="mt-1 text-muted-foreground">
            {formatCurrency(payout.amount)} · {formatDate(payout.payout_date)}
          </p>
          {confirming ? <p className="mt-2">Reason: {reason.trim()}</p> : null}
        </div>
        {!confirming ? (
          <label className="block space-y-1.5 text-sm font-medium" htmlFor="void-payout-reason">
            Reason for voiding
            <Input
              id="void-payout-reason"
              className="h-11"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={200}
              required
            />
          </label>
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
