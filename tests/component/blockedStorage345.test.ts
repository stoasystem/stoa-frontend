/**
 * A browser that blocks site storage throws on any touch of localStorage.
 * i18n reads and writes the language there while the app starts, and the
 * attribution capture writes there before it mounts, so either one threw and
 * nothing rendered (#345).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const original = Object.getOwnPropertyDescriptor(window, 'localStorage')!

function blockStorage() {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    get() {
      throw new DOMException('The operation is insecure.', 'SecurityError')
    },
  })
}

describe('with site storage blocked', () => {
  beforeEach(() => {
    vi.resetModules()
    blockStorage()
  })
  afterEach(() => {
    Object.defineProperty(window, 'localStorage', original)
    window.history.replaceState(null, '', '/')
  })

  it('reads the language from the browser instead', async () => {
    vi.spyOn(window.navigator, 'language', 'get').mockReturnValue('fr-CH')
    const { activeLanguage, storedLanguage } = await import('@/i18n/languages')
    expect(storedLanguage()).toBeNull()
    expect(activeLanguage()).toBe('fr')
  })

  it('starts i18n and still switches language', async () => {
    vi.spyOn(window.navigator, 'language', 'get').mockReturnValue('de-CH')
    const { default: i18n } = await import('@/i18n')
    expect(i18n.language).toBe('de')
    await expect(i18n.changeLanguage('it')).resolves.toBeTypeOf('function')
    expect(i18n.language).toBe('it')
    expect(document.documentElement.lang).toBe('it')
  })

  it('captures attribution without throwing', async () => {
    window.history.replaceState(null, '', '/?utm_source=flyer&ref=FRIEND')
    const { captureAttributionFromUrl } = await import('@/lib/utm')
    expect(() => captureAttributionFromUrl()).not.toThrow()
  })
})
