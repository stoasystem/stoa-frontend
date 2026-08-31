import { describe, expect, it } from 'vitest'
import de from '@/i18n/locales/de/chat.json'
import en from '@/i18n/locales/en/chat.json'
import fr from '@/i18n/locales/fr/chat.json'
import italian from '@/i18n/locales/it/chat.json'

const LOCALES = { de, en, fr, it: italian }

describe('tutor-support failure copy', () => {
  it('exists in every shipped language', () => {
    for (const [language, bundle] of Object.entries(LOCALES)) {
      const errors = bundle.teacher.errors as Record<string, string>
      for (const key of [
        'planDenied',
        'allowanceExhausted',
        'alreadyOpen',
        'temporary',
        'generic',
      ]) {
        expect(errors[key], `${language}.teacher.errors.${key}`).toBeTruthy()
      }
    }
  })

  it('carries none of the server-side vocabulary', () => {
    const internal = /admission|allowance service|disposition|retryable|idempotenc/i
    for (const [language, bundle] of Object.entries(LOCALES)) {
      for (const [key, value] of Object.entries(
        bundle.teacher.errors as Record<string, string>,
      )) {
        expect(internal.test(value), `${language}.teacher.errors.${key}`).toBe(false)
      }
    }
  })
})
