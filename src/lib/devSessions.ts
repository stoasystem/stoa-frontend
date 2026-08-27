/**
 * Holding several roles at once while testing.
 *
 * The access token lives in localStorage, which every tab of the origin
 * shares, so a developer comparing what a parent sees with what their child
 * sees had to sign out and back in between each look. A tab that has picked a
 * role keeps its token to itself instead, which lets four tabs hold four roles
 * at the same time.
 *
 * This is a convenience for the test accounts, not a security boundary: it
 * only decides what the interface offers. Every request is still authorised by
 * the token the server issued, and holding a session here requires signing
 * into that account first.
 */

export const TAB_TOKEN_KEY = 'stoa_tab_access_token'
const SESSIONS_KEY = 'stoa_dev_sessions'

/** Accounts the switcher is offered to. Anyone else never sees it. */
const TEST_ACCOUNT_PATTERN = /@test\.stoaedu\.ch$/i

export type DevSession = {
  email: string
  role: string
  name: string
  accessToken: string
  savedAt: string
}

export function isTestAccount(email: string | undefined | null): boolean {
  return TEST_ACCOUNT_PATTERN.test(String(email ?? '').trim())
}

export function readSessions(): DevSession[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = JSON.parse(localStorage.getItem(SESSIONS_KEY) ?? '[]')
    if (!Array.isArray(raw)) return []
    return raw.filter(
      (entry): entry is DevSession =>
        typeof entry?.email === 'string' &&
        typeof entry?.accessToken === 'string' &&
        isTestAccount(entry.email),
    )
  } catch {
    return []
  }
}

export function rememberSession(session: Omit<DevSession, 'savedAt'>): DevSession[] {
  if (!isTestAccount(session.email)) {
    return readSessions()
  }
  const others = readSessions().filter(
    (entry) => entry.email.toLowerCase() !== session.email.toLowerCase(),
  )
  const next = [...others, { ...session, savedAt: new Date().toISOString() }]
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(next))
  return next
}

export function forgetSession(email: string): DevSession[] {
  const next = readSessions().filter(
    (entry) => entry.email.toLowerCase() !== email.toLowerCase(),
  )
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(next))
  return next
}

/** Pin this tab to one session, leaving other tabs on whatever they hold. */
export function pinTabToSession(accessToken: string): void {
  sessionStorage.setItem(TAB_TOKEN_KEY, accessToken)
}

export function tabToken(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(TAB_TOKEN_KEY)
}

export function releaseTab(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(TAB_TOKEN_KEY)
}
