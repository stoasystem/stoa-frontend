import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import i18n from '@/i18n'
import { resolveUserLanguage } from '@/i18n/languages'
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
    retry: false,
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
