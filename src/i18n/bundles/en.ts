// English as the app ships it: every namespace but `admin`, which loads
// with the first screen that asks for it (#414). Every other language falls
// back to this one, so it is always there.
import type { ResourceKey } from 'i18next'
import auth from '@/i18n/locales/en/auth.json'
import billing from '@/i18n/locales/en/billing.json'
import chapter from '@/i18n/locales/en/chapter.json'
import chat from '@/i18n/locales/en/chat.json'
import common from '@/i18n/locales/en/common.json'
import errors from '@/i18n/locales/en/errors.json'
import legal from '@/i18n/locales/en/legal.json'
import parent from '@/i18n/locales/en/parent.json'
import practice from '@/i18n/locales/en/practice.json'
import starmap from '@/i18n/locales/en/starmap.json'
import support from '@/i18n/locales/en/support.json'
import teacher from '@/i18n/locales/en/teacher.json'
import uploads from '@/i18n/locales/en/uploads.json'
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
