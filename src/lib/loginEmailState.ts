/*
 * The address the sign-in form opens with, carried in the navigation's state
 * rather than the URL, so it stays out of the address bar, the history list
 * and every log that records a URL (#626).
 *
 * The activation pages leave one when they send a newly activated account to
 * the sign-in: signing out the account the browser was still signed in as,
 * or straight to the form when it was signed in as nobody.
 */

export type LoginEmailState = { loginEmail: string }

/** The state that opens the sign-in form on this address; none for an empty one. */
export function loginEmailState(email: string | undefined): LoginEmailState | undefined {
  const value = email?.trim()
  return value ? { loginEmail: value } : undefined
}

/** The address a navigation's state asks the sign-in form to open with, if any. */
export function loginEmailFromState(state: unknown): string | undefined {
  const value = (state as Partial<LoginEmailState> | null | undefined)?.loginEmail
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}
