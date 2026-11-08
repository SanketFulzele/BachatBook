import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/common/page-header'
import { buttonVariants } from '@/components/ui/button-variants'
import { PageLoading } from '@/components/feedback/page-loading'
import { DataError } from '@/features/bhishi/components/data-error'
import { EmptyState } from '@/features/bhishi/components/empty-state'
import { useAuth } from '@/features/auth/components/auth-context'
import { useBhishiData } from '@/features/bhishi/hooks/use-bhishi'
import { ROUTES } from '@/lib/constants'
import { HandCoins } from 'lucide-react'
import { MemberLedgerView } from '../components/member-ledger-view'
import { useMemberLedger } from '../hooks/use-ledger'

export function MemberLedgerPage() {
  const auth = useAuth()
  const snapshotQuery = useBhishiData()
  const profileId = auth.user?.id ?? ''
  const snapshot = snapshotQuery.data

  // The ledger snapshot is computed for a specific member id. Member roles only
  // see their own rows through RLS, so we resolve the member id from the
  // auth-backed profile scan.
  const ownMember = snapshot?.members.find((member) => member.profile_id === profileId && profileId)
  const { query, ledger } = useMemberLedger(ownMember?.id ?? '')

  if (snapshotQuery.isPending) return <PageLoading />

  if (snapshotQuery.isError) {
    return (
      <DataError
        message={snapshotQuery.error.message}
        onRetry={() => void snapshotQuery.refetch()}
      />
    )
  }

  if (!ownMember) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Financial ledger"
          description="Your ledger will appear here once you join a Bhishi group."
        />
        <EmptyState
          icon={HandCoins}
          title="You are not linked to a member yet"
          description="Ask your administrator to link your login to a member record."
          action={
            <Link to={ROUTES.member.groups} className={buttonVariants({ variant: 'outline' })}>
              View my groups
            </Link>
          }
        />
      </div>
    )
  }

  if (query.isPending) return <PageLoading />

  if (query.isError) {
    return (
      <DataError
        message={query.error instanceof Error ? query.error.message : undefined}
        onRetry={() => void query.refetch()}
      />
    )
  }

  if (!ledger) {
    return (
      <EmptyState
        icon={HandCoins}
        title="Financial ledger unavailable"
        description="We could not match your financial history. Try signing out and back in."
        action={
          <Link to={ROUTES.home} className={buttonVariants({ variant: 'outline' })}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to dashboard
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="My financial ledger"
        description="Your contributions, payouts and history across every group and cycle."
        actions={
          <Link to={ROUTES.member.groups} className={buttonVariants({ variant: 'outline' })}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            My groups
          </Link>
        }
      />

      <MemberLedgerView ledger={ledger} memberRole="member" />
    </div>
  )
}
