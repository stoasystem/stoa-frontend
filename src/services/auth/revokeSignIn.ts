/*
 * Ending, on the server, a sign-in this browser is dropping without anyone
 * pressing "Sign out" for it: the saved accounts the one-off migration drops,
 * and the sign-in a new one replaces (#320, docs/adr/0003).
 *
 * Best effort and fire and forget, through the endpoints that already exist:
 * `POST /auth/logout` ends the sign-in its access token belongs to. An access
 * token that has run out cannot name its sign-in to the server any more, so
 * when the logout is refused the refresh token is spent once for a fresh one
 * and that is signed out instead. Nothing is stored, retried or logged: the
 * browser has already let go of these credentials, whatever the server says.
 *
 * Signing out takes the same second step when its own logout is refused
 * (#399): the token a page left idle for an hour has run out too.
 *
 * Plain `fetch`, not the shared client: that client answers a 401 by renewing
 * or ending this tab's own session, and these credentials are not this tab's.
 */
import { apiBaseUrl } from '@/lib/env'
import { exchangeRefreshToken } from '@/services/auth/sessionRefresh'

const LOGOUT_TIMEOUT_MS = 8000

export type DroppedSignIn = { accessToken: string; refreshToken?: string | null }

/** The backend would not sign this access token out: it has run out, or was revoked. */
export function logoutRefused(status: number): boolean {
  return status === 401 || status === 403
}

async function postLogout(accessToken: string): Promise<'ok' | 'refused' | 'failed'> {
  const abort = new AbortController()
  const timer = setTimeout(() => abort.abort(), LOGOUT_TIMEOUT_MS)
  try {
    const response = await fetch(`${apiBaseUrl}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken }),
      signal: abort.signal,
    })
    if (response.ok) return 'ok'
    return logoutRefused(response.status) ? 'refused' : 'failed'
  } catch {
    return 'failed'
  } finally {
    clearTimeout(timer)
  }
}

/** What came of the second step: the refresh, or else the fresh token's logout. */
export type RefreshedLogout =
  | 'ok'
  | 'refresh-refused'
  | 'refresh-unreachable'
  | 'logout-refused'
  | 'logout-failed'

/**
 * End on the server the sign-in a refused logout could not: spend its refresh
 * token once for a fresh access token, and sign that out. The fresh token is
 * held here and nowhere else - never stored, never logged. Never throws.
 */
export async function logoutWithRefreshToken(refreshToken: string): Promise<RefreshedLogout> {
  const renewed = await exchangeRefreshToken(refreshToken)
  if (renewed.status !== 'renewed') return `refresh-${renewed.status}`
  const outcome = await postLogout(renewed.accessToken)
  return outcome === 'ok' ? 'ok' : `logout-${outcome}`
}

export async function revokeSignIn(signIn: DroppedSignIn): Promise<void> {
  try {
    const outcome = await postLogout(signIn.accessToken)
    if (outcome !== 'refused' || !signIn.refreshToken) return
    await logoutWithRefreshToken(signIn.refreshToken)
  } catch {
    // Best effort: the browser no longer holds these credentials either way.
  }
}
