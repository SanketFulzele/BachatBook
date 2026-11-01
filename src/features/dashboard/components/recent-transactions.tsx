import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type {
  RecentTransaction,
  TransactionStatus,
} from '@/features/dashboard/types/dashboard.types'
import { ROUTES } from '@/lib/constants'
import { formatCurrency, formatDate } from '@/lib/utils'

const statusVariant: Record<TransactionStatus, 'success' | 'warning' | 'destructive'> = {
  Completed: 'success',
  Pending: 'warning',
  Failed: 'destructive',
}

export function RecentTransactions({ transactions }: { transactions: RecentTransaction[] }) {
  return (
    <Card className="min-w-0">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle>Recent transactions</CardTitle>
          <CardDescription>Latest contributions and payouts across your groups.</CardDescription>
        </div>
        <Link
          to={ROUTES.admin.collections}
          className="inline-flex shrink-0 items-center gap-1 rounded-md text-xs font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <Table className="min-w-[720px]">
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5 sm:pl-6">Member</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="pr-5 sm:pr-6">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="pl-5 sm:pl-6">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={transaction.memberName} size="sm" decorative />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {transaction.memberName}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{transaction.method}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {transaction.groupName}
                </TableCell>
                <TableCell>
                  <Badge variant={transaction.type === 'Payout' ? 'navy' : 'primary'}>
                    {transaction.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-sm font-semibold tabular-nums text-foreground">
                  {formatCurrency(transaction.amount)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(transaction.date)}
                </TableCell>
                <TableCell className="pr-5 sm:pr-6">
                  <Badge variant={statusVariant[transaction.status]} withDot>
                    {transaction.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
