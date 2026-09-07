export const LANGUAGE_STORAGE_KEY = 'stoa_language'

export const supportedLanguages = ['en', 'de', 'fr', 'it'] as const

export type SupportedLanguage = (typeof supportedLanguages)[number]

export type LanguageOption = {
  code: SupportedLanguage
  label: string
  shortLabel: string
}

export const languageOptions: LanguageOption[] = [
  { code: 'en', label: 'English', shortLabel: 'EN' },
  { code: 'de', label: 'Deutsch', shortLabel: 'DE' },
  { code: 'fr', label: 'Francais', shortLabel: 'FR' },
  { code: 'it', label: 'Italiano', shortLabel: 'IT' },
]

export function isSupportedLanguage(value: string | null | undefined): value is SupportedLanguage {
  return supportedLanguages.includes(value as SupportedLanguage)
}

export function resolveUserLanguage(user: {
  effectiveLocale?: string
  preferredLocale?: string
  preferredLanguage?: string
}): SupportedLanguage | undefined {
  const locale = user.effectiveLocale ?? user.preferredLocale ?? user.preferredLanguage
  return isSupportedLanguage(locale) ? locale : undefined
}

/**
 * The language the app is being read in right now.
 *
 * Read from storage rather than from the i18n instance, so modules that only
 * need to label a request — the HTTP clients, which every screen imports —
 * do not have to pull in i18next and its initialisation. `languageChanged`
 * writes this key synchronously (see i18n/index.ts), so it stays current.
 */
export function activeLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') return 'en'

  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
  if (isSupportedLanguage(stored)) return stored

  const browserLanguage = window.navigator.language.slice(0, 2)
  if (isSupportedLanguage(browserLanguage)) return browserLanguage

  return 'en'
}

/** The language to start i18next in. Same resolution as activeLanguage(). */
export function getInitialLanguage(): SupportedLanguage {
  return activeLanguage()
}
