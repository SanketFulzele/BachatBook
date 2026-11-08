import { useState, type FormEvent } from 'react'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { useToast } from '@/components/ui/toast-context'
import { useAddProfilesToGroup, useBhishiData } from '../hooks/use-bhishi'
import type { ProfileRow } from '../types'

interface AddMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
  groupName: string
}

export function AddMemberDialog({ open, onOpenChange, groupId, groupName }: AddMemberDialogProps) {
  if (!open) return null
  return (
    <AddMemberForm groupId={groupId} groupName={groupName} onClose={() => onOpenChange(false)} />
  )
}

function AddMemberForm({
  groupId,
  groupName,
  onClose,
}: {
  groupId: string
  groupName: string
  onClose: () => void
}) {
  const { toast } = useToast()
  const data = useBhishiData()
  const mutation = useAddProfilesToGroup()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<ProfileRow[]>([])
  const [error, setError] = useState<string | null>(null)

  const query = search.trim().toLowerCase()
  const profiles = data.data?.profiles ?? []
  const existingMemberProfileIds = new Set(
    (data.data?.groups.find((entry) => entry.group.id === groupId)?.members ?? [])
      .map((entry) => entry.member.profile_id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0),
  )

  const eligibleProfiles = profiles
    .filter((profile) => profile.is_active && !existingMemberProfileIds.has(profile.id))
    .filter(
      (profile) =>
        !query ||
        profile.full_name.toLowerCase().includes(query) ||
        (profile.email ?? '').toLowerCase().includes(query),
    )

  const selectedIds = new Set(selected.map((profile) => profile.id))
  const selectedCount = selected.length

  const toggleProfile = (profile: ProfileRow) => {
    setSelected((current) =>
      current.some((entry) => entry.id === profile.id)
        ? current.filter((entry) => entry.id !== profile.id)
        : [...current, profile],
    )
  }

  const removeProfile = (profileId: string) => {
    setSelected((current) => current.filter((entry) => entry.id !== profileId))
  }

  const handleSubmit = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    setError(null)

    if (selected.length === 0) {
      setError('Select at least one registered member to add.')
      return
    }

    mutation.mutate(
      { groupId, profileIds: selected.map((profile) => profile.id) },
      {
        onSuccess: (added) => {
          toast({
            title: 'Members added',
            description:
              added > 0
                ? `${added} registered member${added === 1 ? '' : 's'} added to ${groupName}.`
                : 'The selected members were already in the group. No duplicate memberships were created.',
            variant: 'success',
          })
          onClose()
        },
        onError: (mutationError) => setError(mutationError.message),
      },
    )
  }

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      title="Add member"
      description={`Search registered Bachat Book members and add them to ${groupName}.`}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-member-form"
            isLoading={mutation.isPending}
            disabled={selected.length === 0}
          >
            {`Add Selected Members${selected.length ? ` (${selected.length})` : ''}`}
          </Button>
        </>
      }
    >
      <form id="add-member-form" className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="member-search" className="sr-only">
            Search members by name or email
          </label>
          <Input
            id="member-search"
            type="search"
            autoFocus
            startIcon={<Search aria-hidden="true" className="h-4 w-4" />}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search members by name or email"
            autoComplete="off"
            aria-label="Search members by name or email"
          />
        </div>

        {selectedCount > 0 ? (
          <div aria-live="polite" className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground">Selected ({selectedCount})</p>
              <button
                type="button"
                className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setSelected([])}
              >
                Clear all
              </button>
            </div>
            <ul className="flex flex-wrap gap-2" aria-label="Selected members">
              {selected.map((profile) => (
                <li
                  key={profile.id}
                  className="flex items-center gap-1.5 rounded-full bg-primary-soft px-2 py-1 text-xs font-medium text-primary"
                >
                  <span className="max-w-40 truncate">{profile.full_name}</span>
                  <button
                    type="button"
                    onClick={() => removeProfile(profile.id)}
                    aria-label={`Remove ${profile.full_name}`}
                    className="rounded-full p-0.5 transition-colors hover:bg-primary/10"
                  >
                    <X aria-hidden="true" className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div
          aria-live="polite"
          className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-border bg-card"
        >
          {data.isPending ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Loading registered members…
            </p>
          ) : eligibleProfiles.length > 0 ? (
            <ul aria-label="Registered members" className="divide-y divide-border">
              {eligibleProfiles.map((profile) => {
                const isSelected = selectedIds.has(profile.id)
                return (
                  <li key={profile.id}>
                    <button
                      type="button"
                      onClick={() => toggleProfile(profile)}
                      aria-pressed={isSelected}
                      aria-label={isSelected ? 'Deselect' : 'Select'}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                    >
                      <Avatar name={profile.full_name} size="sm" decorative />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {profile.full_name}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {profile.email}
                        </span>
                      </span>
                      <span
                        aria-hidden="true"
                        className={[
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                          isSelected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-input bg-card',
                        ].join(' ')}
                      >
                        {isSelected ? (
                          <svg
                            viewBox="0 0 16 16"
                            className="h-3 w-3 fill-current"
                            aria-hidden="true"
                          >
                            <path d="M6.2 11.3 3.7 8.8l1.1-1.1 1.4 1.4 4.6-4.6 1.1 1.1-5.7 5.7z" />
                          </svg>
                        ) : null}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              {query
                ? `No members found for “${search.trim()}”.`
                : profiles.length === 0
                  ? 'No registered members exist yet.'
                  : 'Every registered member is already in this group.'}
            </p>
          )}
        </div>

        {error ? (
          <p
            className="rounded-lg bg-destructive-soft px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </form>
    </Dialog>
  )
}
