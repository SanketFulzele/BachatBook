import { useState, type FormEvent } from 'react'
import { LogOut, ShieldCheck, UserRound } from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast-context'
import { useAuth } from '@/features/auth/components/auth-context'
import { Field } from '@/features/bhishi/components/field'
import { useUpdateOwnProfile } from '@/features/bhishi/hooks/use-bhishi'

export function ProfilePage() {
  const auth = useAuth()
  const { toast } = useToast()
  const mutation = useUpdateOwnProfile()

  const user = auth.user
  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [error, setError] = useState<string | null>(null)

  if (!user) return null

  const isAdmin = user.role === 'admin'

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!fullName.trim()) {
      setError('Enter your name.')
      return
    }

    mutation.mutate(
      { fullName, phone },
      {
        onSuccess: () => {
          toast({ title: 'Profile updated', variant: 'success' })
        },
        onError: (mutationError) => setError(mutationError.message),
      },
    )
  }

  const handleSignOut = async () => {
    await auth.signOut()
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Profile" description="Your details and account." />

      <Card>
        <CardContent className="flex items-center gap-3 p-4 sm:p-5">
          <Avatar name={user.fullName} size="lg" decorative />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-secondary">{user.fullName}</p>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          </div>
          <Badge variant={isAdmin ? 'primary' : 'neutral'} withDot>
            {isAdmin ? 'Admin' : 'Member'}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 sm:p-5">
          <h2 className="text-base font-semibold text-secondary">Your details</h2>
          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <Field label="Full name" htmlFor="profile-name" required>
              <Input
                id="profile-name"
                className="h-11"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                autoComplete="name"
                maxLength={80}
                required
              />
            </Field>

            <Field label="Phone" htmlFor="profile-phone" hint="Used to contact you about payments.">
              <Input
                id="profile-phone"
                className="h-11"
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                autoComplete="tel"
                maxLength={20}
              />
            </Field>

            <Field
              label="Email"
              htmlFor="profile-email"
              hint="Your sign-in email cannot be changed here."
            >
              <Input id="profile-email" className="h-11" value={user.email} readOnly disabled />
            </Field>

            {error ? (
              <p
                className="rounded-lg bg-destructive-soft px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <Button type="submit" size="lg" className="w-full" isLoading={mutation.isPending}>
              <UserRound className="h-4 w-4" aria-hidden="true" />
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-4 sm:p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
            {isAdmin
              ? 'You can manage groups, members, payments and payouts.'
              : 'You can view your group, contributions and payment history.'}
          </div>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            leftIcon={<LogOut className="h-4 w-4" />}
            onClick={() => void handleSignOut()}
          >
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
