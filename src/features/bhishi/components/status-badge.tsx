import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import type { PaymentStatus } from '../types'

const statusConfig: Record<
  PaymentStatus,
  { label: string; variant: 'success' | 'warning' | 'destructive' }
> = {
  paid: { label: 'Paid', variant: 'success' },
  partial: { label: 'Partial', variant: 'warning' },
  pending: { label: 'Pending', variant: 'destructive' },
}

export function StatusBadge({ status }: { status: PaymentStatus }) {
  const config = statusConfig[status]
  return (
    <Badge variant={config.variant} withDot>
      {config.label}
    </Badge>
  )
}

export function PayoutBadge({ paid }: { paid: boolean }) {
  return paid ? (
    <Badge variant="success" withDot>
      Paid out
    </Badge>
  ) : (
    <Badge variant="outline">Payout due</Badge>
  )
}

export function AmountDue({ remaining }: { remaining: number }) {
  return (
    <span className={remaining > 0 ? 'font-semibold text-destructive' : 'font-semibold'}>
      {formatCurrency(remaining)}
    </span>
  )
}
