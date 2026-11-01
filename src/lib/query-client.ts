import { QueryClient } from '@tanstack/react-query'

/**
 * Shared TanStack Query client.
 * Data fetching is intentionally absent in Sprint 1; defaults are ready for
 * the Supabase-backed queries introduced in Sprint 2.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})
