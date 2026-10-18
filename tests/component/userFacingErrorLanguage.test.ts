import { afterAll, afterEach, describe, expect, it } from 'vitest'
import i18n from '@/i18n'
import { toUserFacingError } from '@/lib/userFacingText'
import { ApiError } from '@/services/api/httpClient'

// #265: a German student whose Ask could not start read "Network Error" — or
// the server's English sentence — where the German fallback belonged.
// `toUserFacingError` lets the error's own prose through only to a reader of
// English, and never the transport's.
const initialLanguage = i18n.language

afterEach(async () => {
  await i18n.changeLanguage(initialLanguage)
})
afterAll(async () => {
  await i18n.changeLanguage(initialLanguage)
})

const TRANSPORT = [
  new Error('Network Error'),
  new TypeError('Failed to fetch'),
  new TypeError('Load failed'),
  new TypeError('NetworkError when attempting to fetch resource.'),
  new Error('timeout of 30000ms exceeded'),
]
const SERVER_PROSE = new ApiError('Too many conversations today', { status: 429, code: 'rate_limited' })

describe('toUserFacingError outside English', () => {
  it.each([
    ['de', 'Das Gespräch konnte nicht begonnen werden.'],
    ['fr', 'La conversation n’a pas pu commencer.'],
  ])('gives a %s reader the fallback, never English prose', async (language, fallback) => {
    await i18n.changeLanguage(language)
    for (const error of [...TRANSPORT, SERVER_PROSE]) {
      expect(toUserFacingError(error, fallback)).toBe(fallback)
    }
  })

  it('says a coded error in the reader’s language when the caller can translate it', async () => {
    await i18n.changeLanguage('de')
    const translate = (code: string) => (code === 'rate_limited' ? 'Heute sind keine weiteren Gespräche möglich.' : '')
    expect(toUserFacingError(SERVER_PROSE, 'Fallback', translate)).toBe('Heute sind keine weiteren Gespräche möglich.')
    expect(toUserFacingError(new ApiError('Other', { status: 400, code: 'unknown' }), 'Fallback', translate)).toBe(
      'Fallback',
    )
  })

  it('reads the language the interface switched to, not the one it started in', async () => {
    await i18n.changeLanguage('en')
    expect(toUserFacingError(SERVER_PROSE, 'Fallback')).toBe('Too many conversations today')
    await i18n.changeLanguage('fr')
    expect(toUserFacingError(SERVER_PROSE, 'Repli')).toBe('Repli')
  })
})

describe('toUserFacingError in English', () => {
  it('still shows the server’s own sentence', async () => {
    await i18n.changeLanguage('en')
    expect(toUserFacingError(SERVER_PROSE, 'Fallback')).toBe('Too many conversations today')
  })

  it('never shows the transport’s words', async () => {
    await i18n.changeLanguage('en')
    for (const error of TRANSPORT) {
      expect(toUserFacingError(error, 'Fallback')).toBe('Fallback')
    }
  })
})
