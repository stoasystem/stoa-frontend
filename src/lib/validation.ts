import { z } from 'zod'
import type { TFunction } from 'i18next'
import type { AddressContext } from '@/lib/addressForm'

/**
 * The backend's rule (`enforce_password_complexity`) and the identity pool's:
 * at least 8 characters, with an uppercase letter, a lowercase letter and a
 * digit. No symbol is required; asking for one here refused passwords the
 * backend takes (#345). Letters and digits count in any script, and length in
 * characters, as the backend counts them.
 */
export function isCompliantPassword(password: string) {
  return (
    [...password].length >= 8 &&
    /\p{Ll}/u.test(password) &&
    /\p{Lu}/u.test(password) &&
    /\p{Nd}/u.test(password)
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
