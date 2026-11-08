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
import type { ContributionPaymentMethod, PayoutOption } from '../types'

interface RecordPayoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  options: PayoutOption[]
  initialInstallmentId?: string
  blockedByContributions?: boolean
}

/** The form only mounts while open, so the amount and fields start fresh. */
export function RecordPayoutDialog({
  open,
  onOpenChange,
  options,
  initialInstallmentId,
  blockedByContributions,
}: RecordPayoutDialogProps) {
  if (!open) return null
  return (
    <RecordPayoutForm
      options={options}
      initialInstallmentId={initialInstallmentId}
      blockedByContributions={blockedByContributions}
      onClose={() => onOpenChange(false)}
    />
  )
}

function RecordPayoutForm({
  options,
  initialInstallmentId,
  blockedByContributions,
  onClose,
}: {
  options: PayoutOption[]
  initialInstallmentId?: string
  blockedByContributions?: boolean
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
  const [amount, setAmount] = useState('')
  const [payoutDate, setPayoutDate] = useState(todayISO)
  const [method, setMethod] = useState<ContributionPaymentMethod>('bank_transfer')
  const [notes, setNotes] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selected =
    options.find((option) => option.installment.installment.id === installmentId) ?? null

  const handleSelect = (value: string) => {
    setInstallmentId(value)
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

    if (!confirming) {
      setConfirming(true)
      return
    }

    mutation.mutate(
      {
        installmentId: selected.installment.installment.id,
        amount: parsedAmount,
        payoutDate,
        method,
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
      description="Enter the actual amount paid to the scheduled recipient."
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
            form="record-payout-form"
            isLoading={mutation.isPending}
            disabled={options.length === 0}
          >
            {confirming ? 'Confirm payout' : 'Review payout'}
          </Button>
        </>
      }
    >
      {options.length === 0 ? (
        <p className="rounded-lg bg-muted px-3 py-3 text-sm text-muted-foreground">
          {blockedByContributions
            ? 'Record all pending contributions before recording the payout.'
            : 'All generated installments already have a payout recorded.'}
        </p>
      ) : (
        <form id="record-payout-form" className="space-y-4" onSubmit={handleSubmit}>
          {confirming ? (
            <div className="rounded-xl bg-muted/60 px-3.5 py-3 text-sm">
              <p className="font-semibold">Confirm this payout</p>
              <dl className="mt-2 space-y-1.5">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Installment</dt>
                  <dd>#{selected?.installment.installment.installment_number}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Recipient</dt>
                  <dd className="font-medium">{selected?.installment.recipient?.full_name}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Expected collection</dt>
                  <dd>{formatCurrency(selected?.amount ?? 0)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Actual payout</dt>
                  <dd className="font-semibold">{formatCurrency(Number(amount))}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Date</dt>
                  <dd>{formatDate(payoutDate)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Method</dt>
                  <dd>{method.replace('_', ' ')}</dd>
                </div>
                {notes.trim() ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Note</dt>
                    <dd className="max-w-[65%] text-right">{notes.trim()}</dd>
                  </div>
                ) : null}
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">
                The recipient is fixed by the saved chit order.
              </p>
            </div>
          ) : (
            <>
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
                    <span className="text-muted-foreground">Scheduled recipient</span>
                    <span className="font-medium">{selected.installment.recipient?.full_name}</span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Expected collection</span>
                    <span className="font-medium">{formatCurrency(selected.amount)}</span>
                  </div>
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Actual payout (₹)" htmlFor="payout-amount" required>
                  <Input
                    id="payout-amount"
                    className="h-11"
                    type="number"
                    min="0.01"
                    max="9999999999.99"
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
                  onChange={(event) => setMethod(event.target.value as ContributionPaymentMethod)}
                >
                  <option value="bank_transfer">Bank transfer</option>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                </Select>
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
