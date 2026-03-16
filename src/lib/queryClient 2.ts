import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,       // 1 minute — prevents immediate refetch on mount
      retry: 1,                    // one retry on transient failures
      refetchOnWindowFocus: false, // internal tool; no need for aggressive refetch
    },
  },
})
