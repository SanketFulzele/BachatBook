import { Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'
import { AppProviders } from '@/app/providers'
import { router } from '@/app/router'
import { FullPageLoading } from '@/components/feedback/full-page-loading'

export default function App() {
  return (
    <AppProviders>
      <Suspense fallback={<FullPageLoading />}>
        <RouterProvider router={router} />
      </Suspense>
    </AppProviders>
  )
}
