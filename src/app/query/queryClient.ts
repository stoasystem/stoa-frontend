import { MutationCache, QueryClient } from '@tanstack/react-query'

/**
 * Signing out clears this client (useSignOut), which removes every mutation
 * with it. A mutation still in flight keeps running regardless, and its own
 * onSuccess - several call setQueryData - would write the signed-out person's
 * answer into the cache the next person reads. A mutation that is no longer
 * in the cache when it succeeds is therefore failed here, before its own
 * callbacks run. Queries need no such guard: clearing cancels their fetches,
 * and a cancelled fetch never writes.
 */
export class SignedOutMutationError extends Error {
  constructor() {
    super('Signed out before this request finished')
    this.name = 'SignedOutMutationError'
  }
}

const mutationCache: MutationCache = new MutationCache({
  onSuccess: (_data, _variables, _context, mutation) => {
    if (!mutationCache.getAll().some((held) => held === mutation)) {
      throw new SignedOutMutationError()
    }
  },
})

/** How many times a failed read is asked again, unless a query says otherwise. */
export const APP_QUERY_RETRIES = 1

export const queryClient = new QueryClient({
  mutationCache,
  defaultOptions: {
    queries: {
      retry: APP_QUERY_RETRIES,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60,
    },
  },
})
