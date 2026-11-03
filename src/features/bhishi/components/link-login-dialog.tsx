import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Select } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast-context'
import { Field } from './field'
import { useLinkMemberProfile } from '../hooks/use-bhishi'
import type { MemberRow, ProfileRow } from '../types'

interface LinkLoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: MemberRow | null
  profiles: ProfileRow[]
  linkedProfileIds: Set<string>
}

/** The form only mounts while open, so the chosen account starts fresh. */
export function LinkLoginDialog({
  open,
  onOpenChange,
  member,
  profiles,
  linkedProfileIds,
}: LinkLoginDialogProps) {
  if (!open || !member) return null
  return (
    <LinkLoginForm
      member={member}
      profiles={profiles}
      linkedProfileIds={linkedProfileIds}
      onClose={() => onOpenChange(false)}
    />
  )
}

function LinkLoginForm({
  member,
  profiles,
  linkedProfileIds,
  onClose,
}: {
  member: MemberRow
  profiles: ProfileRow[]
  linkedProfileIds: Set<string>
  onClose: () => void
}) {
  const { toast } = useToast()
  const mutation = useLinkMemberProfile()
  const available = profiles.filter(
    (profile) =>
      profile.is_active &&
      profile.role === 'member' &&
      !linkedProfileIds.has(profile.id) &&
      profile.id !== member.profile_id,
  )
  const [profileId, setProfileId] = useState(available[0]?.id ?? '')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = () => {
    if (!profileId) {
      setError('Choose the login account to link.')
      return
    }

    mutation.mutate(
      { memberId: member.id, profileId },
      {
        onSuccess: () => {
          toast({
            title: 'Login linked',
            description: `${member.full_name} can now see this group on their phone.`,
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
      title="Link a login"
      description={`Connect a signed-in account to ${member.full_name} so they can view their own Bhishi.`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={mutation.isPending}
            disabled={available.length === 0}
          >
            Link login
          </Button>
        </>
      }
    >
      {available.length === 0 ? (
        <p className="rounded-lg bg-muted px-3 py-3 text-sm text-muted-foreground">
          No unlinked member logins are available. Ask the member to sign in once and complete their
          profile, then try again.
        </p>
      ) : (
        <div className="space-y-4">
          <Field label="Login account" htmlFor="link-profile" required>
            <Select
              id="link-profile"
              value={profileId}
              onChange={(event) => setProfileId(event.target.value)}
            >
              {available.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.full_name}
                  {profile.email ? ` · ${profile.email}` : ''}
                </option>
              ))}
            </Select>
          </Field>
          {error ? (
            <p
              className="rounded-lg bg-destructive-soft px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {error}
            </p>
          ) : null}
        </div>
      )}
    </Dialog>
  )
}
