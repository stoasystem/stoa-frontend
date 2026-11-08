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
 * The year groups the backend offers (stoa-backend#310: `choices.grade`, in
 * school order), named as its message catalog names them (`choice.grade.*`).
 * A copy for the demo backend only: the application renders what the backend
 * sends and keeps no list of its own.
 */
const GRADE_CHOICES: readonly { code: string; label: Record<SupportedLanguage, string> }[] = [
  { code: 'grade_1_primary', label: { de: '1. Primarklasse', en: 'Year 1 (primary school)', fr: '3e année primaire (3P)', it: '1ª elementare' } },
  { code: 'grade_2_primary', label: { de: '2. Primarklasse', en: 'Year 2 (primary school)', fr: '4e année primaire (4P)', it: '2ª elementare' } },
  { code: 'grade_3_primary', label: { de: '3. Primarklasse', en: 'Year 3 (primary school)', fr: '5e année primaire (5P)', it: '3ª elementare' } },
  { code: 'grade_4_primary', label: { de: '4. Primarklasse', en: 'Year 4 (primary school)', fr: '6e année primaire (6P)', it: '4ª elementare' } },
  { code: 'grade_5_primary', label: { de: '5. Primarklasse', en: 'Year 5 (primary school)', fr: '7e année primaire (7P)', it: '5ª elementare' } },
  { code: 'grade_6_primary', label: { de: '6. Primarklasse', en: 'Year 6 (primary school)', fr: '8e année primaire (8P)', it: '1ª media' } },
  { code: 'grade_7_secondary', label: { de: '7. Klasse (Sekundarstufe I)', en: 'Year 7 (lower secondary)', fr: '9e année (secondaire I)', it: '2ª media' } },
  { code: 'grade_8_secondary', label: { de: '8. Klasse (Sekundarstufe I)', en: 'Year 8 (lower secondary)', fr: '10e année (secondaire I)', it: '3ª media' } },
  { code: 'grade_9_secondary', label: { de: '9. Klasse (Sekundarstufe I)', en: 'Year 9 (lower secondary)', fr: '11e année (secondaire I)', it: '4ª media' } },
  {
    code: 'grade_secondary_i',
    label: {
      de: 'Sekundarstufe I, Schuljahr weiss ich nicht',
      en: 'Lower secondary, not sure which year',
      fr: 'Secondaire I, je ne sais pas quelle année',
      it: 'Scuola media, non so quale anno',
    },
  },
]

/** `choices.grade` in `language`. */
export function demoGradeChoices(language: SupportedLanguage): ProfileChoice[] {
  return GRADE_CHOICES.map(({ code, label }) => ({ code, label: label[language] }))
}

/**
 * The HarmoS year a year-group code stands for, as the backend reads it for
 * the star map (`_school_year`): Sek I without a year counts as its first, 7.
 * Null for anything else.
 */
export function demoSchoolYear(code: string): number | null {
  if (code === 'grade_secondary_i') return 7
  const year = /^grade_(\d)_(primary|secondary)$/.exec(code)
  return year ? Number(year[1]) : null
}

/** `GET /students/me/profile`. Its subjects are the galaxies the student takes; year 9, as a code (#591). */
export function demoProfileFor(language: SupportedLanguage): StudentProfile {
  return {
    id: 'demo-student-profile',
    userId: DEMO_STUDENT_ID,
    name: NAME,
    email: EMAIL,
    grade: 'grade_9_secondary',
    primarySubjects: demoSky(10).galaxies.filter((galaxy) => galaxy.enrolled).map((galaxy) => galaxy.subjectId),
    schoolSystem: 'Swiss Gymnasium',
    preferredAnswerLanguage: language,
    guardianStatus: 'linked',
    createdAt: CREATED_AT,
    updatedAt: '2026-09-30T18:00:00.000Z',
    choices: { grade: demoGradeChoices(language) },
  }
}
