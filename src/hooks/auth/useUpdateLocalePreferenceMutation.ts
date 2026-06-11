import { useMutation } from '@tanstack/react-query'
import { queryClient } from '@/app/query/queryClient'
import { updateLocalePreference } from '@/services/auth/authApi'
import { useAuthStore } from '@/store/authStore'
import type { SupportedLanguage } from '@/i18n/languages'

export function useUpdateLocalePreferenceMutation() {
  const setUser = useAuthStore((state) => state.setUser)
  const user = useAuthStore((state) => state.user)

  return useMutation({
    mutationFn: (preferredLocale: SupportedLanguage) => updateLocalePreference(preferredLocale),
    onSuccess: (locale) => {
      if (user) {
        setUser({
          ...user,
          preferredLanguage: locale.effectiveLocale,
          preferredLocale: locale.preferredLocale,
          effectiveLocale: locale.effectiveLocale,
          supportedLocales: locale.supportedLocales,
        })
      }
      void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })
}
