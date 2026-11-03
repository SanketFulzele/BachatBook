import { useNavigate } from 'react-router-dom'
import { LogOut, UserRound } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown'
import { useToast } from '@/components/ui/toast-context'
import { useAuth } from '@/features/auth/components/auth-context'
import { ROUTES } from '@/lib/constants'

/**
 * Profile menu for the signed-in user.
 *
 * Identity comes from the AuthProvider, which reads public.profiles through the
 * Data API. Sign-out calls Managed Better Auth and then clears local state.
 */
export function ProfileMenu() {
  const auth = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const user = auth.user

  if (!user) return null

  const isAdmin = user.role === 'admin'
  const profileHref = isAdmin ? ROUTES.admin.profile : ROUTES.member.profile

  const handleSignOut = async () => {
    await auth.signOut()
    toast({
      title: 'Signed out',
      description: 'Your session has ended.',
      variant: 'success',
    })
    void navigate(ROUTES.login, { replace: true })
  }

  return (
    <DropdownMenu
      label="Open profile menu"
      trigger={
        <span className="flex items-center gap-2.5 rounded-lg px-1 py-1 hover:bg-muted/70">
          <Avatar name={user.fullName} size="sm" decorative />
          <span className="hidden min-w-0 text-left md:block">
            <span className="block truncate text-sm font-semibold leading-tight text-foreground">
              {user.fullName}
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
        <span className="block normal-case tracking-normal text-foreground">{user.fullName}</span>
        {user.email ? (
          <span className="mt-0.5 block truncate normal-case tracking-normal font-normal text-muted-foreground">
            {user.email}
          </span>
        ) : null}
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
      <DropdownMenuSeparator />
      <DropdownMenuItem icon={LogOut} destructive onSelect={() => void handleSignOut()}>
        Sign out
      </DropdownMenuItem>
    </DropdownMenu>
  )
}
