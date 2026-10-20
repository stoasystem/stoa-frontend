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
  { code: 'fr', label: 'Français', shortLabel: 'FR' },
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
 * The language saved by the last switch, or null. A browser that blocks site
 * storage throws on any access to localStorage; that must not stop the app
 * from starting (#345), so it reads as nothing saved.
 */
export function storedLanguage(): string | null {
  try {
    return window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
  } catch {
    return null
  }
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

  const stored = storedLanguage()
  if (isSupportedLanguage(stored)) return stored

  const browserLanguage = window.navigator.language.slice(0, 2)
  if (isSupportedLanguage(browserLanguage)) return browserLanguage

  return 'en'
}

/** The language to start i18next in. Same resolution as activeLanguage(). */
export function getInitialLanguage(): SupportedLanguage {
  return activeLanguage()
}

/**
 * The locale every date, number and currency is formatted in (#280).
 *
 * Every reader is in Switzerland, so each UI language formats the Swiss way:
 * 12'345.5, CHF 1'234.50, a 24-hour clock with the day before the month, also
 * in English. i18next keeps the bare language code; this is the one place that
 * turns it into the formatting locale, so no `Intl` or `toLocale*` call names
 * a locale of its own.
 */
export const formattingLocales: Record<SupportedLanguage, string> = {
  de: 'de-CH',
  en: 'en-CH',
  fr: 'fr-CH',
  it: 'it-CH',
}

/**
 * The formatting locale for a UI language: `i18n.language`, a stored code, or
 * nothing for the language the app is read in right now. A regional code such
 * as "de-DE" is read by its language; anything unsupported falls back to the
 * active language.
 */
export function formattingLocale(language?: string | null): string {
  const code = language?.slice(0, 2).toLowerCase()
  return formattingLocales[isSupportedLanguage(code) ? code : activeLanguage()]
}
