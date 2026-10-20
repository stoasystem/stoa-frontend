/**
 * The frontend asked for a symbol the backend and the identity pool never
 * require, so a password the backend takes was refused before it was sent
 * (#345). The rule now matches `enforce_password_complexity`: 8 characters or
 * more, an uppercase letter, a lowercase letter and a digit.
 */
import { describe, expect, it } from 'vitest'
import de from '@/i18n/locales/de/errors.json'
import en from '@/i18n/locales/en/errors.json'
import fr from '@/i18n/locales/fr/errors.json'
import it_ from '@/i18n/locales/it/errors.json'
import { isCompliantPassword } from '@/lib/validation'

describe('the password rule', () => {
  it.each(['Passwort1', 'Abcdefg1', 'Ärger2024', 'Zürich-Bern9!'])('takes %s', (password) => {
    expect(isCompliantPassword(password)).toBe(true)
  })

  it.each([
    ['too short', 'Abcdef1'],
    ['no uppercase', 'passwort1'],
    ['no lowercase', 'PASSWORT1'],
    ['no digit', 'Passwort!'],
  ])('refuses one with %s', (_why, password) => {
    expect(isCompliantPassword(password)).toBe(false)
  })

  it.each([
    ['en', en.passwordRequirements],
    ['de', de.passwordRequirements],
    ['fr', fr.passwordRequirements],
    ['it', it_.passwordRequirements],
  ])('is described in %s without a symbol', (_language, text) => {
    expect(text).toContain('8')
    expect(text).not.toMatch(/[!@#$%^&*]\s|symbol|Symbol|symbole|simbol/)
  })
})
