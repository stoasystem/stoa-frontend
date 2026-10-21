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

/*
 * The address check of zod 4.4's `z.string().email()`, which this form used
 * until #415: the same pattern, so the form refuses what it refused before.
 * zod went because nothing else used it, and the build put it in the chunk
 * every first screen loads, a signed-in student's too.
 */
const EMAIL = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+.-]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9-]*\.)+[A-Za-z]{2,}$/

export type LoginFields = { email: string; password: string }
export type LoginErrors = { email?: string; password?: string }

/** What is wrong with the sign-in form's fields, one line per field; empty when both are fine. */
export function loginErrors({ email, password }: LoginFields, t: TFunction, context?: AddressContext): LoginErrors {
  const errors: LoginErrors = {}
  // The sign-in page's own line, in its own voice (#277); the shared
  // errors:invalidEmail is the registration form's, which says "Sie".
  if (!EMAIL.test(email)) errors.email = t('auth:login.invalidEmail', { context })
  if (password.length === 0) errors.password = t('errors:required')
  return errors
}
