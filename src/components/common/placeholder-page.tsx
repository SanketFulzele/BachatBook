import { ArrowRight, CircleDashed, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/common/page-header'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'

export interface PlaceholderPageProps {
  title: string
  description: string
  sprint: number
  icon: LucideIcon
  capabilities: string[]
  eyebrow?: string
  dashboardHref?: string
}

/**
 * Clearly-labelled placeholder for destinations that are intentionally
 * out of scope until a later sprint.
 */
export function PlaceholderPage({
  title,
  description,
  sprint,
  icon: Icon,
  capabilities,
  eyebrow = 'Coming soon',
  dashboardHref = ROUTES.admin.dashboard,
}: PlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={<Badge variant="outline">Planned for Sprint {sprint}</Badge>}
      />

      <Card className="overflow-hidden">
        <CardContent className="p-6 sm:p-10">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <Icon className="h-7 w-7" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-lg font-semibold text-secondary">
              This section is being prepared
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Sprint 1 focuses on the foundation, design system and dashboard shell. This page will
              be connected in a later sprint.
            </p>
          </div>

          <div className="mx-auto mt-8 grid max-w-2xl gap-2.5 sm:grid-cols-2">
            {capabilities.map((capability) => (
              <div
                key={capability}
                className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/30 px-3.5 py-3 text-left"
              >
                <CircleDashed
                  className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/70"
                  aria-hidden="true"
                />
                <span className="text-sm text-muted-foreground">{capability}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              to={dashboardHref}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-primary',
                'underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              )}
            >
              Back to dashboard
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
