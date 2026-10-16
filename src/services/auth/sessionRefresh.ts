/*
 * Keeping a reader signed in past the hour their access token lasts.
 *
 * `/auth/refresh` and the refresh token have both existed for a long time;
 * nothing used them, so every session ended when the access token expired.
 * People read that as "signed out after every release", because a release is
 * when they come back to the tab.
 *
 * The refresh token is stored beside the access token and under the same
 * rules: a tab pinned to one account keeps its own, everyone else shares the
 * browser's. It is a credential — it is never logged, never put in a URL, and
 * it is cleared whenever the session it belongs to is, and only then: a
 * pinned tab whose session ends clears its own, never the one the rest of the
 * browser shares (#211).
 *
 * One refresh runs at a time. A page that fires six requests into an expired
 * token must not send six refreshes: the first claims the attempt and the
 * others wait on it, so the token is replaced once and every caller retries
 * against the same new one.
 */
import { TAB_TOKEN_KEY } from '@/lib/devSessions'
import { apiBaseUrl } from '@/lib/env'

const REFRESH_KEY = 'stoa_refresh_token'
const TAB_REFRESH_KEY = 'stoa_tab_refresh_token'
/** Long enough for a slow network, short enough that a hung refresh still ends. */
const REFRESH_TIMEOUT_MS = 10_000

// The same test the store uses (`tabToken()` read as truthy), so a refresh
// token always lands beside its access token (#209 audit).
function tabPinned(): boolean {
  try {
    return Boolean(sessionStorage.getItem(TAB_TOKEN_KEY))
  } catch {
    return false
  }
}

/** The refresh token for whichever session this tab is on. */
export function storedRefreshToken(): string | null {
  try {
    if (tabPinned()) return sessionStorage.getItem(TAB_REFRESH_KEY)
    return localStorage.getItem(REFRESH_KEY)
  } catch {
    return null
  }
}

export function rememberRefreshToken(token: string | null | undefined): void {
  try {
    if (!token) return
    if (tabPinned()) sessionStorage.setItem(TAB_REFRESH_KEY, token)
    else localStorage.setItem(REFRESH_KEY, token)
  } catch {
    // Blocked storage costs the reader the longer session, nothing else.
  }
}

/**
 * Each refresh token this tab's renewals spent, and the one it handed on.
 * Cognito hands back the token it was given, so today every entry points at
 * itself; a pool that rotates would chain them, and a request sent before the
 * rotation still has to be recognised as this session's (#218).
 */
const handedOn = new Map<string, string>()
/** Renewals come once an hour; a handful covers any request still in flight. */
const HANDED_ON_LIMIT = 8

function forgetHandedOn(): void {
  handedOn.clear()
}

/**
 * Put `token` in this tab's place for a refresh token, or empty that place
 * when there is none. Switching to a held account that has no refresh token
 * (one held before they were kept, or a sign-in that returned none) used to
 * leave the previous account's refresh token in the tab, and the next renewal
 * spent it (#205 audit). Only this tab's place is touched: clearing the shared
 * one would sign out the other tabs.
 */
export function replaceRefreshToken(token: string | null | undefined): void {
  // A new session, or none: the old one's renewals say nothing about it.
  forgetHandedOn()
  try {
    const store = tabPinned() ? sessionStorage : localStorage
    const key = tabPinned() ? TAB_REFRESH_KEY : REFRESH_KEY
    if (token) store.setItem(key, token)
    else store.removeItem(key)
  } catch {
    // Blocked storage holds no token to leave behind.
  }
}

/**
 * The session this tab is on has ended: empty this tab's place for a refresh
 * token. A pinned tab leaves the shared one to the other tabs (#211), unless
 * it is the very same token, the way the store treats the access token (#34).
 * A tab pinned to the shared account itself would otherwise sign out and leave
 * that account's refresh token behind, and the next 401 anywhere would renew
 * it (#212 audit).
 */
export function endRefreshToken(): void {
  try {
    const own = storedRefreshToken()
    const pinned = tabPinned()
    replaceRefreshToken(null)
    if (own && pinned && localStorage.getItem(REFRESH_KEY) === own) localStorage.removeItem(REFRESH_KEY)
  } catch {
    // Blocked storage holds no token to leave behind.
  }
}

/**
 * What came of offering a refresh token to the server.
 *
 * The three outcomes have to stay apart, because only one of them means the
 * session is over: a refusal. A network that could not be reached must not
 * cost anyone their session, and the account switcher turns that distinction
 * into "sign in again" or "try again in a moment".
 */
export type RefreshOutcome =
  | { status: 'renewed'; accessToken: string; refreshToken?: string }
  | { status: 'refused' }
  | { status: 'unreachable' }

/**
 * Offer one refresh token to the server, storing nothing.
 *
 * The stored-token path below is one caller. The other is a held account in
 * the switcher, whose own refresh token is not the one this tab is using.
 */
