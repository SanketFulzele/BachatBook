import { Link2 } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { GroupMemberView, MemberRow } from '../types'

interface MemberListProps {
  members: GroupMemberView[]
  onLinkLogin?: (member: MemberRow) => void
}

export function MemberList({ members, onLinkLogin }: MemberListProps) {
  return (
    <div className="divide-y divide-border rounded-xl border border-border bg-card">
      {members.map((membership) => {
        const member = membership.member
        const linked = Boolean(member.profile_id)
        const inactive = membership.membership.status !== 'active' || !member.is_active

        return (
          <div key={membership.membership.id} className="flex items-center gap-3 px-3.5 py-3">
            <Avatar name={member.full_name} size="sm" decorative />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{member.full_name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {member.phone || member.email || 'No contact details'}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {inactive ? <Badge variant="outline">Inactive</Badge> : null}
              {linked ? (
                <Badge variant="success">Login linked</Badge>
              ) : onLinkLogin ? (
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Link2 className="h-3.5 w-3.5" />}
                  onClick={() => onLinkLogin(member)}
                >
                  Link login
                </Button>
              ) : (
                <Badge variant="outline">No login</Badge>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
