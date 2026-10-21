export const namespaces = [
  'common',
  'auth',
  'chat',
  'parent',
  'practice',
  'uploads',
  'teacher',
  'billing',
  'support',
  'legal',
  'admin',
  'errors',
  'starmap',
  'chapter',
] as const

export type I18nNamespace = (typeof namespaces)[number]

/**
 * Loaded with the first screen that asks for it, not with the app (#414):
 * only staff screens and account activation read `admin`, and it is about a
 * third of each language's copy.
 */
export type OnDemandNamespace = 'admin'

/** Loaded before the first screen, in the language shown and in English. */
export type StartupNamespace = Exclude<I18nNamespace, OnDemandNamespace>

export const startupNamespaces = namespaces.filter(
  (namespace): namespace is StartupNamespace => namespace !== 'admin',
)
