/**
 * A fresh key for a request the backend must count once: a v4 UUID, which
 * fits the backend's `[A-Za-z0-9._~-]{1,64}`.
 *
 * `crypto.randomUUID` is missing on iOS Safari 15.0–15.3 and outside a secure
 * context, and calling it there throws before the request is sent (#369).
 * `crypto.getRandomValues` is there in both, so the same UUID is built from it.
 */
export function newIdempotencyKey(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  // RFC 9562: version 4 in the high nibble of byte 6, variant 10 in the top bits of byte 8.
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
