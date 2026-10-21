import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { queryClient, SignedOutMutationError } from '@/app/query/queryClient'
import { activeLanguage, languageShown, type SupportedLanguage } from '@/i18n/languages'
import { addressContext } from '@/lib/addressForm'
import { updateLocalePreference } from '@/services/auth/authApi'
import { useAuthStore } from '@/store/authStore'

export function useUpdateLocalePreferenceMutation() {
  const setUser = useAuthStore((state) => state.setUser)
  const { i18n } = useTranslation()

  const mutation = useMutation({
    // One write at a time, in the order they were chosen: switching
    // de → fr → it quickly sent three PATCHes at once, and whichever landed
    // last was stored, not necessarily Italian (#403).
    scope: { id: 'locale-preference' },
    mutationFn: (preferredLocale: SupportedLanguage) => updateLocalePreference(preferredLocale),
    onSuccess: (locale) => {
      // The account as it is now, not as it was when this write was queued.
      const user = useAuthStore.getState().user
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
    // The screen already shows the new language, but the next page load takes
    // the stored one from /auth/me and would switch back without a word.
    onError: async (error, language) => {
      if (error instanceof SignedOutMutationError) return
      // The write can fail before the language it is for has loaded (#414):
      // until then the screen shows the one before, and so would the toast.
      await languageShown()
      // A later choice is queued behind this one and reports for itself.
      if (language !== activeLanguage()) return
      const context = addressContext(useAuthStore.getState().user?.role)
      // Off the instance: the language has just changed under any `t` a
      // component holds.
      toast.error(i18n.t('common:language.saveFailed', { context }), {
        action: {
          label: i18n.t('common:actions.tryAgain'),
          onClick: () => {
            if (useAuthStore.getState().user) mutation.mutate(activeLanguage())
          },
        },
      })
    },
  })

  return mutation
}
