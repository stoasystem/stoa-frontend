import { z } from 'zod'
import type { TFunction } from 'i18next'
import type { AddressContext } from '@/lib/addressForm'

export function isCompliantPassword(password: string) {
  return (
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[!@#$%^&*]/.test(password)
  )
}

export function createLoginSchema(t: TFunction, context?: AddressContext) {
  return z.object({
    // The sign-in page's own line, in its own voice (#277); the shared
    // errors:invalidEmail is the registration form's, which says "Sie".
    email: z.string().email(t('auth:login.invalidEmail', { context })),
    password: z.string().min(1, t('errors:required')),
  })
}
