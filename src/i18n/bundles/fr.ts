// French as a tab read in it loads it, in one piece: every namespace but
// `admin`, which loads with the first screen that asks for it (#414).
import type { ResourceKey } from 'i18next'
import auth from '@/i18n/locales/fr/auth.json'
import billing from '@/i18n/locales/fr/billing.json'
import chapter from '@/i18n/locales/fr/chapter.json'
import chat from '@/i18n/locales/fr/chat.json'
import common from '@/i18n/locales/fr/common.json'
import errors from '@/i18n/locales/fr/errors.json'
import legal from '@/i18n/locales/fr/legal.json'
import parent from '@/i18n/locales/fr/parent.json'
import practice from '@/i18n/locales/fr/practice.json'
import starmap from '@/i18n/locales/fr/starmap.json'
import support from '@/i18n/locales/fr/support.json'
import teacher from '@/i18n/locales/fr/teacher.json'
import uploads from '@/i18n/locales/fr/uploads.json'
import type { StartupNamespace } from '@/i18n/namespaces'

export default {
  common,
  auth,
  chat,
  parent,
  practice,
  uploads,
  teacher,
  billing,
  support,
  legal,
  errors,
  starmap,
  chapter,
} satisfies Record<StartupNamespace, ResourceKey>
