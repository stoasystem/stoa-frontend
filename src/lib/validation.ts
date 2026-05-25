import { z } from 'zod'

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
})

export const chatInputSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty.'),
})
