/**
 * A wrong password says so, in the reader's language and address form (#249).
 *
 * Before, the 401 went through session renewal and the form showed the bare
 * "session_ended"; with the code kept, it would have shown the server's English
 * sentence. The code has its own line in all four languages, "du" for anyone
 * whose role the page does not know and "Sie" for staff signing in again.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { LoginForm } from '@/components/auth/LoginForm'
import i18n from '@/i18n'
import deAuth from '@/i18n/locales/de/auth.json'
import enAuth from '@/i18n/locales/en/auth.json'
import frAuth from '@/i18n/locales/fr/auth.json'
import itAuth from '@/i18n/locales/it/auth.json'
import type { AddressContext } from '@/lib/addressForm'
import { mswServer } from '../mswServer'

const AUTH = { de: deAuth, en: enAuth, fr: frAuth, it: itAuth }

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'bypass' }))
afterAll(() => mswServer.close())
beforeEach(() => {
  sessionStorage.clear()
  mswServer.use(
    http.post('https://api.test/auth/login', () =>
      HttpResponse.json(
        { detail: { code: 'invalid_credentials', message: 'Check your email and password, then try signing in again.' } },
        { status: 401 },
      )),
  )
})
afterEach(async () => {
  mswServer.resetHandlers()
  await i18n.changeLanguage('en')
})

async function signInWrongly(language: keyof typeof AUTH, context?: AddressContext) {
  await i18n.changeLanguage(language)
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <LoginForm initialEmail="reader@test.stoaedu.ch" context={context} />
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
  fireEvent.change(screen.getByLabelText(i18n.t('auth:register.password')), { target: { value: 'wrong-password' } })
  fireEvent.submit(screen.getByRole('button', { name: i18n.t('common:actions.signIn') }).closest('form')!)
  return screen.findByRole('alert')
}

describe('a wrong password on the sign-in form', () => {
  for (const language of ['de', 'en', 'fr', 'it'] as const) {
    it(`says so in ${language}`, async () => {
      const alert = await signInWrongly(language)
      expect(alert).toHaveTextContent(AUTH[language].login.invalidCredentials)
      expect(alert).not.toHaveTextContent('session_ended')
    })
  }

  it('speaks to staff signing in again as "Sie"', async () => {
    const alert = await signInWrongly('de', 'formal')
    expect(alert).toHaveTextContent('Prüfen Sie beides und versuchen Sie es noch einmal.')
  })

  it('speaks to a student as "du"', async () => {
    const alert = await signInWrongly('de')
    expect(alert).toHaveTextContent('Prüfe beides und versuche es noch einmal.')
  })
})
