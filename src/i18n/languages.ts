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
 * The language this tab shows, once i18n has started (i18n/index.ts sets it
 * then and on every `languageChanged`). Kept here rather than read off the
 * i18n instance, so modules that only need to label a request — the HTTP
 * clients, which every screen imports — do not pull in i18next.
 *
 * Not the stored key: that is shared by every tab of the browser, so one
 * tab's switch relabelled another tab's requests while its screen stayed in
 * the old language, and with storage blocked it never changed at all (#403).
 */
let shownLanguage: SupportedLanguage | null = null

/**
 * Record the language this tab now shows. Only i18n/index.ts calls this. A
 * code i18n has no copy for is shown in English, its fallback language.
 */
export function setShownLanguage(language: string) {
  const code = language.slice(0, 2).toLowerCase()
  shownLanguage = isSupportedLanguage(code) ? code : 'en'
}

/** The language the app is being read in right now, in this tab. */
export function activeLanguage(): SupportedLanguage {
  return shownLanguage ?? getInitialLanguage()
}

/** The language to start i18next in: the last one chosen, else the browser's. */
export function getInitialLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') return 'en'

  const stored = storedLanguage()
  if (isSupportedLanguage(stored)) return stored

  const browserLanguage = window.navigator.language.slice(0, 2)
  if (isSupportedLanguage(browserLanguage)) return browserLanguage

  return 'en'
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
