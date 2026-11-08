import { formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { LedgerSummaryCards } from './ledger-summary-cards'
import { LedgerGroupBreakdown } from './ledger-group-breakdown'
import { LedgerTransactions } from './ledger-transactions'
import type { MemberLedger } from '../types'

interface MemberLedgerViewProps {
  ledger: MemberLedger
  memberRole?: 'admin' | 'member'
}

export function MemberLedgerView({ ledger, memberRole = 'admin' }: MemberLedgerViewProps) {
  return (
    <div className="space-y-5">
      <LedgerSummaryCards ledger={ledger} />

      <Card>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div>
            <h2 className="text-sm font-semibold text-secondary">Group-wise breakdown</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Each group the member participates in.
            </p>
          </div>
          <LedgerGroupBreakdown groups={ledger.groups} />
        </CardContent>
      </Card>

      {ledger.cycles.length > 0 ? (
        <Card>
          <CardContent className="space-y-4 p-4 sm:p-5">
            <div>
              <h2 className="text-sm font-semibold text-secondary">Cycle summary</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Per-cycle participation history.
              </p>
            </div>
            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
              {ledger.cycles.map((cycle) => (
                <li
                  key={cycle.cycleId}
                  className="grid grid-cols-2 items-center gap-2 px-4 py-3 text-sm sm:grid-cols-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-secondary">{cycle.cycleName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {cycle.groupName} · {formatDate(cycle.startDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Expected</p>
                    <p className="text-sm font-medium">{formatCurrency(cycle.expected)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Paid</p>
                    <p className="text-sm font-medium text-success">{formatCurrency(cycle.paid)}</p>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Badge variant={cycle.status === 'completed' ? 'neutral' : 'success'}>
                      {cycle.status === 'completed'
                        ? 'Completed'
                        : cycle.status === 'active'
                          ? 'Active'
                          : cycle.status === 'draft'
                            ? 'Draft'
                            : 'Cancelled'}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div>
            <h2 className="text-sm font-semibold text-secondary">Transaction history</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Chronological list of contributions and payouts.
              {memberRole === 'member' ? ' You can view your own ledger.' : ''}
            </p>
          </div>
          <LedgerTransactions transactions={ledger.transactions} />
        </CardContent>
      </Card>
    </div>
  )
}
