import { useMemo, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast-context'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Field } from './field'
import { useRecordPayment } from '../hooks/use-bhishi'
import { todayISO } from '../lib/dates'
import type { ContributionPaymentMethod, PaymentOption } from '../types'

interface RecordPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  options: PaymentOption[]
  initialObligationId?: string
}

/** The form only mounts while open, so the amount and fields start fresh. */
export function RecordPaymentDialog({
  open,
  onOpenChange,
  options,
  initialObligationId,
}: RecordPaymentDialogProps) {
  if (!open) return null
  return (
    <RecordPaymentForm
      options={options}
      initialObligationId={initialObligationId}
      onClose={() => onOpenChange(false)}
    />
  )
}

function RecordPaymentForm({
  options,
  initialObligationId,
  onClose,
}: {
  options: PaymentOption[]
  initialObligationId?: string
  onClose: () => void
}) {
  const { toast } = useToast()
  const mutation = useRecordPayment()
  const preferred = useMemo(
    () =>
      options.find((option) => option.obligation.obligation.id === initialObligationId) ??
      options[0] ??
      null,
    [options, initialObligationId],
  )
  const [obligationId, setObligationId] = useState(preferred?.obligation.obligation.id ?? '')
  const [amount, setAmount] = useState(preferred ? String(preferred.obligation.remaining) : '')
  const [paymentDate, setPaymentDate] = useState(todayISO)
  const [method, setMethod] = useState<ContributionPaymentMethod>('cash')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  const selected =
    options.find((option) => option.obligation.obligation.id === obligationId) ?? null

  const handleSelect = (value: string) => {
    setObligationId(value)
    const next = options.find((option) => option.obligation.obligation.id === value)
    setAmount(next ? String(next.obligation.remaining) : '')
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!selected) {
      setError('Choose the contribution being paid.')
      return
    }

    const parsedAmount = Number(amount)
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Enter an amount greater than zero.')
      return
    }
    if (parsedAmount > selected.obligation.remaining) {
      setError(`The remaining amount is ${formatCurrency(selected.obligation.remaining)}.`)
      return
    }
    if (!paymentDate) {
      setError('Choose the payment date.')
      return
    }

    if (!confirming) {
      setConfirming(true)
      return
    }

    mutation.mutate(
      {
        obligationId: selected.obligation.obligation.id,
        amount: parsedAmount,
        paymentDate,
        method,
        reference,
        notes,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Payment recorded',
            description: `${selected.obligation.member.full_name} · ${formatCurrency(parsedAmount)}`,
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
      title="Record payment"
      description="Record money actually received from a member."
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
            form="record-payment-form"
            isLoading={mutation.isPending}
            disabled={options.length === 0 || !selected}
          >
            {confirming ? 'Confirm & save' : 'Review payment'}
          </Button>
        </>
      }
    >
      {options.length === 0 ? (
        <p className="rounded-lg bg-muted px-3 py-3 text-sm text-muted-foreground">
          There are no pending contributions to record. Start a cycle first or choose a different
          member.
        </p>
      ) : (
        <form id="record-payment-form" className="space-y-4" onSubmit={handleSubmit}>
          {confirming && selected ? (
            <div className="space-y-2 rounded-xl bg-muted/60 px-3.5 py-3 text-sm">
              <p className="font-semibold">Confirm payment</p>
              <p>{selected.obligation.member.full_name}</p>
              <p>
                {formatCurrency(Number(amount))} · {formatDate(paymentDate)} ·{' '}
                {method === 'bank_transfer' ? 'Bank transfer' : method === 'upi' ? 'UPI' : 'Cash'}
              </p>
              {notes.trim() ? <p className="text-muted-foreground">{notes.trim()}</p> : null}
            </div>
          ) : (
            <>
              <Field label="Contribution" htmlFor="payment-obligation" required>
                <Select
                  id="payment-obligation"
                  value={obligationId}
                  onChange={(event) => handleSelect(event.target.value)}
                  required
                >
                  {options.map((option) => (
                    <option
                      key={option.obligation.obligation.id}
                      value={option.obligation.obligation.id}
                    >
                      {option.groupName} · #{option.installment.installment.installment_number} ·{' '}
                      {option.obligation.member.full_name} ·{' '}
                      {formatDate(option.installment.installment.scheduled_date)}
                    </option>
                  ))}
                </Select>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Only members with a pending contribution appear here — this cycle's recipient does
                  not pay in their own payout month.
                </p>
              </Field>

              {selected ? (
                <div className="rounded-xl bg-muted/60 px-3.5 py-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Member</span>
                    <span className="font-medium">{selected.obligation.member.full_name}</span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className="font-semibold text-destructive">
                      {formatCurrency(selected.obligation.remaining)}
                    </span>
                  </div>
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Amount (₹)" htmlFor="payment-amount" required>
                  <Input
                    id="payment-amount"
                    className="h-11"
                    type="number"
                    min="0.01"
                    step="0.01"
                    inputMode="decimal"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    required
                  />
                </Field>
                <Field label="Payment date" htmlFor="payment-date" required>
                  <Input
                    id="payment-date"
                    className="h-11"
                    type="date"
                    value={paymentDate}
                    onChange={(event) => setPaymentDate(event.target.value)}
                    required
                  />
                </Field>
              </div>

              <Field label="Method" htmlFor="payment-method" required>
                <Select
                  id="payment-method"
                  value={method}
                  onChange={(event) => setMethod(event.target.value as ContributionPaymentMethod)}
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank transfer</option>
                </Select>
              </Field>

              <Field
                label="Reference"
                htmlFor="payment-reference"
                hint="Optional receipt or UPI reference."
              >
                <Input
                  id="payment-reference"
                  className="h-11"
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                  maxLength={80}
                />
              </Field>

              <Field label="Note" htmlFor="payment-notes" hint="Optional.">
                <Input
                  id="payment-notes"
                  className="h-11"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  maxLength={200}
                />
              </Field>
            </>
          )}

          {error ? (
            <p
              className="rounded-lg bg-destructive-soft px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {error}
            </p>
          ) : null}
        </form>
      )}
    </Dialog>
  )
}
