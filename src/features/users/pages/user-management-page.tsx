import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, ShieldCheck, UserCheck, UserRound, UserX } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/common/page-header'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { PageLoading } from '@/components/feedback/page-loading'
import { useAuth } from '@/features/auth/components/auth-context'
import {
  fetchManagedProfiles,
  updateManagedProfile,
  type ManagedProfile,
} from '@/features/auth/api/auth-api'
import type { AuthRole } from '@/features/auth/types/auth.types'
import { useToast } from '@/components/ui/toast-context'
import { queryKeys } from '@/lib/query-keys'

interface AccessChange {
  user: ManagedProfile
  role?: AuthRole
  isActive?: boolean
  title: string
}

const EMPTY_PROFILES: ManagedProfile[] = []

export function UserManagementPage() {
  const auth = useAuth()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [pendingChange, setPendingChange] = useState<AccessChange | null>(null)

  const profilesQuery = useQuery({
    queryKey: queryKeys.profiles.adminUsers(),
    queryFn: fetchManagedProfiles,
  })

  const accessMutation = useMutation({
    mutationFn: updateManagedProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.profiles.adminUsers() }),
  })

  const profiles = profilesQuery.data ?? EMPTY_PROFILES
  const activeAdminCount = profiles.filter(
    (profile) => profile.role === 'admin' && profile.is_active,
  ).length
  const filteredProfiles = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    if (!query) return profiles
    return profiles.filter(
      (profile) =>
        profile.full_name.toLocaleLowerCase().includes(query) ||
        (profile.email ?? '').toLocaleLowerCase().includes(query),
    )
  }, [profiles, search])

  const confirmChange = async () => {
    if (!pendingChange) return
    try {
      await accessMutation.mutateAsync({
        profileId: pendingChange.user.id,
        role: pendingChange.role,
        isActive: pendingChange.isActive,
      })
      toast({
        title: 'User access updated',
        description: `${pendingChange.user.full_name}: ${pendingChange.title.toLowerCase()}.`,
        variant: 'success',
      })
      setPendingChange(null)
    } catch (error) {
      toast({
        title: 'Could not update user access',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'error',
      })
    }
  }

  if (profilesQuery.isLoading) return <PageLoading />

  return (
    <div className="space-y-5">
      <PageHeader
        title="User Management"
        description="Review registered accounts and manage application roles and access."
      />

      {profilesQuery.error ? (
        <Alert variant="error" title="Could not load users">
          {profilesQuery.error.message}
        </Alert>
      ) : null}
      {accessMutation.error ? (
        <Alert variant="error" title="Could not update user access">
          {accessMutation.error.message}
        </Alert>
      ) : null}

      <Card>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <label htmlFor="user-search" className="sr-only">
            Search users by name or email
          </label>
          <Input
            id="user-search"
            type="search"
            placeholder="Search by name or email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            startIcon={<Search className="h-4 w-4" aria-hidden="true" />}
          />

          {filteredProfiles.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {profiles.length === 0 ? 'No registered users yet.' : 'No users match your search.'}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {filteredProfiles.map((profile) => {
                const isCurrentAdmin = profile.id === auth.user?.id
                const isLastActiveAdmin =
                  profile.role === 'admin' && profile.is_active && activeAdminCount <= 1
                const roleChange: AccessChange =
                  profile.role === 'member'
                    ? { user: profile, role: 'admin', title: 'Promote to Admin' }
                    : { user: profile, role: 'member', title: 'Demote to Member' }
                const activityChange: AccessChange = {
                  user: profile,
                  isActive: !profile.is_active,
                  title: profile.is_active ? 'Deactivate account' : 'Activate account',
                }

                return (
                  <li key={profile.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                          <UserRound className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-secondary">{profile.full_name}</p>
                            <Badge variant={profile.role === 'admin' ? 'primary' : 'neutral'}>
                              {profile.role === 'admin' ? 'Admin' : 'Member'}
                            </Badge>
                            <Badge variant={profile.is_active ? 'success' : 'destructive'}>
                              {profile.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <p className="mt-1 break-all text-sm text-muted-foreground">
                            {profile.email ?? 'No email on profile'}
                          </p>
                          {profile.phone ? (
                            <p className="mt-0.5 text-sm text-muted-foreground">{profile.phone}</p>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isCurrentAdmin || isLastActiveAdmin}
                          title={
                            isCurrentAdmin
                              ? 'You cannot change your own role'
                              : isLastActiveAdmin
                                ? 'The last active admin cannot be demoted'
                                : undefined
                          }
                          onClick={() => setPendingChange(roleChange)}
                        >
                          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                          {roleChange.title}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isCurrentAdmin || isLastActiveAdmin}
                          title={
                            isCurrentAdmin
                              ? 'You cannot deactivate your own account'
                              : isLastActiveAdmin
                                ? 'The last active admin cannot be deactivated'
                                : undefined
                          }
                          onClick={() => setPendingChange(activityChange)}
                        >
                          {profile.is_active ? (
                            <UserX className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <UserCheck className="h-4 w-4" aria-hidden="true" />
                          )}
                          {profile.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={pendingChange !== null}
        onOpenChange={(open) => {
          if (!open && !accessMutation.isPending) setPendingChange(null)
        }}
        title={pendingChange?.title ?? 'Confirm user access change'}
        description={
          pendingChange
            ? `Apply this change to ${pendingChange.user.full_name}? This will not delete the authentication account or any financial history.`
            : undefined
        }
        footer={
          <>
            <Button
              variant="ghost"
              disabled={accessMutation.isPending}
              onClick={() => setPendingChange(null)}
            >
              Cancel
            </Button>
            <Button isLoading={accessMutation.isPending} onClick={() => void confirmChange()}>
              Confirm change
            </Button>
          </>
        }
      />
    </div>
  )
}
