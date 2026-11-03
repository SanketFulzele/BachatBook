import { useState } from 'react'
import { Plus, UsersRound } from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { Button } from '@/components/ui/button'
import { PageLoading } from '@/components/feedback/page-loading'
import { DataError } from '@/features/bhishi/components/data-error'
import { EmptyState } from '@/features/bhishi/components/empty-state'
import { GroupCard } from '@/features/bhishi/components/group-card'
import { CreateGroupDialog } from '@/features/bhishi/components/create-group-dialog'
import { useBhishiData } from '@/features/bhishi/hooks/use-bhishi'
import { ROUTES } from '@/lib/constants'

export function GroupsPage() {
  const query = useBhishiData()
  const [createOpen, setCreateOpen] = useState(false)

  if (query.isPending) return <PageLoading />
  if (query.isError) {
    return (
      <DataError
        message={query.error instanceof Error ? query.error.message : undefined}
        onRetry={() => void query.refetch()}
      />
    )
  }

  const groups = query.data.groups

  return (
    <div className="space-y-5">
      <PageHeader
        title="Groups"
        description="Your Bhishi groups and their monthly contribution."
        actions={
          <Button
            size="lg"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setCreateOpen(true)}
          >
            New group
          </Button>
        }
      />

      {groups.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="No groups yet"
          description="Create a group, add members and start the monthly cycle."
          action={
            <Button
              size="lg"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setCreateOpen(true)}
            >
              Create group
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <GroupCard
              key={group.group.id}
              group={group}
              href={ROUTES.admin.group(group.group.id)}
              showDraft
            />
          ))}
        </div>
      )}

      <CreateGroupDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
