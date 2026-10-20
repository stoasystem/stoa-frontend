/**
 * The two activation pages keep focus, read their password rules, tie their
 * errors to their fields, and resume with the whole token (#409).
 *
 * - Once activation succeeds the form goes, and focus went down to the page
 *   with it (WCAG 2.4.3): it moves to the sentence saying it worked.
 * - The password rules sat under the field without being read with it (1.3.1,
 *   3.3.2), and an error marked no field (3.3.1).
 * - The teacher page's "sign in to finish" link put the raw token inside the
 *   `next` it sends to the sign-in, so a token with `#` or `&` was cut there
 *   once the sign-in decoded `next`.
 *
 * Through the real API layer against a mocked backend.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import i18n from '@/i18n'
import enAdmin from '@/i18n/locales/en/admin.json'
import enAuth from '@/i18n/locales/en/auth.json'
import enErrors from '@/i18n/locales/en/errors.json'
import { getPostLoginPath } from '@/lib/authRoutes'
import { ActivateAccountPage } from '@/pages/auth/ActivateAccountPage'
import { TeacherActivatePage } from '@/pages/auth/TeacherActivatePage'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import { mswServer } from '../mswServer'

const TOKEN = 'invitation-token-32-characters-long'
const GOOD = 'ValidPass12!'

const refused = (code: string) => HttpResponse.json({ detail: { code, message: 'refused' } }, { status: 400 })

function renderAt(path: string, url: string, page: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path={path} element={page} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

type Page = {
  name: string
  open: (token?: string) => void
  claimUrl: string
  copy: {
    confirmPassword: string
    submit: string
    success: string
    passwordMismatch: string
    signIn: string
    errors: { password_rejected: string; invitation_expired: string }
  }
  passwordLabel: string
}

const PAGES: Page[] = [
  {
    name: 'the account activation',
    open: (token = TOKEN) =>
      renderAt('/activate', `/activate?token=${encodeURIComponent(token)}`, <ActivateAccountPage />),
    claimUrl: 'https://api.test/auth/invitations/claim',
    copy: enAdmin.activation,
    passwordLabel: enAuth.register.password,
  },
  {
    name: 'the teacher activation',
    open: (token = TOKEN) =>
      renderAt('/teacher-activate', `/teacher-activate?token=${encodeURIComponent(token)}`, <TeacherActivatePage />),
    claimUrl: 'https://api.test/teacher-applications/activation/claim',
    copy: enAuth.activate,
    passwordLabel: enAuth.register.password,
  },
]

function serveClaim(page: Page, reply: () => Response) {
  mswServer.use(http.post(page.claimUrl, reply))
}

async function claim(page: Page, { password = GOOD, confirm = password }: { password?: string; confirm?: string } = {}) {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(page.passwordLabel), password)
  await user.type(screen.getByLabelText(page.copy.confirmPassword), confirm)
  await user.click(screen.getByRole('button', { name: page.copy.submit }))
}

/** Exactly the field labelled `label` is marked invalid and reads the alert; with null, none is. */
async function expectOnlyInvalid(label: string | null, message: string) {
  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent(message)
  expect(alert.id).not.toBe('')
  for (const field of document.querySelectorAll<HTMLInputElement>('form input')) {
    const name = document.querySelector(`label[for="${field.id}"]`)?.textContent
    if (name === label) {
      expect(field, name).toHaveAttribute('aria-invalid', 'true')
      expect(field.getAttribute('aria-describedby')?.split(' ')[0]).toBe(alert.id)
      expect(field).toHaveAccessibleDescription(expect.stringContaining(message))
    } else {
      expect(field, name ?? field.id).not.toHaveAttribute('aria-invalid')
      expect(field.getAttribute('aria-describedby') ?? '').not.toContain(alert.id)
    }
  }
}

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }))
beforeEach(async () => {
  await i18n.changeLanguage('en')
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})
afterEach(() => {
  mswServer.resetHandlers()
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})
afterAll(() => mswServer.close())

