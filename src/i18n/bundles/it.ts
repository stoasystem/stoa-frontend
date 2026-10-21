// Italian as a tab read in it loads it, in one piece: every namespace but
// `admin`, which loads with the first screen that asks for it (#414).
import type { ResourceKey } from 'i18next'
import auth from '@/i18n/locales/it/auth.json'
import billing from '@/i18n/locales/it/billing.json'
import chapter from '@/i18n/locales/it/chapter.json'
import chat from '@/i18n/locales/it/chat.json'
import common from '@/i18n/locales/it/common.json'
import errors from '@/i18n/locales/it/errors.json'
import legal from '@/i18n/locales/it/legal.json'
import parent from '@/i18n/locales/it/parent.json'
import practice from '@/i18n/locales/it/practice.json'
import starmap from '@/i18n/locales/it/starmap.json'
import support from '@/i18n/locales/it/support.json'
import teacher from '@/i18n/locales/it/teacher.json'
import uploads from '@/i18n/locales/it/uploads.json'
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
