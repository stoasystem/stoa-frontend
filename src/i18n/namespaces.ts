export const namespaces = [
  'common',
  'home',
  'homeV2',
  'auth',
  'chat',
  'parent',
  'practice',
  'questionBank',
  'uploads',
  'liveClassroom',
  'tutor',
  'pricing',
  'billing',
  'support',
  'contact',
  'admin',
  'errors',
] as const

export type I18nNamespace = (typeof namespaces)[number]
