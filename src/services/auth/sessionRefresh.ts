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
 * it is cleared whenever the session it belongs to is.
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

function tabPinned(): boolean {
  try {
    return sessionStorage.getItem(TAB_TOKEN_KEY) !== null
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

export function forgetRefreshToken(): void {
  try {
    sessionStorage.removeItem(TAB_REFRESH_KEY)
    localStorage.removeItem(REFRESH_KEY)
  } catch {
    // Nothing to clear if storage is blocked.
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

/** The refresh in flight, so concurrent callers wait on one attempt. */
let inFlight: Promise<string | null> | null = null

/**
 * Exchange the stored refresh token for a fresh access token.
 *
 * Returns the new access token, or null when there is nothing to exchange or
 * the server refuses — which is the caller's signal that the session is over
 * for real and signing out is right.
 */
export function refreshAccessToken(): Promise<string | null> {
  if (inFlight) return inFlight
  inFlight = attempt().finally(() => {
    inFlight = null
  })
  return inFlight
}

async function attempt(): Promise<string | null> {
  const refreshToken = storedRefreshToken()
  if (!refreshToken) return null

  const outcome = await exchangeRefreshToken(refreshToken)
  if (outcome.status === 'refused') {
    // A refused refresh token will never be accepted again; keeping it would
    // make every later 401 wait on a request that cannot succeed. A network
    // failure is not a refusal: that token stays, and the next 401 tries again.
    forgetRefreshToken()
    return null
  }
  if (outcome.status !== 'renewed') return null
  rememberRefreshToken(outcome.refreshToken)
  return outcome.accessToken
}
