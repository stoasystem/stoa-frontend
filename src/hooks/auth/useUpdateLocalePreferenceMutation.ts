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
      // Content is no longer refetched here. Requests carry Accept-Language, so
      // the refetch that i18n.changeLanguage() already triggered came back in
      // the new language; invalidating again only replayed every curriculum
      // query a second time and left the screen on skeletons for both rounds.
      // This call now only persists the preference for the student's next
      // session and their other devices.
    },
  })
}
