import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import i18n from '@/i18n'
import { resolveUserLanguage } from '@/i18n/languages'
import { ApiError, SESSION_UNREACHABLE } from '@/services/api/httpClient'
import { getCurrentUser } from '@/services/auth/authApi'
import { useAuthStore } from '@/store/authStore'

/**
 * Whether to read the account again after `error`.
 *
 * Only when the access token had run out and `/auth/refresh` could not be
 * reached: that session is still there, so keep asking — with TanStack's own
 * backoff, capped at 30 s — and the account comes back with the server. No
 * limit on attempts: an outage longer than a few retries would otherwise leave
 * "Konto wird geladen…" up until a reload. Anything else is not retried; a
 * refusal has already signed the reader out (#214). (An `/auth/me` that fails
 * on its own, without a 401, is not covered here.)
 */
export function retryAccountRead(_failureCount: number, error: unknown): boolean {
  return error instanceof ApiError && error.code === SESSION_UNREACHABLE
}

export function useCurrentUserQuery() {
  const accessToken = useAuthStore((state) => state.accessToken)
  const setUser = useAuthStore((state) => state.setUser)
  const appliedStoredLocale = useRef(false)

  const query = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getCurrentUser,
    enabled: Boolean(accessToken),
    retry: retryAccountRead,
  })

  useEffect(() => {
    if (!query.data) return
    setUser(query.data)

    // The stored preference is adopted once, when the account is first read.
    // Re-applying it on every refetch of /auth/me fought the language switcher:
    // the switcher's own preference write invalidates this query, and the read
    // that follows could still carry the previous locale and snap the whole UI
    // back to it a moment after the student changed it.
    if (appliedStoredLocale.current) return
    appliedStoredLocale.current = true

    const locale = resolveUserLanguage(query.data)
    if (locale && i18n.language !== locale) {
      void i18n.changeLanguage(locale)
    }
  }, [query.data, setUser])

  return query
}
