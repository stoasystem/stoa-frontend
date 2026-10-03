/* The demo student (#116): the signed-in user and the profile /me shows. A made-up person. */
import { demoSky } from '@/features/starmap/fixtures/demoSky'
import { supportedLanguages, type SupportedLanguage } from '@/i18n/languages'
import type { StudentProfile } from '@/types/student'
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

/** `GET /students/me/profile`. Its subjects are the galaxies the student takes. */
export function demoProfileFor(language: SupportedLanguage): StudentProfile {
  return {
    id: 'demo-student-profile',
    userId: DEMO_STUDENT_ID,
    name: NAME,
    email: EMAIL,
    grade: '9',
    primarySubjects: demoSky(10).galaxies.filter((galaxy) => galaxy.enrolled).map((galaxy) => galaxy.subjectId),
    schoolSystem: 'Swiss Gymnasium',
    preferredAnswerLanguage: language,
    guardianStatus: 'linked',
    createdAt: CREATED_AT,
    updatedAt: '2026-09-30T18:00:00.000Z',
  }
}
