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

export function getInitialLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') return 'en'

  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
  if (isSupportedLanguage(stored)) return stored

  const browserLanguage = window.navigator.language.slice(0, 2)
  if (isSupportedLanguage(browserLanguage)) return browserLanguage

  return 'en'
}
