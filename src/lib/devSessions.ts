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

const OPT_IN_KEY = 'stoa_role_switcher'
const OPT_IN_PARAM = 'roleswitcher'

/**
 * Whether this one browser has deliberately turned the switcher on.
 *
 * The switcher stays hidden on a production-facing build because that is where
 * real people are, not because the test accounts stop needing it there. The
 * accounts exist on the deployed site, so testing anywhere else tests a
 * different system. This opt-in is what separates "someone is using the
 * product" from "someone is testing it": stored per browser, never inferred,
 * never carried by a session, an account or a link.
 */
export function switcherEnabledHere(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(OPT_IN_KEY) === 'on'
  } catch {
    return false
  }
}

/**
 * Read `?roleswitcher=on|off`, act on it, then take it back out of the address
 * so it is not carried into a link, a bookmark or a screenshot.
 */
export function adoptSwitcherOptInFromUrl(): void {
  if (typeof window === 'undefined') return
  try {
    const url = new URL(window.location.href)
    const asked = url.searchParams.get(OPT_IN_PARAM)
    if (asked !== 'on' && asked !== 'off') return
    if (asked === 'on') window.localStorage.setItem(OPT_IN_KEY, 'on')
    else window.localStorage.removeItem(OPT_IN_KEY)
    url.searchParams.delete(OPT_IN_PARAM)
    window.history.replaceState({}, '', url.toString())
  } catch {
    // Blocked storage or an unparseable URL leaves the opt-in as it was, which
    // is the safe side of this decision.
  }
}

/**
 * Whether a session for this address may be held in this browser.
 *
 * The domain rule remains the default, so nothing changes for a browser that
 * never opted in. Once one has, that rule would only mean the accounts an
 * administrator actually opened cannot be tested, since those carry ordinary
 * addresses.
 */
export function accountMayBeHeld(email: string | undefined | null): boolean {
  return switcherEnabledHere() || isTestAccount(email)
}

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
        accountMayBeHeld(entry.email),
    )
  } catch {
    return []
  }
}

export function rememberSession(session: Omit<DevSession, 'savedAt'>): DevSession[] {
  if (!accountMayBeHeld(session.email)) {
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

/** Live, refused, or no answer — a failed check is not the same as a dead session. */
export type SessionLiveness = 'live' | 'refused' | 'unknown'

const LIVENESS_TIMEOUT_MS = 8000

/**
 * Does the server still accept this session?
 *
 * Tokens are issued for an hour and none of them is renewed here, so a session
 * held overnight is dead. Asked outside the shared client on purpose: that
 * client answers a 401 by clearing the browser's session, which is exactly
 * what checking beforehand is meant to avoid.
 *
 * Only an actual refusal reports `refused`. Being offline, a 500, or a request
 * that never comes back all report `unknown`, because the caller deletes the
 * stored token on a refusal and the token cannot be recovered afterwards.
 */
export async function sessionLiveness(
  accessToken: string,
  apiOrigin: string,
): Promise<SessionLiveness> {
  const abort = new AbortController()
  const timer = setTimeout(() => abort.abort(), LIVENESS_TIMEOUT_MS)

  try {
    const response = await fetch(`${apiOrigin}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: abort.signal,
    })
    if (response.ok) return 'live'
    if (response.status === 401 || response.status === 403) return 'refused'
    return 'unknown'
  } catch {
    return 'unknown'
  } finally {
    clearTimeout(timer)
  }
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
