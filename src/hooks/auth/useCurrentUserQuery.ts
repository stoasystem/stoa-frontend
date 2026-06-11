import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import i18n from '@/i18n'
import { isSupportedLanguage } from '@/i18n/languages'
import { getCurrentUser } from '@/services/auth/authApi'
import { useAuthStore } from '@/store/authStore'

export function useCurrentUserQuery() {
  const accessToken = useAuthStore((state) => state.accessToken)
  const setUser = useAuthStore((state) => state.setUser)

  const query = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getCurrentUser,
    enabled: Boolean(accessToken),
    retry: false,
  })

  useEffect(() => {
    if (query.data) {
      setUser(query.data)
      const locale = query.data.effectiveLocale ?? query.data.preferredLocale ?? query.data.preferredLanguage
      if (isSupportedLanguage(locale) && i18n.language !== locale) {
        void i18n.changeLanguage(locale)
      }
    }
  }, [query.data, setUser])

  return query
}
