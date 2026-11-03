import { useState } from 'react'
import { Info } from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { CollectionChart } from '@/features/dashboard/components/collection-chart'
import { CurrentRecipientCard } from '@/features/dashboard/components/current-recipient-card'
import { RecentTransactions } from '@/features/dashboard/components/recent-transactions'
import { SummaryCardGrid } from '@/features/dashboard/components/summary-card'
import { UpcomingCollections } from '@/features/dashboard/components/upcoming-collections'
import { dashboardSampleData } from '@/features/dashboard/data/sample-data'

export function DashboardPage() {
  const [aboutOpen, setAboutOpen] = useState(false)
  const data = dashboardSampleData

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="Admin overview"
        title="Dashboard"
        description="A clear view of savings activity across your Bhishi groups."
        actions={
          <>
            <Badge variant="warning" withDot>
              Sample data
            </Badge>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Info className="h-4 w-4" />}
              onClick={() => setAboutOpen(true)}
            >
              About this view
            </Button>
          </>
        }
      />

      <Alert variant="warning" title="Development preview data">
        All metrics, transactions and payout figures on this page are static fixtures. No Neon
        connection, financial calculation or live payment exists in Sprint 1.
      </Alert>

      <SummaryCardGrid metrics={data.summary} />

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <CollectionChart data={data.monthlyCollections} />
        </div>
        <CurrentRecipientCard recipient={data.currentRecipient} />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <RecentTransactions transactions={data.recentTransactions} />
        </div>
        <UpcomingCollections collections={data.upcomingCollections} />
      </div>

      <Dialog
        open={aboutOpen}
        onOpenChange={setAboutOpen}
        title="About this dashboard"
        description="Sprint 1 · Project foundation and design system"
        footer={<Button onClick={() => setAboutOpen(false)}>Close</Button>}
      >
        <div className="space-y-3 text-sm leading-6 text-muted-foreground">
          <p>
            This dashboard is a visual preview built with the Bachat Book design system. Every
            figure comes from{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">
              src/features/dashboard/data/sample-data.ts
            </code>
            .
          </p>
          <p>
            The schema ships as Neon migrations, and Sprint 9 will replace these fixtures with
            role-aware, live dashboard queries. No financial calculation, contribution or payout is
            performed here.
          </p>
          <p className="font-medium text-foreground">
            Status: UI-only preview · sample data · no authentication
          </p>
        </div>
      </Dialog>
    </div>
  )
}
