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
import type { MemberRow } from '@/features/bhishi/types'

export function AdminMembersPage() {
  const [search, setSearch] = useState('')
  const snapshotQuery = useBhishiData()
  const snapshot = snapshotQuery.data

  const members = useMemo(() => {
    if (!snapshot) return [] as { member: MemberRow; groups: string[] }[]
    const query = search.trim().toLocaleLowerCase()

    return snapshot.members
      .map((member) => {
        const groups = snapshot.groups
          .filter((group) =>
            group.members.some(({ member: groupMember }) => groupMember.id === member.id),
          )
          .map(({ group }) => group.name)
        return { member, groups }
      })
      .filter(({ member, groups }) => {
        if (!query) return true
        return (
          member.full_name.toLocaleLowerCase().includes(query) ||
          (member.email ?? '').toLocaleLowerCase().includes(query) ||
          (member.phone ?? '').toLocaleLowerCase().includes(query) ||
          groups.some((name) => name.toLocaleLowerCase().includes(query))
        )
      })
      .sort((a, b) => a.member.full_name.localeCompare(b.member.full_name))
  }, [snapshot, search])

  if (snapshotQuery.isLoading) return <PageLoading />

  return (
    <div className="space-y-5">
      <PageHeader
        title="Members"
        description="Members across your Bhishi groups. Open a financial ledger for any household."
      />

      {snapshotQuery.error ? (
        <Alert variant="error" title="Could not load members">
          {snapshotQuery.error.message}
        </Alert>
      ) : null}

      <Card>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <label htmlFor="member-search" className="sr-only">
            Search members by name, email, phone or group
          </label>
          <Input
            id="member-search"
            type="search"
            placeholder="Search members by name, email, phone or group"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            startIcon={<Search className="h-4 w-4" aria-hidden="true" />}
            autoComplete="off"
          />

          {members.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {snapshot?.members.length
                ? 'No members match your search.'
                : 'No members yet. Add members to a group first.'}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {members.map(({ member, groups }) => (
                <li
                  key={member.id}
                  className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 gap-3">
                    <span
                      aria-hidden="true"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary"
                    >
                      <UserRound className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-secondary">{member.full_name}</p>
                        <Badge variant={member.is_active ? 'success' : 'neutral'}>
                          {member.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="mt-0.5 break-all text-sm text-muted-foreground">
                        {member.email ?? 'No email on file'}
                      </p>
                      {member.phone ? (
                        <p className="mt-0.5 text-sm text-muted-foreground">{member.phone}</p>
                      ) : null}
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {groups.length > 0 ? (
                          groups.map((name) => (
                            <Badge key={name} variant="outline">
                              {name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">No group membership</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Link
                    to={ROUTES.admin.memberLedger(member.id)}
                    className={buttonVariants({ size: 'md', variant: 'outline' })}
                  >
                    View ledger
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
