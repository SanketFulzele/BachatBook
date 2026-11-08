import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/common/page-header'
import { buttonVariants } from '@/components/ui/button-variants'
import { PageLoading } from '@/components/feedback/page-loading'
import { DataError } from '@/features/bhishi/components/data-error'
import { ROUTES } from '@/lib/constants'
import { MemberLedgerView } from '../components/member-ledger-view'
import { useMemberLedger } from '../hooks/use-ledger'

export function AdminMemberLedgerPage() {
  const { memberId = '' } = useParams()
  const { query, ledger } = useMemberLedger(memberId)

  if (query.isPending) return <PageLoading />
  if (query.isError) {
    return (
      <DataError
        message={query.error instanceof Error ? query.error.message : undefined}
        onRetry={() => void query.refetch()}
      />
    )
  }

  if (!memberId || !ledger) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Ledger unavailable"
          description="The member could not be loaded, or the member no longer exists."
          actions={
            <Link to={ROUTES.admin.members} className={buttonVariants({ variant: 'outline' })}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to members
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Financial ledger · ${ledger.memberName}`}
        description="Full financial history and current position across every group and cycle."
        actions={
          <Link to={ROUTES.admin.members} className={buttonVariants({ variant: 'outline' })}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to members
          </Link>
        }
      />

      <MemberLedgerView ledger={ledger} memberRole="admin" />
    </div>
  )
}
