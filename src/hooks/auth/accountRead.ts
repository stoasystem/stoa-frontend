import { useQuery } from '@tanstack/react-query'
import { ApiError, SESSION_UNREACHABLE } from '@/services/api/httpClient'
import { getCurrentUser } from '@/services/auth/authApi'
import { isSameSession, storedRefreshToken } from '@/services/auth/sessionRefresh'
import { currentSessionToken, useAuthStore } from '@/store/authStore'

// The read of this tab's account. Kept apart from `useCurrentUserQuery`, which
// also applies the account's language, so the route guard can wait on the read
// without loading i18n's set-up (#250).

/**
 * Whether to read the account again after `error`.
 *
 * Only when the access token had run out and `/auth/refresh` could not be
 * reached: that session is still there, so keep asking — with TanStack's own
 * backoff, capped at 30 s — and the account comes back with the server. No
 * limit on attempts: an outage longer than a few retries would otherwise leave
 * "Konto wird geladen…" up until a reload. Anything else is not retried; a
 * refusal has already signed the reader out (#214). An `/auth/me` that fails
 * on its own (a 500, a 403) is not retried either: `AccountLoadStatus` shows
 * it, with a retry and a sign-out (#250).
 */
export function retryAccountRead(_failureCount: number, error: unknown): boolean {
  return error instanceof ApiError && error.code === SESSION_UNREACHABLE
}

/**
 * The account the tab's session belongs to. An answer to a read sent under
 * another session - the tab signed somebody else in while it was out - is not
 * this session's account, and is dropped rather than shown (tab-account audit
 * F2): the query key does not say whose session asked.
 */
export async function readCurrentAccount() {
  const sender = currentSessionToken()
  const senderRefresh = storedRefreshToken()
  const account = await getCurrentUser()
  // A renewal while the read was out changes the access token and keeps the
  // session; only a different session makes the answer someone else's.
  const sameSession = currentSessionToken() === sender || (sender !== null && isSameSession(senderRefresh))
  if (!sameSession) {
    throw new ApiError('The session changed while the account was being read.', { status: 401, code: 'session_changed' })
  }
  return account
}

/**
 * The read of this tab's account, without acting on its answer: for screens
 * that wait on it (#250). `useCurrentUserQuery`, mounted once in
 * `AuthBootstrap`, is the one that stores the account.
 */
export function useAccountRead() {
  const accessToken = useAuthStore((state) => state.accessToken)

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: readCurrentAccount,
    enabled: Boolean(accessToken),
    retry: retryAccountRead,
  })
}
