import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import i18n from '@/i18n'
import { resolveUserLanguage } from '@/i18n/languages'
import { ApiError, SESSION_UNREACHABLE } from '@/services/api/httpClient'
import { getCurrentUser } from '@/services/auth/authApi'
import { useAuthStore } from '@/store/authStore'

export function useCurrentUserQuery() {
  const accessToken = useAuthStore((state) => state.accessToken)
  const setUser = useAuthStore((state) => state.setUser)
  const appliedStoredLocale = useRef(false)

  const query = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getCurrentUser,
    enabled: Boolean(accessToken),
    // A session that could not be renewed because the server was out of reach
    // (a deploy, a dropped connection) is still there: keep asking, backing
    // off, and the account comes back with the server. Anything else is not
    // retried — a refusal has already signed the reader out (#214).
    retry: (_count, error) => error instanceof ApiError && error.code === SESSION_UNREACHABLE,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
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
