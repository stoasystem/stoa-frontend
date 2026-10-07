export const namespaces = [
  'common',
  'auth',
  'chat',
  'parent',
  'practice',
  'questionBank',
  'uploads',
  'tutor',
  'billing',
  'support',
  'legal',
  'admin',
  'errors',
  'starmap',
  'chapter',
] as const

export type I18nNamespace = (typeof namespaces)[number]
