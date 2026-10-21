// German as a tab read in it loads it, in one piece: every namespace but
// `admin`, which loads with the first screen that asks for it (#414).
import type { ResourceKey } from 'i18next'
import auth from '@/i18n/locales/de/auth.json'
import billing from '@/i18n/locales/de/billing.json'
import chapter from '@/i18n/locales/de/chapter.json'
import chat from '@/i18n/locales/de/chat.json'
import common from '@/i18n/locales/de/common.json'
import errors from '@/i18n/locales/de/errors.json'
import legal from '@/i18n/locales/de/legal.json'
import parent from '@/i18n/locales/de/parent.json'
import practice from '@/i18n/locales/de/practice.json'
import starmap from '@/i18n/locales/de/starmap.json'
import support from '@/i18n/locales/de/support.json'
import teacher from '@/i18n/locales/de/teacher.json'
import uploads from '@/i18n/locales/de/uploads.json'
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
