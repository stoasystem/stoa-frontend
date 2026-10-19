/**
 * The role switcher's list: test accounts held so a tester can move between
 * roles without typing a password each time (`?roleswitcher=on`).
 *
 * A testing tool, not a product feature (#320, docs/adr/0003). It is kept
 * apart from the browser's sign-in in every way that matters: its own key, and
 * only addresses on the test domain are written or read back, so a real
 * account can never be in it. Nothing outside the switcher offers what is
 * here. Switching to a role is an ordinary sign-in of the browser, and like
 * any sign-in it signs every other tab out of the previous account.
 *
 * Nothing here is a security boundary: every request is still authorised by
 * the token the server issued, and holding a role requires signing into it.
 */

/** Accounts the switcher holds. Anyone else is never written here or read back. */
const TEST_ACCOUNT_PATTERN = /@test\.stoaedu\.ch$/i

const TEST_ROLES_KEY = 'stoa_test_roles'
const OPT_IN_KEY = 'stoa_role_switcher'
const OPT_IN_PARAM = 'roleswitcher'

export function isTestAccount(email: string | undefined | null): boolean {
  return TEST_ACCOUNT_PATTERN.test(String(email ?? '').trim())
}

/**
 * Whether this one browser has deliberately turned the switcher on.
 *
 * The test accounts exist on the deployed site, so testing anywhere else tests
 * a different system; this opt-in is what separates "someone is using the
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

export type TestRole = {
  email: string
  role: string
  name: string
  accessToken: string
  /** So a held role outlives its access token. */
  refreshToken?: string
  savedAt: string
}

function readRaw(): unknown[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(TEST_ROLES_KEY) ?? '[]')
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

function write(roles: TestRole[]): void {
  try {
    localStorage.setItem(TEST_ROLES_KEY, JSON.stringify(roles))
  } catch {
    // Blocked storage holds nothing.
  }
}

/** The held test roles. Anything not on the test domain is not one, whatever wrote it. */
export function readTestRoles(): TestRole[] {
  if (typeof window === 'undefined') return []
  return readRaw().filter(
    (entry): entry is TestRole =>
      typeof (entry as TestRole | null)?.email === 'string' &&
      typeof (entry as TestRole).accessToken === 'string' &&
      isTestAccount((entry as TestRole).email),
  )
}

/** Hold a test role, replacing the one held for the same address. Any other address is refused. */
export function holdTestRole(role: Omit<TestRole, 'savedAt'>): TestRole[] {
  if (!isTestAccount(role.email)) return readTestRoles()
  const others = readTestRoles().filter((entry) => entry.email.toLowerCase() !== role.email.toLowerCase())
  const next = [...others, { ...role, savedAt: new Date().toISOString() }]
  write(next)
  return next
}

export function forgetTestRole(email: string): TestRole[] {
  const next = readTestRoles().filter((entry) => entry.email.toLowerCase() !== email.toLowerCase())
  write(next)
  return next
}

type Credentials = { accessToken?: string | null; refreshToken?: string | null }

function holds(entry: TestRole, credentials: Credentials): boolean {
  return (
    (Boolean(credentials.accessToken) && entry.accessToken === credentials.accessToken) ||
    (Boolean(credentials.refreshToken) && entry.refreshToken === credentials.refreshToken)
  )
}

/** Whether the switcher holds this sign-in, so replacing it must not end it. */
export function isHeldTestRole(credentials: Credentials): boolean {
  return readTestRoles().some((entry) => holds(entry, credentials))
}

/** Drop the roles holding this sign-in: it was signed out, or the server refused it. */
export function forgetTestRolesHolding(credentials: Credentials): void {
  if (typeof window === 'undefined') return
  const roles = readTestRoles()
  const next = roles.filter((entry) => !holds(entry, credentials))
  if (next.length !== roles.length) write(next)
}

/** Live, refused, or no answer — a failed check is not the same as a dead session. */
export type SessionLiveness = 'live' | 'refused' | 'unknown'

const LIVENESS_TIMEOUT_MS = 8000

/**
 * Does the server still accept this held role's access token? Asked outside
 * the shared client on purpose: that client answers a 401 by ending this
 * tab's session, which is exactly what checking beforehand is meant to avoid.
 * Only an actual refusal reports `refused`.
 */
export async function sessionLiveness(accessToken: string, apiOrigin: string): Promise<SessionLiveness> {
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