describe.each(PAGES)('$name', (page) => {
  it('reads the password rules with the password field, and takes no focus on arrival', () => {
    page.open()

    const password = screen.getByLabelText(page.passwordLabel)
    expect(password).toHaveAccessibleDescription(enErrors.passwordRequirements)
    expect(password).not.toHaveAttribute('aria-invalid')
    expect(screen.getByLabelText(page.copy.confirmPassword)).not.toHaveAttribute('aria-invalid')
    expect(password).not.toHaveFocus()
  })

  it('ties a mismatch to the confirmation field', async () => {
    page.open()

    await claim(page, { password: GOOD, confirm: 'ValidPass13!' })

    await expectOnlyInvalid(page.copy.confirmPassword, page.copy.passwordMismatch)
  })

  it('ties a password that breaks the rules to the password field, read before the rules', async () => {
    page.open()

    await claim(page, { password: 'weakpass' })

    await expectOnlyInvalid(page.passwordLabel, enErrors.passwordRequirements)
    const [, rules] = screen.getByLabelText(page.passwordLabel).getAttribute('aria-describedby')?.split(' ') ?? []
    expect(document.getElementById(rules ?? '')).toHaveTextContent(enErrors.passwordRequirements)
  })

  it('ties a password the backend rejected to the password field', async () => {
    serveClaim(page, () => refused('password_rejected'))
    page.open()

    await claim(page)

    await expectOnlyInvalid(page.passwordLabel, page.copy.errors.password_rejected)
  })

  it('marks no field for a refusal about the invitation', async () => {
    serveClaim(page, () => refused('invitation_expired'))
    page.open()

    await claim(page)

    await expectOnlyInvalid(null, page.copy.errors.invitation_expired)
  })

  it('puts focus on the sentence saying it worked, with the sign-in link next', async () => {
    serveClaim(page, () => HttpResponse.json({ status: 'activated', email: 'ada@example.com' }))
    page.open()

    await claim(page)

    const success = await screen.findByText(page.copy.success)
    await waitFor(() => expect(success).toHaveFocus())
    expect(screen.queryByLabelText(page.passwordLabel)).toBeNull()
    await userEvent.setup().tab()
    expect(screen.getByRole('link', { name: page.copy.signIn })).toHaveFocus()
  })
})

describe('the account activation, its date of birth', () => {
  it('reads its hint, and is the field a refused date is tied to', async () => {
    serveClaim(PAGES[0], () => refused('date_of_birth_invalid'))
    PAGES[0].open()
    const dateOfBirth = screen.getByLabelText(enAdmin.activation.dateOfBirth)
    expect(dateOfBirth).toHaveAccessibleDescription(enAdmin.activation.dateOfBirthHint)

    await claim(PAGES[0])

    await expectOnlyInvalid(enAdmin.activation.dateOfBirth, enAdmin.activation.errors.date_of_birth_invalid)
    expect(dateOfBirth).toHaveAccessibleDescription(
      `${enAdmin.activation.errors.date_of_birth_invalid} ${enAdmin.activation.dateOfBirthHint}`,
    )
  })
})

describe('the teacher activation, signed in already', () => {
  it('puts focus on the sentence saying it worked once the finish step goes through', async () => {
    mswServer.use(
      http.post('https://api.test/teacher-applications/activation/consume', () =>
        HttpResponse.json({ status: 'activated', email: 'ada@example.com' }),
      ),
    )
    useAuthStore.setState({
      user: { id: 't-1', name: 'Ada', email: 'ada@example.com', role: 'teacher' } as CurrentUser,
      accessToken: 'token',
      isAuthenticated: true,
    })
    PAGES[1].open()

    await userEvent.setup().click(screen.getByRole('button', { name: enAuth.activate.finish }))

    const success = await screen.findByText(enAuth.activate.success)
    await waitFor(() => expect(success).toHaveFocus())
  })
})

describe('the teacher activation, sent to sign in first', () => {
  /** The "sign in to finish" link the page shows once the claim says to resume. */
  async function resumeLink(token: string) {
    serveClaim(PAGES[1], () => refused('activation_resume_required'))
    PAGES[1].open(token)
    await claim(PAGES[1])
    return (await screen.findByRole('link', { name: enAuth.activate.resumeSignIn })).getAttribute('href') ?? ''
  }

  /** The token the activation page reads after the sign-in has followed that link. */
  function tokenAfterSignIn(href: string) {
    const login = new URL(href, window.location.origin)
    expect(login.pathname).toBe('/login')
    const landing = getPostLoginPath({ role: 'teacher' }, { search: login.search })
    const page = new URL(landing, window.location.origin)
    expect(page.pathname).toBe('/teacher-activate')
    expect(page.hash).toBe('')
    return page.searchParams.get('token')
  }

  it.each([
    ['a # and an &', 'inv#tok&role=admin'],
    ['every character a query treats as its own', 'a#b&c=d?e/f%25g+h i'],
  ])('keeps a token with %s whole', async (_, token) => {
    expect(tokenAfterSignIn(await resumeLink(token))).toBe(token)
  })

  it('leaves the link for a token of URL-safe characters as it was', async () => {
    const href = await resumeLink(TOKEN)

    expect(href).toBe(`/login?next=${encodeURIComponent(`/teacher-activate?token=${TOKEN}`)}`)
    expect(tokenAfterSignIn(href)).toBe(TOKEN)
  })
})
