import { useMemo, useState } from 'react'
import { ArrowDownRight, ArrowRightLeft, ArrowUpRight, Info, Link2Off } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { LedgerTransaction, LedgerTransactionType } from '../types'

interface LedgerTransactionsProps {
  transactions: LedgerTransaction[]
}

const typeLabel: Record<LedgerTransactionType, string> = {
  obligation: 'Contribution due',
  payment: 'Payment',
  'payment-voided': 'Payment voided',
  payout: 'Payout',
  'payout-voided': 'Payout voided',
}

const typeColor: Record<LedgerTransactionType, string> = {
  obligation: 'bg-warning-soft text-warning',
  payment: 'bg-success-soft text-success',
  'payment-voided': 'bg-destructive-soft text-destructive',
  payout: 'bg-warning-soft text-success',
  'payout-voided': 'bg-destructive-soft text-destructive',
}

const iconFor = (type: LedgerTransactionType) => {
  switch (type) {
    case 'obligation':
      return <Info className="h-4 w-4" aria-hidden="true" />
    case 'payment':
      return <ArrowDownRight className="h-4 w-4" aria-hidden="true" />
    case 'payout':
      return <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
    case 'payment-voided':
    case 'payout-voided':
      return <Link2Off className="h-4 w-4" aria-hidden="true" />
    default:
      return <ArrowRightLeft className="h-4 w-4" aria-hidden="true" />
  }
}

type FilterOption = 'all' | 'payments' | 'payouts' | 'obligations'

export function LedgerTransactions({ transactions }: LedgerTransactionsProps) {
  const [filter, setFilter] = useState<FilterOption>('all')
  const [groupId, setGroupId] = useState('')
  const [cycleId, setCycleId] = useState('')

  const groups = useMemo(
    () => Array.from(new Set(transactions.map((t) => t.groupName))).sort(),
    [transactions],
  )
  const cycles = useMemo(
    () => Array.from(new Set(transactions.map((t) => t.cycleName))).sort(),
    [transactions],
  )

  const filtered = useMemo(() => {
    let rows = transactions
    switch (filter) {
      case 'payments':
        rows = rows.filter((row) => row.type === 'payment' || row.type === 'payment-voided')
        break
      case 'payouts':
        rows = rows.filter((row) => row.type === 'payout' || row.type === 'payout-voided')
        break
      case 'obligations':
        rows = rows.filter((row) => row.type === 'obligation')
        break
    }
    if (groupId) rows = rows.filter((row) => row.groupName === groupId)
    if (cycleId) rows = rows.filter((row) => row.cycleName === cycleId)
    return rows
  }, [transactions, filter, groupId, cycleId])

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div role="group" aria-label="Transaction filter" className="flex flex-wrap gap-1.5">
          {(['all', 'payments', 'payouts', 'obligations'] as FilterOption[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={[
                'inline-flex min-h-9 items-center rounded-full border px-3 text-xs font-medium transition-colors',
                filter === option
                  ? 'border-primary bg-primary-soft text-primary'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted',
              ].join(' ')}
              aria-pressed={filter === option}
            >
              {option === 'all'
                ? 'All'
                : option === 'payments'
                  ? 'Payments'
                  : option === 'payouts'
                    ? 'Payouts'
                    : 'Obligations'}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <select
            aria-label="Filter by group"
            className="h-9 rounded-lg border border-input bg-card px-2 text-xs sm:text-sm"
            value={groupId}
            onChange={(event) => setGroupId(event.target.value)}
          >
            <option value="">All groups</option>
            {groups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by cycle"
            className="h-9 rounded-lg border border-input bg-card px-2 text-xs sm:text-sm"
            value={cycleId}
            onChange={(event) => setCycleId(event.target.value)}
          >
            <option value="">All cycles</option>
            {cycles.map((cycle) => (
              <option key={cycle} value={cycle}>
                {cycle}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg bg-muted px-3 py-4 text-sm text-muted-foreground">
          No transactions match these filters.
        </p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {filtered.map((txn) => (
            <li key={txn.id} className="flex items-center gap-3 px-3 py-3 text-sm sm:px-4">
              <span
                aria-hidden="true"
                className={[
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                  typeColor[txn.type],
                ].join(' ')}
              >
                {iconFor(txn.type)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{txn.description}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {txn.groupName} · {txn.cycleName} · {formatDate(txn.dateIso)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold">{formatCurrency(txn.amount)}</p>
                <p className="text-[11px] font-medium text-muted-foreground">
                  {typeLabel[txn.type]}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
