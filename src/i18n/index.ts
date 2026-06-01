import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { getInitialLanguage, LANGUAGE_STORAGE_KEY, type SupportedLanguage } from '@/i18n/languages'
import { namespaces } from '@/i18n/namespaces'
import enCommon from '@/i18n/locales/en/common.json'
import enHome from '@/i18n/locales/en/home.json'
import enAuth from '@/i18n/locales/en/auth.json'
import enChat from '@/i18n/locales/en/chat.json'
import enParent from '@/i18n/locales/en/parent.json'
import enPractice from '@/i18n/locales/en/practice.json'
import enQuestionBank from '@/i18n/locales/en/questionBank.json'
import enUploads from '@/i18n/locales/en/uploads.json'
import enLiveClassroom from '@/i18n/locales/en/liveClassroom.json'
import enTutor from '@/i18n/locales/en/tutor.json'
import enPricing from '@/i18n/locales/en/pricing.json'
import enBilling from '@/i18n/locales/en/billing.json'
import enSupport from '@/i18n/locales/en/support.json'
import enContact from '@/i18n/locales/en/contact.json'
import enAdmin from '@/i18n/locales/en/admin.json'
import enErrors from '@/i18n/locales/en/errors.json'
import deCommon from '@/i18n/locales/de/common.json'
import deHome from '@/i18n/locales/de/home.json'
import deAuth from '@/i18n/locales/de/auth.json'
import deChat from '@/i18n/locales/de/chat.json'
import deParent from '@/i18n/locales/de/parent.json'
import dePractice from '@/i18n/locales/de/practice.json'
import deQuestionBank from '@/i18n/locales/de/questionBank.json'
import deUploads from '@/i18n/locales/de/uploads.json'
import deLiveClassroom from '@/i18n/locales/de/liveClassroom.json'
import deTutor from '@/i18n/locales/de/tutor.json'
import dePricing from '@/i18n/locales/de/pricing.json'
import deBilling from '@/i18n/locales/de/billing.json'
import deSupport from '@/i18n/locales/de/support.json'
import deContact from '@/i18n/locales/de/contact.json'
import deAdmin from '@/i18n/locales/de/admin.json'
import deErrors from '@/i18n/locales/de/errors.json'
import frCommon from '@/i18n/locales/fr/common.json'
import frHome from '@/i18n/locales/fr/home.json'
import frAuth from '@/i18n/locales/fr/auth.json'
import frChat from '@/i18n/locales/fr/chat.json'
import frParent from '@/i18n/locales/fr/parent.json'
import frPractice from '@/i18n/locales/fr/practice.json'
import frQuestionBank from '@/i18n/locales/fr/questionBank.json'
import frUploads from '@/i18n/locales/fr/uploads.json'
import frLiveClassroom from '@/i18n/locales/fr/liveClassroom.json'
import frTutor from '@/i18n/locales/fr/tutor.json'
import frPricing from '@/i18n/locales/fr/pricing.json'
import frBilling from '@/i18n/locales/fr/billing.json'
import frSupport from '@/i18n/locales/fr/support.json'
import frContact from '@/i18n/locales/fr/contact.json'
import frAdmin from '@/i18n/locales/fr/admin.json'
import frErrors from '@/i18n/locales/fr/errors.json'
import itCommon from '@/i18n/locales/it/common.json'
import itHome from '@/i18n/locales/it/home.json'
import itAuth from '@/i18n/locales/it/auth.json'
import itChat from '@/i18n/locales/it/chat.json'
import itParent from '@/i18n/locales/it/parent.json'
import itPractice from '@/i18n/locales/it/practice.json'
import itQuestionBank from '@/i18n/locales/it/questionBank.json'
import itUploads from '@/i18n/locales/it/uploads.json'
import itLiveClassroom from '@/i18n/locales/it/liveClassroom.json'
import itTutor from '@/i18n/locales/it/tutor.json'
import itPricing from '@/i18n/locales/it/pricing.json'
import itBilling from '@/i18n/locales/it/billing.json'
import itSupport from '@/i18n/locales/it/support.json'
import itContact from '@/i18n/locales/it/contact.json'
import itAdmin from '@/i18n/locales/it/admin.json'
import itErrors from '@/i18n/locales/it/errors.json'

export const resources = {
  en: {
    common: enCommon,
    home: enHome,
    auth: enAuth,
    chat: enChat,
    parent: enParent,
    practice: enPractice,
    questionBank: enQuestionBank,
    uploads: enUploads,
    liveClassroom: enLiveClassroom,
    tutor: enTutor,
    pricing: enPricing,
    billing: enBilling,
    support: enSupport,
    contact: enContact,
    admin: enAdmin,
    errors: enErrors,
  },
  de: {
    common: deCommon,
    home: deHome,
    auth: deAuth,
    chat: deChat,
    parent: deParent,
    practice: dePractice,
    questionBank: deQuestionBank,
    uploads: deUploads,
    liveClassroom: deLiveClassroom,
    tutor: deTutor,
    pricing: dePricing,
    billing: deBilling,
    support: deSupport,
    contact: deContact,
    admin: deAdmin,
    errors: deErrors,
  },
  fr: {
    common: frCommon,
    home: frHome,
    auth: frAuth,
    chat: frChat,
    parent: frParent,
    practice: frPractice,
    questionBank: frQuestionBank,
    uploads: frUploads,
    liveClassroom: frLiveClassroom,
    tutor: frTutor,
    pricing: frPricing,
    billing: frBilling,
    support: frSupport,
    contact: frContact,
    admin: frAdmin,
    errors: frErrors,
  },
  it: {
    common: itCommon,
    home: itHome,
    auth: itAuth,
    chat: itChat,
    parent: itParent,
    practice: itPractice,
    questionBank: itQuestionBank,
    uploads: itUploads,
    liveClassroom: itLiveClassroom,
    tutor: itTutor,
    pricing: itPricing,
    billing: itBilling,
    support: itSupport,
    contact: itContact,
    admin: itAdmin,
    errors: itErrors,
  },
} as const

function syncDocumentLanguage(language: string) {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = language
  }
}

void i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    ns: namespaces,
    defaultNS: 'common',
    fallbackNS: 'common',
    interpolation: {
      escapeValue: false,
    },
  })

syncDocumentLanguage(i18n.language)

i18n.on('languageChanged', (language) => {
  syncDocumentLanguage(language)
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language as SupportedLanguage)
  }
})

export default i18n
