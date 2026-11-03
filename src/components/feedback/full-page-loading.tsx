import { Logo } from '@/components/common/logo'
import { Spinner } from '@/components/ui/spinner'

/** Full-screen fallback for lazily loaded pages outside an app shell. */
export function FullPageLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background px-6">
      <Logo size="lg" showTagline />
      <Spinner size="md" label="Loading Bachat Book" className="text-primary" />
    </div>
  )
}
