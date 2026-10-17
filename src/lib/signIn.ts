/*
 * Which sign-in an access token belongs to.
 *
 * Cognito puts `origin_jti` on every access token one refresh token mints, so
 * it names one sign-in: the password entered once and every renewal since. The
 * backend's sign-out ends exactly that sign-in (stoa-backend `POST
 * /auth/logout`), and the tabs holding it are the ones that end with it
 * (#232). Read without verifying: it only ever decides that this tab signs
 * itself out, never who the tab is.
 */
export function signInOf(accessToken: string | null | undefined): string | null {
  if (!accessToken) return null
  const payload = accessToken.split('.')[1]
  if (!payload) return null
  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = JSON.parse(atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')))
    const id = (json as { origin_jti?: unknown })?.origin_jti
    return typeof id === 'string' && id.trim() ? id.trim() : null
  } catch {
    // Not a JWT (a demo token), or not one with a sign-in on it.
    return null
  }
}
