import { Home, SearchX } from 'lucide-react'
import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button-variants'
import { ROUTES } from '@/lib/constants'
import { useDocumentTitle } from '@/hooks/use-document-title'

export function NotFoundPage() {
  useDocumentTitle('Page not found')

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <SearchX className="h-8 w-8" aria-hidden="true" />
        </div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-primary">404</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-secondary">
          We couldn&apos;t find that page
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          The page may have moved, or the link may be incomplete.
        </p>
        <Link to={ROUTES.admin.dashboard} className={buttonVariants({ className: 'mt-7' })}>
          <Home className="h-4 w-4" aria-hidden="true" />
          Back to dashboard
        </Link>
      </div>
    </main>
  )
}
