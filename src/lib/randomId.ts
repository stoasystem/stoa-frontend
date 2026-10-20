/**
 * A fresh random id: a v4 UUID. It names a request the backend must count
 * once (its idempotency keys take `[A-Za-z0-9._~-]{1,64}`), a sign-in of this
 * browser, and a tab's analytics session.
 *
 * `crypto.randomUUID` is missing on iOS Safari 15.0–15.3 and outside a secure
 * context, and calling it there throws (#369, #389). `crypto.getRandomValues`
 * is there in both, so the same UUID is built from it.
 *
 * Every browser the app is built for has `getRandomValues`. Without it the
 * bytes come from `Math.random`: signing in and start-up must never fail for
 * want of an id, which the sign-in id never could before (#389 audit).
 */
export function newRandomId(): string {
  const source = typeof crypto === 'undefined' ? undefined : crypto
  if (typeof source?.randomUUID === 'function') return source.randomUUID()
  const bytes = new Uint8Array(16)
  if (typeof source?.getRandomValues === 'function') source.getRandomValues(bytes)
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256)
  // RFC 9562: version 4 in the high nibble of byte 6, variant 10 in the top bits of byte 8.
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
