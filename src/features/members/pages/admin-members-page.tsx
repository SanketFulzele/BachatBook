import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, UserRound } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/common/page-header'
import { buttonVariants } from '@/components/ui/button-variants'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PageLoading } from '@/components/feedback/page-loading'
import { useBhishiData } from '@/features/bhishi/hooks/use-bhishi'
import { ROUTES } from '@/lib/constants'

export function AdminMembersPage() {
  const [search, setSearch] = useState('')
  const snapshotQuery = useBhishiData()
  const snapshot = snapshotQuery.data

  const members = useMemo(() => {
    if (!snapshot) return []
    const query = search.trim().toLocaleLowerCase()

    return snapshot.members
      .map((member) => {
        const profile = snapshot.profiles.find((item) => item.id === member.profile_id)
        const groups = snapshot.groups
          .filter((group) =>
            group.members.some(({ member: groupMember }) => groupMember.id === member.id),
          )
          .map(({ group }) => group.name)
        return { member, profile, groups }
      })
      .filter(({ member, profile }) => {
        if (!query) return true
        return (
          member.full_name.toLocaleLowerCase().includes(query) ||
          (profile?.email ?? '').toLocaleLowerCase().includes(query)
        )
      })
  }, [snapshot, search])

  if (snapshotQuery.isLoading) return <PageLoading />

  return (
    <div className="space-y-5">
      <PageHeader title="Members" description="People and accounts across your savings groups." />

      {snapshotQuery.error ? (
        <Alert variant="error" title="Could not load members">
          {snapshotQuery.error.message}
        </Alert>
      ) : null}

      <Card>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <label htmlFor="member-search" className="sr-only">
            Search members by name or email
          </label>
          <Input
            id="member-search"
            type="search"
            placeholder="Search members by name or email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            startIcon={<Search className="h-4 w-4" aria-hidden="true" />}
          />

          {members.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {snapshot?.members.length ? 'No members match your search.' : 'No members yet.'}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {members.map(({ member, profile, groups }) => (
                <li key={member.id} className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                    <UserRound className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-secondary">{member.full_name}</p>
                      <Badge variant={member.is_active ? 'success' : 'neutral'}>
                        {member.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="mt-1 break-all text-sm text-muted-foreground">
                      {profile?.email ?? 'No login account linked'}
                    </p>
                    {member.phone ? (
                      <p className="mt-0.5 text-sm text-muted-foreground">{member.phone}</p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {groups.length > 0 ? (
                        groups.map((groupName) => (
                          <Badge key={groupName} variant="outline">
                            {groupName}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">No group membership</span>
                      )}
                    </div>
                  </div>
                  <Link
                    to={ROUTES.admin.userManagement}
                    className={buttonVariants({ size: 'sm', variant: 'outline' })}
                  >
                    Manage account
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
