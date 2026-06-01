import { z } from 'zod'
import type { TFunction } from 'i18next'
import { supportedLanguages } from '@/i18n/languages'

export const userRoleSchema = z.enum([
  'student',
  'parent',
  'tutor',
  'admin',
  'organization_admin',
  'school_teacher',
  'school_viewer',
])

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
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
