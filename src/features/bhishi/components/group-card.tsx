import { Link } from 'react-router-dom'
import { CalendarDays, ChevronRight, UsersRound, Wallet } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency, formatShortDate } from '@/lib/utils'
import { currentCycle } from '../lib/derive'
import type { GroupView } from '../types'

const groupStatusLabel = {
  draft: { label: 'Not started', variant: 'warning' as const },
  active: { label: 'Active', variant: 'success' as const },
  completed: { label: 'Completed', variant: 'neutral' as const },
  archived: { label: 'Archived', variant: 'outline' as const },
}

interface GroupCardProps {
  group: GroupView
  href?: string
  /** Draft state is admin-only; member cards must not reveal an unactivated cycle. */
  showDraft?: boolean
}

export function GroupCard({ group, href, showDraft = false }: GroupCardProps) {
  const status = groupStatusLabel[group.group.status]
  const cycle = currentCycle(group)
  const draft = showDraft && !group.activeCycle ? group.draftCycle : null
  const next = cycle?.nextInstallment
  const contribution = cycle?.cycle.contribution_amount_snapshot ?? group.group.contribution_amount
  const memberCount = cycle?.cycle.total_members ?? group.members.length

  const content = (
    <CardContent className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-secondary">{group.group.name}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {formatCurrency(contribution)} / month
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant={status.variant} withDot>
            {status.label}
          </Badge>
          {href ? (
            <ChevronRight className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <UsersRound className="h-3.5 w-3.5" aria-hidden="true" />
          {memberCount} members
        </span>
        {draft ? (
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            Draft cycle
          </span>
        ) : cycle ? (
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            {cycle.cycle.name}
          </span>
        ) : null}
        {next?.installment ? (
          <span>Next: {formatShortDate(next.installment.scheduled_date)}</span>
        ) : null}
      </div>

      {next?.recipient ? (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm">
          <Wallet className="h-4 w-4 text-primary" aria-hidden="true" />
          <span className="min-w-0 truncate">
            <span className="text-muted-foreground">Payout to </span>
            <span className="font-medium">{next.recipient.full_name}</span>
          </span>
        </div>
      ) : null}
    </CardContent>
  )

  if (href) {
    return (
      <Link
        to={href}
        className="block rounded-xl transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <Card>{content}</Card>
      </Link>
    )
  }

  return <Card>{content}</Card>
}
