import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast-context'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useVoidPayment } from '../hooks/use-bhishi'
import type { PaymentRow } from '../types'

interface VoidPaymentDialogProps {
  payment: PaymentRow | null
  memberName: string
  onClose: () => void
}

export function VoidPaymentDialog({ payment, memberName, onClose }: VoidPaymentDialogProps) {
  if (!payment) return null

  return <VoidPaymentForm payment={payment} memberName={memberName} onClose={onClose} />
}

function VoidPaymentForm({
  payment,
  memberName,
  onClose,
}: {
  payment: PaymentRow
  memberName: string
  onClose: () => void
}) {
  const { toast } = useToast()
  const mutation = useVoidPayment()
  const [reason, setReason] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    if (!reason.trim()) {
      setError('Enter a reason for voiding this payment.')
      return
    }

    if (!confirming) {
      setConfirming(true)
      return
    }

    mutation.mutate(
      { paymentId: payment.id, reason: reason.trim() },
      {
        onSuccess: () => {
          toast({
            title: 'Payment voided',
            description: `${memberName} · ${formatCurrency(payment.amount)}`,
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
      title="Void payment"
      description="This keeps the payment in history but removes it from the paid total."
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
            form="void-payment-form"
            variant="destructive"
            isLoading={mutation.isPending}
          >
            {confirming ? 'Confirm void' : 'Review void'}
          </Button>
        </>
      }
    >
      <form id="void-payment-form" className="space-y-4" onSubmit={handleSubmit}>
        <div className="rounded-xl bg-muted/60 px-3.5 py-3 text-sm">
          <p className="font-medium">{memberName}</p>
          <p className="mt-1 text-muted-foreground">
            {formatCurrency(payment.amount)} · {formatDate(payment.payment_date)}
          </p>
          {confirming ? <p className="mt-2">Reason: {reason.trim()}</p> : null}
        </div>
        {!confirming ? (
          <label className="block space-y-1.5 text-sm font-medium" htmlFor="void-payment-reason">
            Reason for voiding
            <Input
              id="void-payment-reason"
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
