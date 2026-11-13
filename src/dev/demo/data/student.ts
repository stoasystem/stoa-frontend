/* The demo student (#116): the signed-in user and the profile /me shows. A made-up person. */
import { demoSky } from '@/dev/demo/sky/demoSky'
import { supportedLanguages, type SupportedLanguage } from '@/i18n/languages'
import type { ProfileChoice, StudentProfile } from '@/types/student'
import type { User } from '@/types/user'

export const DEMO_STUDENT_ID = 'demo-student'

const NAME = 'Lena Muster'
const EMAIL = 'lena.muster@example.com'
const CREATED_AT = '2026-08-17T08:00:00.000Z'

/** The signed-in user, as `GET /auth/me` returns it (`CurrentUser` in the auth store). */
export function demoStudentFor(language: SupportedLanguage): User {
  return {
    id: DEMO_STUDENT_ID,
    name: NAME,
    email: EMAIL,
    role: 'student',
    preferredLanguage: language,
    preferredLocale: language,
    effectiveLocale: language,
    supportedLocales: [...supportedLanguages],
    subscriptionStatus: 'trial',
    plan: 'free_trial',
    subscription: { plan: 'free_trial', status: 'pilot_access' },
    emailVerificationStatus: 'verified',
    emailVerificationRequired: false,
    accountActivationStatus: 'active',
    mustChangePassword: false,
  }
}

/**
 * The year groups the backend offers (`choices.grade`, stoa-backend#310), in
 * its order, named as its `message_catalog` names them (`choice.grade.*`).
 * The client keeps no copy of these: only the demo backend does.
 */
const GRADE_LABELS: Record<string, Record<SupportedLanguage, string>> = {
  grade_1_primary: { de: '1. Primarklasse', en: 'Year 1 (primary school)', fr: '3e année primaire (3P)', it: '1ª elementare' },
  grade_2_primary: { de: '2. Primarklasse', en: 'Year 2 (primary school)', fr: '4e année primaire (4P)', it: '2ª elementare' },
  grade_3_primary: { de: '3. Primarklasse', en: 'Year 3 (primary school)', fr: '5e année primaire (5P)', it: '3ª elementare' },
  grade_4_primary: { de: '4. Primarklasse', en: 'Year 4 (primary school)', fr: '6e année primaire (6P)', it: '4ª elementare' },
  grade_5_primary: { de: '5. Primarklasse', en: 'Year 5 (primary school)', fr: '7e année primaire (7P)', it: '5ª elementare' },
  grade_6_primary: { de: '6. Primarklasse', en: 'Year 6 (primary school)', fr: '8e année primaire (8P)', it: '1ª media' },
  grade_7_secondary: { de: '7. Klasse (Sekundarstufe I)', en: 'Year 7 (lower secondary)', fr: '9e année (secondaire I)', it: '2ª media' },
  grade_8_secondary: { de: '8. Klasse (Sekundarstufe I)', en: 'Year 8 (lower secondary)', fr: '10e année (secondaire I)', it: '3ª media' },
  grade_9_secondary: { de: '9. Klasse (Sekundarstufe I)', en: 'Year 9 (lower secondary)', fr: '11e année (secondaire I)', it: '4ª media' },
  grade_secondary_i: {
    de: 'Sekundarstufe I, Schuljahr weiss ich nicht',
    en: 'Lower secondary, not sure which year',
    fr: 'Secondaire I, je ne sais pas quelle année',
    it: 'Scuola media, non so quale anno',
  },
  // Upper secondary, last (stoa-backend#419, #420).
  grade_secondary_ii: {
    de: 'Sekundarstufe II (Gymnasium, Mittelschule)',
    en: 'Upper secondary (Gymnasium)',
    fr: 'Secondaire II (gymnase, collège, lycée)',
    it: 'Scuola media superiore (liceo)',
  },
}

/** The codes of `choices.grade`, in the backend's order. */
export const DEMO_GRADE_CODES: readonly string[] = Object.keys(GRADE_LABELS)

export function demoGradeChoicesFor(language: SupportedLanguage): ProfileChoice[] {
  return DEMO_GRADE_CODES.map((code) => ({ code, label: GRADE_LABELS[code][language] }))
}

/**
 * The answer styles the backend offers (`choices.answerStyle`, stoa-backend#314),
 * in its order, named as its `message_catalog` names them (`choice.answer_style.*`).
 */
const ANSWER_STYLE_LABELS: Record<string, Record<SupportedLanguage, string>> = {
  standard: { de: 'Ausgewogen', en: 'Balanced', fr: 'Équilibré', it: 'Equilibrato' },
  concise: { de: 'Kurz und genau', en: 'Short and precise', fr: 'Court et précis', it: 'Breve e preciso' },
  encouraging: {
    de: 'Geduldig und ermutigend',
    en: 'Patient and encouraging',
    fr: 'Patient et encourageant',
    it: 'Paziente e incoraggiante',
  },
  vivid: {
    de: 'Mit Vergleichen und Beispielen',
    en: 'With comparisons and examples',
    fr: 'Avec des comparaisons et des exemples',
    it: 'Con paragoni ed esempi',
  },
}

/** The codes of `choices.answerStyle`, in the backend's order. */
export const DEMO_ANSWER_STYLE_CODES: readonly string[] = Object.keys(ANSWER_STYLE_LABELS)

/** `GET /students/me/profile`. Its subjects are the galaxies the student takes. */
export function demoProfileFor(language: SupportedLanguage): StudentProfile {
  return {
    id: 'demo-student-profile',
    userId: DEMO_STUDENT_ID,
    name: NAME,
    email: EMAIL,
    grade: 'grade_9_secondary',
    primarySubjects: demoSky(10).galaxies.filter((galaxy) => galaxy.enrolled).map((galaxy) => galaxy.subjectId),
    answerStyle: 'standard',
    schoolSystem: 'Swiss Gymnasium',
    preferredAnswerLanguage: language,
    guardianStatus: 'linked',
    createdAt: CREATED_AT,
    updatedAt: '2026-09-30T18:00:00.000Z',
    choices: {
      grade: demoGradeChoicesFor(language),
      answerStyle: DEMO_ANSWER_STYLE_CODES.map((code) => ({ code, label: ANSWER_STYLE_LABELS[code][language] })),
    },
  }
}
