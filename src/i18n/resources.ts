import type { Resource, ResourceKey } from 'i18next'
import english from '@/i18n/bundles/en'
import { isSupportedLanguage, type SupportedLanguage } from '@/i18n/languages'
import type { StartupNamespace } from '@/i18n/namespaces'

/*
 * Where the copy comes from (#414). All four languages used to ship inside the
 * app: 143 kB gzip, 37% of the JavaScript before the first screen, when a
 * reader needs one language and English under it.
 */

/**
 * The copy inside the app: English, which every language falls back to.
 * tests/setup.ts puts all four languages here in full, so a test switches
 * language without waiting for one to load.
 */
export const bundledResources: Resource = { en: english }

type OtherLanguage = Exclude<SupportedLanguage, 'en'>

/** Each other language in one piece, loaded when a tab is read in it. */
const languageBundles: Record<OtherLanguage, () => Promise<{ default: Record<StartupNamespace, ResourceKey> }>> = {
  de: () => import('@/i18n/bundles/de'),
  fr: () => import('@/i18n/bundles/fr'),
  it: () => import('@/i18n/bundles/it'),
}

/** `admin` in each language, loaded with the first screen that asks for it. */
const adminBundles: Record<SupportedLanguage, () => Promise<{ default: ResourceKey }>> = {
  en: () => import('@/i18n/locales/en/admin.json'),
  de: () => import('@/i18n/locales/de/admin.json'),
  fr: () => import('@/i18n/locales/fr/admin.json'),
  it: () => import('@/i18n/locales/it/admin.json'),
}

/**
 * One namespace in one language. Rejects for a language or namespace there
 * is no copy for, and when the download fails; i18next then shows that text
 * in English.
 */
export async function loadNamespace(language: string, namespace: string): Promise<ResourceKey> {
  if (!isSupportedLanguage(language)) throw new Error(`No copy in "${language}"`)
  if (namespace === 'admin') return (await adminBundles[language]()).default
  const bundle = language === 'en' ? english : (await languageBundles[language]()).default
  const copy = bundle[namespace as StartupNamespace]
  if (copy === undefined) throw new Error(`No "${namespace}" copy in "${language}"`)
  return copy
}
