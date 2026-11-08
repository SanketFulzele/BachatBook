import { formatCurrency } from '@/lib/utils'
import type { LedgerGroupBreakdown } from '../types'

interface LedgerGroupBreakdownProps {
  groups: LedgerGroupBreakdown[]
}

export function LedgerGroupBreakdown({ groups }: LedgerGroupBreakdownProps) {
  if (groups.length === 0) {
    return (
      <p className="rounded-lg bg-muted px-3 py-3 text-sm text-muted-foreground">
        No group-wise financial activity yet.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <div
          key={group.groupId}
          className="rounded-xl border border-border bg-card p-4 shadow-card"
        >
          <h3 className="text-sm font-semibold text-secondary">{group.groupName}</h3>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Expected</p>
              <p className="mt-0.5 font-medium text-secondary">{formatCurrency(group.expected)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Paid</p>
              <p className="mt-0.5 font-medium text-success">{formatCurrency(group.paid)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="mt-0.5 font-medium text-warning">{formatCurrency(group.pending)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Payout received</p>
              <p className="mt-0.5 font-medium text-secondary">
                {formatCurrency(group.payoutReceived)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
