import { QueryClient } from '@tanstack/react-query'

/**
 * Shared TanStack Query client.
 * Data fetching is intentionally absent until Sprint 3; defaults are ready for
 * the Neon Data API-backed queries introduced by the auth sprint.
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
