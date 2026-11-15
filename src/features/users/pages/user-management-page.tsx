import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, ShieldCheck, UserCheck, UserRound, UserX } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { PageLoading } from '@/components/feedback/page-loading'
import { useAuth } from '@/features/auth/components/auth-context'
import { useDocumentTitle } from '@/hooks/use-document-title'
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

  useDocumentTitle('User Management')

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
    <div className="space-y-3 pb-2 sm:space-y-5 sm:pb-0">
      <div className="space-y-0.5 sm:space-y-1">
        <h1 className="text-[22px] font-bold tracking-tight text-secondary sm:text-[28px]">
          User Management
        </h1>
        <p className="max-w-2xl text-[14px] leading-5 text-muted-foreground sm:text-sm sm:leading-6">
          Review registered accounts and manage application roles and access.
        </p>
      </div>

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
        <CardContent className="space-y-3 p-3 sm:space-y-4 sm:p-5">
          <label htmlFor="user-search" className="sr-only">
            Search users by name or email
          </label>
          <Input
            id="user-search"
            type="search"
            placeholder="Search by name or email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            startIcon={<Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />}
            className="h-10 text-[14px] placeholder:text-[14px] sm:h-11 sm:text-sm sm:placeholder:text-sm"
          />

          {filteredProfiles.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-muted-foreground sm:py-8 sm:text-sm">
              {profiles.length === 0 ? 'No registered users yet.' : 'No users match your search.'}
            </p>
          ) : (
            <ul className="divide-y divide-border/80">
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
                  <li key={profile.id} className="py-2.5 first:pt-0 last:pb-0 sm:py-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
                      <div className="flex min-w-0 flex-1 items-start gap-2.5 sm:gap-3">
                        <span
                          aria-hidden="true"
                          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary sm:h-10 sm:w-10"
                        >
                          <UserRound className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 sm:gap-2">
                            <p className="break-words text-[16px] font-semibold leading-snug text-secondary sm:text-base">
                              {profile.full_name}
                            </p>
                            <Badge
                              variant={profile.role === 'admin' ? 'primary' : 'neutral'}
                              className="px-2 py-0.5 text-[12px] sm:px-2.5 sm:text-xs"
                            >
                              {profile.role === 'admin' ? 'Admin' : 'Member'}
                            </Badge>
                            <Badge
                              variant={profile.is_active ? 'success' : 'destructive'}
                              className="px-2 py-0.5 text-[12px] sm:px-2.5 sm:text-xs"
                            >
                              {profile.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <p className="mt-0.5 break-all text-[13px] leading-snug text-muted-foreground sm:mt-1 sm:text-sm">
                            {profile.email ?? 'No email on profile'}
                          </p>
                          {profile.phone ? (
                            <p className="mt-0.5 break-words text-[13px] leading-snug text-muted-foreground sm:text-sm">
                              {profile.phone}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pl-10 sm:justify-end sm:gap-2 sm:pl-0">
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
                          className="h-8 gap-1.5 px-2.5 text-[13px] sm:h-8 sm:px-3 sm:text-xs"
                        >
                          <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
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
                          className="h-8 gap-1.5 px-2.5 text-[13px] sm:h-8 sm:px-3 sm:text-xs"
                        >
                          {profile.is_active ? (
                            <UserX className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
                          ) : (
                            <UserCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
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
