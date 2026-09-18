import { z } from 'zod'
import type { TFunction } from 'i18next'
import { supportedLanguages } from '@/i18n/languages'

export const userRoleSchema = z.enum([
  'student',
  'parent',
  'teacher',
  'admin',
  'organization_admin',
  'school_teacher',
  'school_viewer',
])

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
})

export const MIN_AGE = 1
export const MAX_AGE = 120
// Single source of truth for the minor/adult split used by registration rules.
export const ADULT_AGE = 18

/** Keep only digits, drop leading zeros and cap the length so `026` or `0222222` cannot be typed. */
export function normalizeAgeInput(value: string) {
  return value.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, String(MAX_AGE).length)
}

export function isValidAge(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= MIN_AGE && value <= MAX_AGE
}

export function isAdultAge(value: number | null | undefined) {
  return isValidAge(value) && value >= ADULT_AGE
}

export function isValidEmail(value: string) {
  return z.string().email().safeParse(value.trim()).success
}

export function isCompliantPassword(password: string) {
  return (
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[!@#$%^&*]/.test(password)
  )
}

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Enter a valid email address.'),
  password: z.string().refine(isCompliantPassword, 'Password must meet the requirements.'),
  role: userRoleSchema,
  acceptedTerms: z.literal(true, {
    message: 'Accept the privacy policy and terms to continue.',
  }),
})

export const studentProfileSchema = z.object({
  grade: z.string().min(1, 'Grade is required.'),
  primarySubjects: z.array(z.string()).min(1, 'Add at least one subject.'),
  schoolSystem: z.string().optional(),
  preferredAnswerLanguage: z.enum(supportedLanguages),
})

export const chatInputSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty.'),
})

export function createLoginSchema(t: TFunction) {
  return z.object({
    email: z.string().email(t('errors:invalidEmail')),
    password: z.string().min(1, t('errors:required')),
  })
}

export function createChatInputSchema(t: TFunction) {
  return z.object({
    content: z.string().min(1, t('chat:emptyMessage')),
  })
}
