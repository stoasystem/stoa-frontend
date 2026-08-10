export const namespaces = [
  'common',
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
  'legal',
  'admin',
  'errors',
] as const

export type I18nNamespace = (typeof namespaces)[number]
