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
 * Plain `fetch`, not the shared client: that client answers a 401 by renewing
 * or ending this tab's own session, and these credentials are not this tab's.
 */
import { apiBaseUrl } from '@/lib/env'
import { exchangeRefreshToken } from '@/services/auth/sessionRefresh'

const LOGOUT_TIMEOUT_MS = 8000

export type DroppedSignIn = { accessToken: string; refreshToken?: string | null }

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
    return response.status === 401 || response.status === 403 ? 'refused' : 'failed'
  } catch {
    return 'failed'
  } finally {
    clearTimeout(timer)
  }
}

export async function revokeSignIn(signIn: DroppedSignIn): Promise<void> {
  try {
    const outcome = await postLogout(signIn.accessToken)
    if (outcome !== 'refused' || !signIn.refreshToken) return
    const renewed = await exchangeRefreshToken(signIn.refreshToken)
    if (renewed.status === 'renewed') await postLogout(renewed.accessToken)
  } catch {
    // Best effort: the browser no longer holds these credentials either way.
  }
}
