import { useState } from 'react'
import { Archive, Plus, UsersRound } from 'lucide-react'
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
  const [showArchived, setShowArchived] = useState(false)

  if (query.isPending) return <PageLoading />
  if (query.isError) {
    return (
      <DataError
        message={query.error instanceof Error ? query.error.message : undefined}
        onRetry={() => void query.refetch()}
      />
    )
  }

  const activeGroups = query.data.groups.filter((group) => group.group.status !== 'archived')
  const archivedGroups = query.data.groups.filter((group) => group.group.status === 'archived')
  const groups = showArchived ? archivedGroups : activeGroups

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

      <div className="flex flex-wrap gap-2" aria-label="Group views">
        <Button
          size="sm"
          variant={showArchived ? 'outline' : 'secondary'}
          aria-pressed={!showArchived}
          onClick={() => setShowArchived(false)}
        >
          Active groups ({activeGroups.length})
        </Button>
        <Button
          size="sm"
          variant={showArchived ? 'secondary' : 'outline'}
          aria-pressed={showArchived}
          onClick={() => setShowArchived(true)}
        >
          Archived ({archivedGroups.length})
        </Button>
      </div>

      {groups.length === 0 && !showArchived ? (
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
      ) : groups.length === 0 ? (
        <EmptyState
          icon={Archive}
          title="No archived groups"
          description="Groups with cycle or financial history will appear here after they are archived."
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
