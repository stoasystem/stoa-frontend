/**
 * The key a hint press is counted by (#369). `crypto.randomUUID` is missing on
 * iOS Safari 15.0–15.3 and outside a secure context; calling it there threw
 * before the request was sent, so Hint never worked on those browsers.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { newIdempotencyKey } from '@/lib/idempotencyKey'

const BACKEND_KEY = /^[A-Za-z0-9._~-]{1,64}$/
const V4_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

/** A crypto as those browsers have it: getRandomValues, no randomUUID. */
function withoutRandomUUID(fill?: number) {
  const real = globalThis.crypto
  const getRandomValues = vi.fn(<T extends ArrayBufferView>(array: T): T =>
    fill === undefined ? real.getRandomValues(array) : ((array as unknown as Uint8Array).fill(fill) as unknown as T),
  )
  vi.stubGlobal('crypto', { getRandomValues, subtle: real.subtle })
  return getRandomValues
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('newIdempotencyKey (#369)', () => {
  it('uses crypto.randomUUID where the browser has it', () => {
    const randomUUID = vi.spyOn(crypto, 'randomUUID').mockReturnValue('0b6b7f4e-1c1a-4d3e-9f00-5a2b3c4d5e6f')
    expect(newIdempotencyKey()).toBe('0b6b7f4e-1c1a-4d3e-9f00-5a2b3c4d5e6f')
    expect(randomUUID).toHaveBeenCalledTimes(1)
  })

  it('builds the same shape from getRandomValues where randomUUID is missing', () => {
    const getRandomValues = withoutRandomUUID()
    expect(crypto.randomUUID).toBeUndefined()

    const keys = Array.from({ length: 50 }, () => newIdempotencyKey())
    for (const key of keys) {
      expect(key).toMatch(BACKEND_KEY)
      expect(key).toMatch(V4_UUID)
    }
    expect(new Set(keys).size).toBe(keys.length)
    expect(getRandomValues).toHaveBeenCalledTimes(keys.length)
  })

  it('sets the version and variant bits whatever the random bytes are', () => {
    withoutRandomUUID(0x00)
    expect(newIdempotencyKey()).toBe('00000000-0000-4000-8000-000000000000')
    withoutRandomUUID(0xff)
    expect(newIdempotencyKey()).toBe('ffffffff-ffff-4fff-bfff-ffffffffffff')
  })
})
