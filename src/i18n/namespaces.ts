export const namespaces = [
  'common',
  'home',
  'auth',
  'chat',
  'parent',
  'tutor',
  'pricing',
  'billing',
  'support',
  'contact',
  'admin',
  'errors',
] as const

export type I18nNamespace = (typeof namespaces)[number]
