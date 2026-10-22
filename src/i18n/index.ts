import i18n, { type BackendModule } from 'i18next'
import { initReactI18next } from 'react-i18next'
import {
  getInitialLanguage,
  LANGUAGE_STORAGE_KEY,
  noteLanguageSwitch,
  setShownLanguage,
  type SupportedLanguage,
} from '@/i18n/languages'
import { startupNamespaces } from '@/i18n/namespaces'
import { bundledResources, loadNamespace } from '@/i18n/resources'

/**
 * Fetches the copy the app does not ship (#414). i18next asks for it before
 * it shows a language: at start-up for the language read from storage or the
 * browser, on a switch for the new one, and for `admin` when a screen first
 * asks for it (react-i18next suspends that screen until then).
 *
 * A failed download is not retried: the browser keeps a failed module for
 * the page, so only a reload fetches it again. Until then that text reads in
 * English, or shows its keys where the English copy is on demand too and
 * failed as well (`admin`); the next page load asks again.
 */
const onDemandCopy: BackendModule = {
  type: 'backend',
  init() {},
  read(language, namespace, callback) {
    loadNamespace(language, namespace).then(
      (copy) => callback(null, copy),
      (error: Error) => callback(error, false),
    )
  },
}

function syncDocumentLanguage(language: string) {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = language
  }
}

/** Set once the language the app starts in is in. */
let started = false

/**
 * Settles once the language the app starts in, and English under it, are
 * in; main.tsx renders nothing before. Never rejects: a language that fails
 * to load starts in English.
 */
export const i18nReady = i18n
  .use(onDemandCopy)
  .use(initReactI18next)
  .init(
    {
      resources: bundledResources,
      // English ships with the app; the rest comes from `onDemandCopy`.
      partialBundledLanguages: true,
      lng: getInitialLanguage(),
      fallbackLng: 'en',
      // A copy: i18next adds `admin` to this list once a screen loads it, so
      // a switch then loads it in the new language too.
      ns: [...startupNamespaces],
      defaultNS: 'common',
      fallbackNS: 'common',
      interpolation: {
        escapeValue: false,
      },
    },
    // Called right after the `languageChanged` the start-up language brings.
    () => {
      started = true
    },
  )

syncDocumentLanguage(i18n.language)
setShownLanguage(i18n.language)

// Emitted as a switch starts, before the language loads. A call with no
// language changes nothing and is never followed by `languageChanged`.
i18n.on('languageChanging', (language?: string) => {
  if (language) noteLanguageSwitch()
})

// i18next emits this once the new language is in, never before (#414).
i18n.on('languageChanged', (language) => {
  syncDocumentLanguage(language)
  // Before anything else hears of the switch: AppProviders refetches every
  // query on it, and those requests must already go out in the new language.
  setShownLanguage(language)
  // The start-up language arriving: read from storage or the browser, not
  // chosen, so not written back.
  if (!started) return
  // The choice for the next page load, in any tab. Other tabs open now keep
  // the language they show (#403).
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language as SupportedLanguage)
    } catch {
      // Storage is blocked or full (#345): the switch still applies to this
      // page, it just is not remembered for the next one.
    }
  }
})

export default i18n
