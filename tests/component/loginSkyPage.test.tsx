/**
 * The sign-in page on the sky (#53). The page was redrawn; signing in was
 * not. So this holds both: the page is a sky surface whose fields keep their
 * labels and autocomplete hints, and through the real form, the real
 * mutation and the real HTTP layer (MSW), a sign-in still lands where `next`
 * points, a reset account still goes to the password page, and refusals
 * still reach the screen -- without anything red or burgundy on the sky.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import i18n from '@/i18n'
import deAuth from '@/i18n/locales/de/auth.json'
import enAuth from '@/i18n/locales/en/auth.json'
import frAuth from '@/i18n/locales/fr/auth.json'
import itAuth from '@/i18n/locales/it/auth.json'
import { LoginPage } from '@/pages/login/LoginPage'
import { useAuthStore } from '@/store/authStore'
import { mswServer } from '../mswServer'

function renderLogin(entry = '/login') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[entry]}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<p>student home</p>} />
            <Route path="/planet/:subjectId" element={<p>the maths planet</p>} />
            <Route path="/settings/password" element={<p>change your password</p>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

function answerLoginWith(body: object, status = 200) {
  mswServer.use(http.post('https://api.test/auth/login', () => HttpResponse.json(body, { status })))
}

const student = { id: 'u-1', name: 'Ada', email: 'ada@example.com', role: 'student', mustChangePassword: false }

async function signIn(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Email'), 'ada@example.com')
  await user.type(screen.getByLabelText('Password'), 'correct horse')
  await user.click(screen.getByRole('button', { name: 'Sign in' }))
}

// Nothing red and nothing burgundy sits on the sky (canvas; #18).
function expectNoLightAlarmColours(container: HTMLElement) {
  const html = container.innerHTML
  expect(html).not.toMatch(/destructive|burgundy|text-red|bg-red/)
}

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }))
afterAll(() => mswServer.close())
beforeEach(async () => {
  await i18n.changeLanguage('en')
  useAuthStore.getState().clearAuth()
})
afterEach(() => {
  mswServer.resetHandlers()
  useAuthStore.getState().clearAuth()
  localStorage.clear()
})

describe('the sign-in page', () => {
  it('is one sky surface holding the heading, the form and the nebula', () => {
    const { container } = renderLogin()

    const sky = container.firstElementChild as HTMLElement
    expect(sky).toHaveAttribute('data-surface', 'sky')
    expect(container.querySelectorAll('[data-surface]')).toHaveLength(1)
    expect(within(sky).getByRole('heading', { level: 1, name: enAuth.login.title })).toBeInTheDocument()
    expect(sky.querySelector('form')).not.toBeNull()
    // The nebula is decoration: drawn, and hidden from assistive technology.
    const nebula = sky.querySelector('[data-login-nebula]')
    expect(nebula).not.toBeNull()
    expect(nebula).toHaveAttribute('aria-hidden', 'true')
    // Its glow is baked into gradients: no blur filter to redraw while the stars breathe.
    expect(nebula?.querySelector('filter')).toBeNull()
    expect(nebula?.querySelectorAll('.sky-breathe').length).toBeGreaterThan(0)
    expect(within(sky).getByText(enAuth.login.skyCaption)).toBeInTheDocument()
  })

  it('keeps each field labelled, with the hints browsers and password managers read', () => {
    renderLogin()

    const email = screen.getByLabelText('Email')
    expect(email).toHaveAttribute('type', 'email')
    expect(email).toHaveAttribute('autocomplete', 'email')
    expect(email).toBeRequired()

    const password = screen.getByLabelText('Password')
    expect(password).toHaveAttribute('type', 'password')
    expect(password).toHaveAttribute('autocomplete', 'current-password')
    expect(password).toBeRequired()

    const submit = screen.getByRole('button', { name: 'Sign in' })
    expect(submit).toHaveAttribute('type', 'submit')
    // The canvas's filled button on dark: white, #0A1020 text.
    expect(submit).toHaveAttribute('data-variant', 'onSky')
  })

  it('offers the language switch on the sky, named with the language it shows', () => {
    renderLogin()

    // WCAG 2.5.3: the visible "EN" is part of the name.
    const trigger = screen.getByRole('button', { name: 'Language: English (EN)' })
    expect(trigger).toHaveTextContent('EN')
    expect(trigger.getAttribute('aria-label')).toContain(trigger.textContent?.trim())
  })

  it('marks the account link as a link inside the sentence, not by colour alone', () => {
    renderLogin()

    // White and underlined by its own classes (#73: the base `a` rule no longer outranks them).
    expect(screen.getByRole('link', { name: enAuth.login.howToGetAccount })).toHaveClass('text-on-sky', 'underline')
    for (const name of ['Help and support', 'Privacy', 'Terms', 'Back to STOA homepage']) {
      expect(screen.getByRole('link', { name })).toHaveClass('text-[color:var(--on-sky-text-caption)]', 'hover:text-on-sky')
    }
  })

  it.each([
    ['de', deAuth],
    ['en', enAuth],
    ['fr', frAuth],
    ['it', itAuth],
  ] as const)('speaks %s throughout', async (language, auth) => {
    await i18n.changeLanguage(language)
    renderLogin()

    expect(screen.getByRole('button', { name: new RegExp(`\\(${language.toUpperCase()}\\)$`) })).toHaveTextContent(
      language.toUpperCase(),
    )

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(auth.login.title)
    expect(screen.getByText(auth.login.eyebrow)).toBeInTheDocument()
    expect(screen.getByText(auth.login.subtitle)).toBeInTheDocument()
    expect(screen.getByText(auth.login.audience)).toBeInTheDocument()
    expect(screen.getByText(auth.login.skyCaption)).toBeInTheDocument()
    expect(screen.getByLabelText(auth.register.email)).toHaveAttribute('id', 'email')
    expect(screen.getByLabelText(auth.register.password)).toHaveAttribute('id', 'password')
  })
})

describe('signing in from the sky page', () => {
  it('lands where `next` points', async () => {
    answerLoginWith({ accessToken: 'token-1', user: student })
    const user = userEvent.setup()
    renderLogin('/login?next=/planet/math')

    await signIn(user)

    expect(await screen.findByText('the maths planet')).toBeInTheDocument()
    expect(useAuthStore.getState().user?.email).toBe('ada@example.com')
  })

  it('ignores a `next` the role may not open and goes home instead', async () => {
    answerLoginWith({ accessToken: 'token-1', user: student })
    const user = userEvent.setup()
    renderLogin('/login?next=/admin/users')

    await signIn(user)

    expect(await screen.findByText('student home')).toBeInTheDocument()
  })

  it('sends an account an administrator reset straight to the password page', async () => {
    answerLoginWith({ accessToken: 'token-1', user: { ...student, mustChangePassword: true } })
    const user = userEvent.setup()
    renderLogin('/login?next=/planet/math')

    await signIn(user)

    expect(await screen.findByText('change your password')).toBeInTheDocument()
  })

  it('answers empty fields itself, on the sky', async () => {
    const user = userEvent.setup()
    const { container } = renderLogin()

    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    const alerts = await screen.findAllByRole('alert')
    expect(alerts).toHaveLength(2)
    // Not colour alone: every error carries a glyph, and the invalid field's
    // rule is thicker, not only whiter.
    for (const alert of alerts) {
      expect(alert.querySelector('svg[aria-hidden="true"]')).not.toBeNull()
    }
    for (const label of ['Email', 'Password']) {
      expect(screen.getByLabelText(label)).toHaveClass('border-b-2')
      expect(screen.getByLabelText(label)).toHaveClass('border-[color:var(--on-sky-field-rule)]', 'aria-[invalid=true]:border-on-sky')
    }
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-describedby', 'login-email-error')
    expect(screen.getByLabelText('Password')).toHaveAttribute('aria-describedby', 'login-password-error')
    expectNoLightAlarmColours(container)
  })

  it('shows the server’s refusal, a rate limit included', async () => {
    answerLoginWith({ detail: 'Too many sign-in attempts. Try again in a minute.' }, 429)
    const user = userEvent.setup()
    const { container } = renderLogin()

    await signIn(user)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Too many sign-in attempts. Try again in a minute.')
    expect(alert.querySelector('svg[aria-hidden="true"]')).not.toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expectNoLightAlarmColours(container)
  })

  it('hands an unverified account to email verification, drawn as a glass card on the sky', async () => {
    answerLoginWith({ detail: { code: 'email_verification_required', message: 'Verify your email first.' } }, 403)
    const user = userEvent.setup()
    const { container } = renderLogin()

    await signIn(user)

    const heading = await screen.findByRole('heading', { level: 2, name: enAuth.verification.title })
    expect(screen.getByLabelText(enAuth.verification.codeLabel)).toHaveAttribute('autocomplete', 'one-time-code')
    expect(screen.getByRole('button', { name: enAuth.verification.confirmCta })).toHaveAttribute('data-variant', 'onSky')
    expect(screen.getByRole('button', { name: enAuth.verification.resendCta })).toHaveAttribute('data-variant', 'onSkyPlain')
    expect(heading.closest('[data-surface="sky"]')).not.toBeNull()
    // The verification panel replaces the generic failure line.
    expect(screen.queryByText(enAuth.login.failed)).not.toBeInTheDocument()
    expectNoLightAlarmColours(container)
  })
})

describe('the document behind the sign-in page', () => {
  // jsdom reads no index.css; give the surface its --sky the way brand-tokens.css does.
  let tokens: HTMLStyleElement
  beforeAll(() => {
    tokens = document.createElement('style')
    tokens.textContent = '[data-surface="sky"] { --sky: #0A1020; }'
    document.head.appendChild(tokens)
  })
  afterAll(() => tokens.remove())
  afterEach(() => {
    document.documentElement.style.backgroundColor = ''
    document.body.style.backgroundColor = ''
  })

  const SKY = /^(rgb\(10, 16, 32\)|#0a1020)$/i

  function renderWithAWayOut() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return render(
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={client}>
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/privacy" element={<p>the privacy notice</p>} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </I18nextProvider>,
    )
  }

  it('is the sky while the page is up, and is given back when the reader leaves', async () => {
    const user = userEvent.setup()
    renderWithAWayOut()

    expect(document.documentElement.style.backgroundColor).toMatch(SKY)
    expect(document.body.style.backgroundColor).toMatch(SKY)

    await user.click(screen.getByRole('link', { name: 'Privacy' }))

    expect(await screen.findByText('the privacy notice')).toBeInTheDocument()
    expect(document.documentElement.style.backgroundColor).toBe('')
    expect(document.body.style.backgroundColor).toBe('')
  })

  it('puts back whatever inline background was there before, on unmount', () => {
    document.documentElement.style.backgroundColor = 'rgb(1, 2, 3)'
    document.body.style.backgroundColor = 'rgb(4, 5, 6)'
    const view = renderWithAWayOut()

    expect(document.documentElement.style.backgroundColor).toMatch(SKY)
    expect(document.body.style.backgroundColor).toMatch(SKY)

    view.unmount()

    expect(document.documentElement.style.backgroundColor).toBe('rgb(1, 2, 3)')
    expect(document.body.style.backgroundColor).toBe('rgb(4, 5, 6)')
  })
})
