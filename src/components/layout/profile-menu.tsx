import { Link, useNavigate } from 'react-router-dom'
import { ExternalLink, LogOut, Settings, UserRound } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown'
import { useToast } from '@/components/ui/toast-context'
import { ROUTES } from '@/lib/constants'

export interface ProfileMenuProps {
  name: string
  email: string
  role: 'admin' | 'member'
}

/**
 * Shared profile menu. Sign-out is a UI-only action until Sprint 3
 * introduces real sessions.
 */
export function ProfileMenu({ name, email, role }: ProfileMenuProps) {
  const navigate = useNavigate()
  const { toast } = useToast()

  const isAdmin = role === 'admin'
  const profileHref = isAdmin ? ROUTES.admin.settings : ROUTES.member.profile
  const switchHref = isAdmin ? ROUTES.member.dashboard : ROUTES.admin.dashboard

  return (
    <DropdownMenu
      label="Open profile menu"
      trigger={
        <span className="flex items-center gap-2.5 rounded-lg px-1 py-1 hover:bg-muted/70">
          <Avatar name={name} size="sm" decorative />
          <span className="hidden min-w-0 text-left md:block">
            <span className="block truncate text-sm font-semibold leading-tight text-foreground">
              {name}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {isAdmin ? 'Administrator' : 'Member'}
            </span>
          </span>
        </span>
      }
      menuClassName="w-60"
    >
      <DropdownMenuLabel>
        <span className="block normal-case tracking-normal text-foreground">{name}</span>
        <span className="mt-0.5 block truncate normal-case tracking-normal font-normal text-muted-foreground">
          {email}
        </span>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        icon={UserRound}
        onSelect={() => {
          void navigate(profileHref)
        }}
      >
        {isAdmin ? 'Account settings' : 'My profile'}
      </DropdownMenuItem>
      {isAdmin ? (
        <DropdownMenuItem
          icon={Settings}
          onSelect={() => {
            void navigate(ROUTES.admin.settings)
          }}
        >
          Workspace settings
        </DropdownMenuItem>
      ) : null}
      <DropdownMenuItem
        icon={ExternalLink}
        onSelect={() => {
          void navigate(switchHref)
        }}
      >
        {isAdmin ? 'Member portal preview' : 'Admin portal preview'}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        icon={LogOut}
        destructive
        onSelect={() => {
          toast({
            title: 'Preview mode',
            description: 'Authentication and sign-out will be available in Sprint 3.',
            variant: 'info',
          })
          void navigate(ROUTES.login)
        }}
      >
        Sign out
      </DropdownMenuItem>
    </DropdownMenu>
  )
}

export function PortalLink() {
  return (
    <Link
      to={ROUTES.admin.dashboard}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
    >
      Admin portal
      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
    </Link>
  )
}
