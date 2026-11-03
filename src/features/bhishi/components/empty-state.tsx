import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center p-6 text-center sm:p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-base font-semibold text-secondary">{title}</h2>
        <p className="mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
        {action ? <div className="mt-5 w-full sm:w-auto">{action}</div> : null}
      </CardContent>
    </Card>
  )
}
