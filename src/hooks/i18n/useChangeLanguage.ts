import { useTranslation } from 'react-i18next'
import { useUpdateLocalePreferenceMutation } from '@/hooks/auth/useUpdateLocalePreferenceMutation'
import { isSupportedLanguage, type SupportedLanguage } from '@/i18n/languages'
import { useAuthStore } from '@/store/authStore'

/** Each language's own name, from `common:language.*`. */
export const languageNameKeys: Record<SupportedLanguage, string> = {
  en: 'language.english',
  de: 'language.german',
  fr: 'language.french',
  it: 'language.italian',
}

/**
 * Switch the app's language, and for a signed-in account record the choice
 * for next time. The screen changes at once; the writes go out one after
 * another, the last choice is the one stored, and a failed one says so.
 *
 * While an administrator's reset stands the choice is not recorded: the
 * backend refuses everything but the password change, and the switch is what
 * lets a reader whose stored language is not theirs read that change (#412).
 */
export function useChangeLanguage() {
  const { i18n } = useTranslation('common')
  const user = useAuthStore((state) => state.user)
  const updateLocale = useUpdateLocalePreferenceMutation()
  const current: SupportedLanguage = isSupportedLanguage(i18n.language) ? i18n.language : 'en'

  function changeLanguage(language: SupportedLanguage) {
    if (language === i18n.language) return
    void i18n.changeLanguage(language)
    if (user && !user.mustChangePassword) updateLocale.mutate(language)
  }

  return { current, changeLanguage }
}
