import { QueryClient } from '@tanstack/react-query'

/**
 * Shared TanStack Query client.
 *
 * Authentication state is owned by AuthProvider, not by TanStack Query. The
 * cache is cleared on sign-out/session loss so a different account never sees
 * the previous user's cached data. Feature queries backed by the Neon Data API
 * are added in later sprints.
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
