import { useMemo, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast-context'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Field } from './field'
import { useRecordPayout } from '../hooks/use-bhishi'
import { todayISO } from '../lib/dates'
import type { PaymentMethod, PayoutOption } from '../types'

interface RecordPayoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  options: PayoutOption[]
  initialInstallmentId?: string
}

/** The form only mounts while open, so the amount and fields start fresh. */
export function RecordPayoutDialog({
  open,
  onOpenChange,
  options,
  initialInstallmentId,
}: RecordPayoutDialogProps) {
  if (!open) return null
  return (
    <RecordPayoutForm
      options={options}
      initialInstallmentId={initialInstallmentId}
      onClose={() => onOpenChange(false)}
    />
  )
}

function RecordPayoutForm({
  options,
  initialInstallmentId,
  onClose,
}: {
  options: PayoutOption[]
  initialInstallmentId?: string
  onClose: () => void
}) {
  const { toast } = useToast()
  const mutation = useRecordPayout()
  const preferred = useMemo(
    () =>
      options.find((option) => option.installment.installment.id === initialInstallmentId) ??
      options[0] ??
      null,
    [options, initialInstallmentId],
  )
  const [installmentId, setInstallmentId] = useState(preferred?.installment.installment.id ?? '')
  const [amount, setAmount] = useState(preferred ? String(preferred.amount) : '')
  const [payoutDate, setPayoutDate] = useState(todayISO)
  const [method, setMethod] = useState<PaymentMethod>('bank_transfer')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const selected =
    options.find((option) => option.installment.installment.id === installmentId) ?? null

  const handleSelect = (value: string) => {
    setInstallmentId(value)
    const next = options.find((option) => option.installment.installment.id === value)
    setAmount(next ? String(next.amount) : '')
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!selected || !selected.installment.recipient) {
      setError('Choose the installment being paid out.')
      return
    }

    const parsedAmount = Number(amount)
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Enter an amount greater than zero.')
      return
    }
    if (!payoutDate) {
      setError('Choose the payout date.')
      return
    }

    mutation.mutate(
      {
        installmentId: selected.installment.installment.id,
        recipientMemberId: selected.installment.recipient.id,
        amount: parsedAmount,
        payoutDate,
        method,
        reference,
        notes,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Payout recorded',
            description: `${selected.installment.recipient?.full_name} · ${formatCurrency(parsedAmount)}`,
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
      title="Record payout"
      description="Record money handed to this month's recipient."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="record-payout-form"
            isLoading={mutation.isPending}
            disabled={options.length === 0}
          >
            Save payout
          </Button>
        </>
      }
    >
      {options.length === 0 ? (
        <p className="rounded-lg bg-muted px-3 py-3 text-sm text-muted-foreground">
          All generated installments already have a payout recorded.
        </p>
      ) : (
        <form id="record-payout-form" className="space-y-4" onSubmit={handleSubmit}>
          <Field label="Installment" htmlFor="payout-installment" required>
            <Select
              id="payout-installment"
              value={installmentId}
              onChange={(event) => handleSelect(event.target.value)}
              required
            >
              {options.map((option) => (
                <option
                  key={option.installment.installment.id}
                  value={option.installment.installment.id}
                >
                  {option.groupName} · #{option.installment.installment.installment_number} ·{' '}
                  {option.installment.recipient?.full_name ?? 'No recipient'} ·{' '}
                  {formatDate(option.installment.installment.scheduled_date)}
                </option>
              ))}
            </Select>
          </Field>

          {selected ? (
            <div className="rounded-xl bg-muted/60 px-3.5 py-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Recipient</span>
                <span className="font-medium">{selected.installment.recipient?.full_name}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Collected so far</span>
                <span className="font-medium">
                  {formatCurrency(selected.installment.collectedAmount)}
                </span>
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Full group contribution</span>
                <span className="font-semibold">{formatCurrency(selected.amount)}</span>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Amount (₹)" htmlFor="payout-amount" required>
              <Input
                id="payout-amount"
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
            <Field label="Payout date" htmlFor="payout-date" required>
              <Input
                id="payout-date"
                className="h-11"
                type="date"
                value={payoutDate}
                onChange={(event) => setPayoutDate(event.target.value)}
                required
              />
            </Field>
          </div>

          <Field label="Method" htmlFor="payout-method" required>
            <Select
              id="payout-method"
              value={method}
              onChange={(event) => setMethod(event.target.value as PaymentMethod)}
            >
              <option value="bank_transfer">Bank transfer</option>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="other">Other</option>
            </Select>
          </Field>

          <Field
            label="Reference"
            htmlFor="payout-reference"
            hint="Optional bank or receipt reference."
          >
            <Input
              id="payout-reference"
              className="h-11"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              maxLength={80}
            />
          </Field>

          <Field label="Note" htmlFor="payout-notes" hint="Optional.">
            <Input
              id="payout-notes"
              className="h-11"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
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
      )}
    </Dialog>
  )
}
