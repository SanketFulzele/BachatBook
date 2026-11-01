import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { ROUTES } from '@/lib/constants'

/** Router-level fallback for unexpected rendering errors. */
export function RouteErrorPage() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? `${error.status} — ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'An unexpected error occurred while rendering this page.'

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-card">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive-soft text-destructive">
          <AlertTriangle className="h-7 w-7" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-xl font-bold tracking-tight text-secondary">
          Something went wrong
        </h1>
        <p className="mt-2 break-words text-sm leading-6 text-muted-foreground">{message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button
            variant="outline"
            leftIcon={<RotateCcw className="h-4 w-4" />}
            onClick={() => window.location.reload()}
          >
            Reload page
          </Button>
          <Link to={ROUTES.admin.dashboard} className={buttonVariants()}>
            Go to dashboard
          </Link>
        </div>
      </div>
    </main>
  )
}