export async function exchangeRefreshToken(refreshToken: string): Promise<RefreshOutcome> {
  const abort = new AbortController()
  const timer = setTimeout(() => abort.abort(), REFRESH_TIMEOUT_MS)
  try {
    // Deliberately `fetch` and not the shared client: that client's response
    // interceptor calls this, and sending the refresh through it would have a
    // refused refresh trigger another refresh.
    const response = await fetch(`${apiBaseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
      signal: abort.signal,
    })
    if (response.status === 401 || response.status === 403) return { status: 'refused' }
    if (!response.ok) return { status: 'unreachable' }
    const body = (await response.json()) as { accessToken?: string; refreshToken?: string }
    // A 200 with nothing in it is a server that did not answer, not a server
    // that refused the token: dropping it here would end a live session.
    if (!body.accessToken) return { status: 'unreachable' }
    return { status: 'renewed', accessToken: body.accessToken, refreshToken: body.refreshToken }
  } catch {
    // A network failure is not a refusal.
    return { status: 'unreachable' }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * A renewal that went through: the new access token, the refresh token it
 * spent, and the one to use from now on (the spent one, unless the server
 * sent a new one).
 */
export type Renewal = { accessToken: string; spentRefreshToken: string; refreshToken: string }

/**
 * What came of trying to renew this tab's session.
 *
 * `ended` is the only outcome that means the session is over: there was no
 * refresh token to offer, or the server refused it. `unreachable` — a network
 * error, a timeout, a 5xx, a 429 — leaves every token where it was, and the
 * next 401 tries again. Folding the two into one `null` signed readers out and
 * deleted a refresh token the server never refused, on every deploy (#214).
 */
export type SessionRenewal =
  | ({ status: 'renewed' } & Renewal)
  | { status: 'ended' }
  | { status: 'unreachable' }


/**
 * Whether this tab is still on the session `refreshToken` belonged to: it is
 * the refresh token stored now, or one of this tab's renewals led from it to
 * the one stored now.
 *
 * The refresh token, not the access token, is what says which session this
 * is: a renewal replaces the access token and keeps the refresh token, while
 * signing in, signing out and switching accounts all replace or clear it.
 * Another tab's renewal of the shared session leaves it as it was (#219).
 */
export function isSameSession(refreshToken: string | null | undefined): boolean {
  const now = storedRefreshToken()
  let token = refreshToken
  if (!token || !now) return false
  for (let step = 0; step <= handedOn.size; step += 1) {
    if (token === now) return true
    const next = handedOn.get(token)
    if (!next || next === token) return false
    token = next
  }
  return false
}

function recordHandedOn(spent: string, next: string): void {
  if (spent === next) return
  handedOn.delete(spent)
  handedOn.set(spent, next)
  if (handedOn.size > HANDED_ON_LIMIT) handedOn.delete(handedOn.keys().next().value as string)
}

/** The refresh in flight, so concurrent callers wait on one attempt. */
let inFlight: Promise<SessionRenewal> | null = null

/**
 * Exchange the stored refresh token for a fresh access token.
 *
 * Returns the new access token, or null when there is none — whether the
 * session ended or the server could not be reached. A caller that has to tell
 * those apart, as anything that signs out does, uses `renewSession`.
 */
export function refreshAccessToken(): Promise<string | null> {
  return renewSession().then((renewal) => (renewal.status === 'renewed' ? renewal.accessToken : null))
}

/**
 * The same renewal, saying which refresh token it spent. A held account in the
 * account menu is moved onto the new tokens only if it holds that refresh
 * token: matching on the access token alone let one account's renewal be
 * written under another's name (#205 audit).
 */
export function renewSession(): Promise<SessionRenewal> {
  if (inFlight) return inFlight
  inFlight = attempt().finally(() => {
    inFlight = null
  })
  return inFlight
}

async function attempt(): Promise<SessionRenewal> {
  const refreshToken = storedRefreshToken()
  if (!refreshToken) return { status: 'ended' }

  const outcome = await exchangeRefreshToken(refreshToken)
  if (outcome.status === 'refused') {
    // A refused refresh token will never be accepted again; keeping it would
    // make every later 401 wait on a request that cannot succeed.
    // Only the refused one goes: a pinned tab's refusal leaves the shared token
    // other tabs use, and a session that replaced this one meanwhile keeps its
    // own (#211).
    if (storedRefreshToken() === refreshToken) endRefreshToken()
    return { status: 'ended' }
  }
  // A network failure is not a refusal: every token stays — this tab's, the
  // shared one, the held accounts' — and the next 401 tries again (#214).
  if (outcome.status === 'unreachable') return { status: 'unreachable' }
  // Kept only for the session that asked: one signed out meanwhile has
  // forgotten its refresh token, and writing the rotated one back would leave
  // the old account's credential in this browser (#34, #172 audit).
  if (storedRefreshToken() !== refreshToken) return { status: 'ended' }
  rememberRefreshToken(outcome.refreshToken)
  recordHandedOn(refreshToken, outcome.refreshToken ?? refreshToken)
  return {
    status: 'renewed',
    accessToken: outcome.accessToken,
    spentRefreshToken: refreshToken,
    refreshToken: outcome.refreshToken ?? refreshToken,
  }
}
