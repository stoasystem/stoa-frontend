import { useMutation } from '@tanstack/react-query'
import { queryClient } from '@/app/query/queryClient'
import { updateLocalePreference } from '@/services/auth/authApi'
import { useAuthStore } from '@/store/authStore'
import type { SupportedLanguage } from '@/i18n/languages'
import { practiceQueryKeys } from '@/services/practice/practiceQueryKeys'
import { questionBankQueryKeys } from '@/services/questionBank/questionBankQueryKeys'

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
      // The locale switch lands on the backend after this call resolves, so the
      // query-key change from i18n.changeLanguage() may have already refetched
      // curriculum content against the still-old persisted locale. Invalidate
      // once more now that the new locale is actually saved.
      void queryClient.invalidateQueries({ queryKey: practiceQueryKeys.all })
      void queryClient.invalidateQueries({ queryKey: questionBankQueryKeys.all })
    },
  })
}
