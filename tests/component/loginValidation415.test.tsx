/**
 * The sign-in form's own check, without zod (#415).
 *
 * zod checked two fields for this form and nothing else, and it rode in the
 * chunk every first screen loads. The check is now written out, with zod
 * 4.4's address pattern. The verdicts below are zod 4.4.3's, recorded on
 * these addresses before it was removed, so the form still refuses exactly
 * what it refused.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { LoginForm } from '@/components/auth/LoginForm'
import i18n from '@/i18n'
import { loginErrors } from '@/lib/validation'
import { mswServer } from '../mswServer'

const ZOD_ACCEPTED = [
  'mia.keller@example.test',
  'Mia.Keller@Example.TEST',
  'mia+maths@schule.ch',
  "o'neil@example.ch",
  'mia_k-1@sub.example.ch',
  'mia@123.ch',
  'a@b.co',
]

const ZOD_REFUSED = [
  '',
  ' ',
  'mia',
  'mia@',
  '@example.ch',
  'mia@example',
  'mia@example.c',
  'mia@.example.ch',
  'mia@-example.ch',
  '.mia@example.ch',
  'mia.@example.ch',
  'mia..keller@example.ch',
  'mia@example..ch',
  ' mia@example.ch',
  'mia@example.ch ',
  'mia keller@example.ch',
  'müller@example.ch',
  'mia@exämple.ch',
  'mia@example.ch1',
  'mia@example.ch\n',
  'mia@@example.ch',
  'm@e.c-h',
]

const t = i18n.t.bind(i18n)

describe('loginErrors', () => {
  it.each(ZOD_ACCEPTED)('takes %j, as zod did', (email) => {
    expect(loginErrors({ email, password: 'x' }, t)).toEqual({})
  })

  it.each(ZOD_REFUSED)('refuses %j, as zod did', (email) => {
    expect(loginErrors({ email, password: 'x' }, t)).toEqual({ email: i18n.t('auth:login.invalidEmail') })
  })

  it('asks for a password, and takes any that is not empty', () => {
    expect(loginErrors({ email: 'a@b.co', password: '' }, t)).toEqual({ password: i18n.t('errors:required') })
    expect(loginErrors({ email: 'a@b.co', password: ' ' }, t)).toEqual({})
  })

  it('says both at once, in the voice the page addresses the reader in', () => {
    const de = i18n.getFixedT('de')
    expect(loginErrors({ email: '', password: '' }, de, 'formal')).toEqual({
      email: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
      password: de('errors:required'),
    })
    expect(loginErrors({ email: 'mia', password: 'x' }, de, 'informal')).toEqual({
      email: 'Gib eine gültige E-Mail-Adresse ein.',
    })
  })
})

describe('the sign-in form', () => {
  const sent: unknown[] = []

  beforeAll(() => mswServer.listen({ onUnhandledRequest: 'bypass' }))
  afterAll(() => mswServer.close())
  beforeEach(() => {
    sent.length = 0
    sessionStorage.clear()
    mswServer.use(
      http.post('https://api.test/auth/login', async ({ request }) => {
        sent.push(await request.json())
        return HttpResponse.json({ detail: { code: 'invalid_credentials', message: 'No.' } }, { status: 401 })
      }),
    )
  })
  afterEach(() => mswServer.resetHandlers())

  function renderForm() {
    render(
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={new QueryClient()}>
          <MemoryRouter>
            <LoginForm />
          </MemoryRouter>
        </QueryClientProvider>
      </I18nextProvider>,
    )
    const email = screen.getByLabelText(i18n.t('auth:register.email'))
    const password = screen.getByLabelText(i18n.t('auth:register.password'))
    const submit = () => fireEvent.submit(screen.getByRole('button', { name: i18n.t('common:actions.signIn') }).closest('form')!)
    return { email, password, submit }
  }

  it('shows each field its own line and sends nothing while one is wrong', async () => {
    const { email, password, submit } = renderForm()
    fireEvent.change(email, { target: { value: 'mia@' } })
    submit()

    expect(await screen.findByText(i18n.t('auth:login.invalidEmail'))).toBeInTheDocument()
    expect(screen.getByText(i18n.t('errors:required'))).toBeInTheDocument()
    expect(email).toHaveAttribute('aria-describedby', 'login-email-error')
    expect(password).toHaveAttribute('aria-describedby', 'login-password-error')
    expect(sent).toEqual([])
  })

  it('sends the address and password as typed once both are fine, and clears the lines', async () => {
    const { email, password, submit } = renderForm()
    submit()
    expect(await screen.findByText(i18n.t('errors:required'))).toBeInTheDocument()

    fireEvent.change(email, { target: { value: 'Mia.Keller@example.test' } })
    fireEvent.change(password, { target: { value: ' secret ' } })
    submit()

    expect(await screen.findByText(i18n.t('auth:login.invalidCredentials'))).toBeInTheDocument()
    expect(sent).toEqual([{ email: 'Mia.Keller@example.test', password: ' secret ' }])
    expect(screen.queryByText(i18n.t('errors:required'))).not.toBeInTheDocument()
    expect(email).toHaveAttribute('aria-invalid', 'false')
  })
})
