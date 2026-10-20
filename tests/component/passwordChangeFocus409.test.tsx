/**
 * The password change keeps focus and ties its errors to their fields (#409).
 *
 * Each step of the change replaces the form before it, so focus went down to
 * the page with the field it was in (WCAG 2.4.3): it now goes to the new
 * step's first field, or to the success heading once the change is through.
 * An error was one line under the form, tied to no field (3.3.1): the field it
 * is about is now marked invalid and reads it.
 *
 * Driven through the real router and API layer against a mocked backend, on
 * both screens that offer the change, and through the forced change after an
 * administrator reset, which must still route as before.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { Suspense } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { AppRoutes } from '@/app/router/AppRoutes'
import i18n from '@/i18n'
import enAuth from '@/i18n/locales/en/auth.json'
import enCommon from '@/i18n/locales/en/common.json'
import enErrors from '@/i18n/locales/en/errors.json'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types/user'
import { mswServer } from '../mswServer'

const copy = enAuth.changePassword

const refusal = (code: string) => () =>
  HttpResponse.json({ detail: { code, message: 'refused' } }, { status: 400 })

function backend({
  request = () => HttpResponse.json({ status: 'sent', maskedRecipient: 'l******@example.com', expiresAt: 1_790_000_000 }),
  confirm = () => HttpResponse.json({ status: 'changed' }),
}: {
  request?: () => Response
  confirm?: () => Response
} = {}) {
  mswServer.use(
    http.post('https://api.test/auth/password-change/request', request),
    http.post('https://api.test/auth/password-change/confirm', confirm),
    // What the shell and /me read around the form is not under test here.
    http.get('https://api.test/notifications/preferences', () =>
      HttpResponse.json({ userId: 'u-1', preferences: {}, supportedCategories: [], supportedChannels: [], updatedAt: null }),
    ),
    http.get('https://api.test/students/me/profile', () =>
      HttpResponse.json({ userId: 'u-1', grade: '', primarySubjects: [], schoolSystem: null }),
    ),
    http.get('https://api.test/*', () => HttpResponse.json({ items: [], count: 0, nextToken: null })),
  )
}

let pathname = ''
function LocationProbe() {
  pathname = useLocation().pathname
  return null
}

function openAt(path: string, role: UserRole, mustChangePassword = false) {
  useAuthStore.setState({
    user: { id: 'u-1', name: 'Lina Meier', email: 'lina@example.com', role, mustChangePassword } as CurrentUser,
    accessToken: 'token',
    isAuthenticated: true,
  })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[path]}>
          <Suspense fallback={null}>
            <AppRoutes />
          </Suspense>
          <LocationProbe />
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

type User = ReturnType<typeof userEvent.setup>

async function sendCode(user: User, current = 'Old!Pass123') {
  await user.type(await screen.findByLabelText(copy.currentPasswordLabel), current)
  await user.click(screen.getByRole('button', { name: copy.sendCodeCta }))
  await screen.findByLabelText(copy.codeLabel)
}

async function submitNew(
  user: User,
  { code = '123456', next = 'New!Pass123', confirm = next }: { code?: string; next?: string; confirm?: string } = {},
) {
  if (code) await user.type(screen.getByLabelText(copy.codeLabel), code)
  await user.type(screen.getByLabelText(copy.newPasswordLabel), next)
  await user.type(screen.getByLabelText(copy.confirmPasswordLabel), confirm)
  await user.click(screen.getByRole('button', { name: copy.submit }))
}

/** Exactly the field labelled `label` is marked invalid and reads the alert; with null, none is. */
async function expectOnlyInvalid(label: string | null, message: string) {
  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent(message)
  expect(alert.id).not.toBe('')
  const fields = Array.from(document.querySelectorAll<HTMLInputElement>('form input'))
  expect(fields.length).toBeGreaterThan(0)
  for (const field of fields) {
    const name = field.labels?.[0]?.textContent
    if (name === label) {
      expect(field, name).toHaveAttribute('aria-invalid', 'true')
      expect(field.getAttribute('aria-describedby')?.split(' ')).toContain(alert.id)
      expect(field).toHaveAccessibleDescription(expect.stringContaining(message))
    } else {
      expect(field, name ?? field.id).not.toHaveAttribute('aria-invalid')
      expect(field.getAttribute('aria-describedby') ?? '').not.toContain(alert.id)
    }
  }
}

beforeAll(async () => {
  mswServer.listen({ onUnhandledRequest: 'error' })
  // Both screens are lazy pages; a cold first import can run past findBy's
  // one-second wait with the full suite beside it (#94, #133).
  await Promise.all([import('@/pages/me/MePage'), import('@/pages/auth/ChangePasswordPage')])
})
beforeEach(async () => {
  await i18n.changeLanguage('en')
})
afterEach(() => {
  mswServer.resetHandlers()
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})
afterAll(() => mswServer.close())

const SCREENS = [
  { name: '/settings/password', path: '/settings/password', role: 'teacher' as const, outcome: { level: 1 } },
  { name: '/me', path: '/me', role: 'student' as const, outcome: { level: 2 } },
]

describe.each(SCREENS)('the password change on $name moves focus with its steps', ({ path, role, outcome }) => {
  it('takes no focus on arrival', async () => {
    backend()
    openAt(path, role)

    expect(await screen.findByLabelText(copy.currentPasswordLabel)).not.toHaveFocus()
  })

  it('puts focus in the code field once the code is sent', async () => {
    const user = userEvent.setup()
    backend()
    openAt(path, role)

    await sendCode(user)

    await waitFor(() => expect(screen.getByLabelText(copy.codeLabel)).toHaveFocus())
  })

  it('puts focus back in the current password when a new code is asked for', async () => {
    const user = userEvent.setup()
    backend()
    openAt(path, role)
    await sendCode(user)

    await user.click(screen.getByRole('button', { name: copy.requestNewCode }))

    await waitFor(() => expect(screen.getByLabelText(copy.currentPasswordLabel)).toHaveFocus())
  })

  it('puts focus on the success heading once the change is through', async () => {
    const user = userEvent.setup()
    backend()
    openAt(path, role)
    await sendCode(user)

    await submitNew(user)

    const heading = await screen.findByRole('heading', { ...outcome, name: copy.successTitle })
    await waitFor(() => expect(heading).toHaveFocus())
  })
})

describe('the password change on /me, done once', () => {
  it('puts focus in the current password when the student changes it again', async () => {
    const user = userEvent.setup()
    backend()
    openAt('/me', 'student')
    await sendCode(user)
    await submitNew(user)
    await screen.findByRole('heading', { level: 2, name: copy.successTitle })

    await user.click(screen.getByRole('button', { name: enCommon.me.password.again }))

    await waitFor(() => expect(screen.getByLabelText(copy.currentPasswordLabel)).toHaveFocus())
  })
})

describe('the forced change after an administrator reset, with focus moving', () => {
  it('still releases the student on the page it was sent to, with focus on the success heading', async () => {
    const user = userEvent.setup()
    backend()
    openAt('/settings/password', 'student', true)
    expect(await screen.findByText(copy.forcedTitle)).toBeInTheDocument()

    await sendCode(user, 'Temp!Pass123')
    await waitFor(() => expect(screen.getByLabelText(copy.codeLabel)).toHaveFocus())
    await submitNew(user)

    const heading = await screen.findByRole('heading', { level: 1, name: copy.successTitle })
    await waitFor(() => expect(heading).toHaveFocus())
    await waitFor(() => expect(useAuthStore.getState().user?.mustChangePassword).toBe(false))
    expect(pathname).toBe('/settings/password')
    expect(screen.queryByRole('link', { name: enCommon.actions.back })).toBeNull()
    await user.click(screen.getByRole('link', { name: enCommon.actions.continue }))
    await waitFor(() => expect(pathname).toBe('/'))
  })
})

describe.each(SCREENS)('an error in the password change on $name', ({ path, role }) => {
  it('marks no field while nothing is wrong, and the new password reads only its rules', async () => {
    const user = userEvent.setup()
    backend()
    openAt(path, role)
    expect(await screen.findByLabelText(copy.currentPasswordLabel)).not.toHaveAttribute('aria-invalid')
    await sendCode(user)

    for (const field of document.querySelectorAll('form input')) expect(field).not.toHaveAttribute('aria-invalid')
    expect(screen.getByLabelText(copy.newPasswordLabel)).toHaveAccessibleDescription(enErrors.passwordRequirements)
  })

  it('ties a missing current password to that field', async () => {
    const user = userEvent.setup()
    backend()
    openAt(path, role)

    await user.click(await screen.findByRole('button', { name: copy.sendCodeCta }))

    await expectOnlyInvalid(copy.currentPasswordLabel, enErrors.required)
  })

  it('ties a wrong current password to that field', async () => {
    const user = userEvent.setup()
    backend({ request: refusal('password_change_credentials_invalid') })
    openAt(path, role)

    await user.type(await screen.findByLabelText(copy.currentPasswordLabel), 'Wrong!Pass1')
    await user.click(screen.getByRole('button', { name: copy.sendCodeCta }))

    await expectOnlyInvalid(copy.currentPasswordLabel, copy.errors.password_change_credentials_invalid)
  })

  it('marks no field for a refusal about the whole form', async () => {
    const user = userEvent.setup()
    backend({ request: refusal('password_change_code_rate_limited') })
    openAt(path, role)

    await user.type(await screen.findByLabelText(copy.currentPasswordLabel), 'Old!Pass123')
    await user.click(screen.getByRole('button', { name: copy.sendCodeCta }))

    await expectOnlyInvalid(null, copy.errors.password_change_code_rate_limited)
  })

  it('ties a missing code to the code field', async () => {
    const user = userEvent.setup()
    backend()
    openAt(path, role)
    await sendCode(user)

    await submitNew(user, { code: '' })

    await expectOnlyInvalid(copy.codeLabel, enErrors.required)
  })

  it('ties a password that breaks the rules to the new password, read before its rules', async () => {
    const user = userEvent.setup()
    backend()
    openAt(path, role)
    await sendCode(user)

    await submitNew(user, { next: 'weakpass' })

    await expectOnlyInvalid(copy.newPasswordLabel, enErrors.passwordRequirements)
    const field = screen.getByLabelText(copy.newPasswordLabel)
    const [first, second] = field.getAttribute('aria-describedby')?.split(' ') ?? []
    expect(first).toBe(screen.getByRole('alert').id)
    expect(document.getElementById(second ?? '')).toHaveTextContent(enErrors.passwordRequirements)
  })

  it('ties a mismatch to the confirmation field', async () => {
    const user = userEvent.setup()
    backend()
    openAt(path, role)
    await sendCode(user)

    await submitNew(user, { next: 'New!Pass123', confirm: 'New!Pass124' })

    await expectOnlyInvalid(copy.confirmPasswordLabel, copy.passwordMismatch)
  })

  it('ties a code the backend refused to the code field', async () => {
    const user = userEvent.setup()
    backend({ confirm: refusal('password_change_verification_failed') })
    openAt(path, role)
    await sendCode(user)

    await submitNew(user, { code: '000000' })

    await expectOnlyInvalid(copy.codeLabel, copy.errors.password_change_verification_failed)
  })

  it('ties a password the backend refused to the new password', async () => {
    const user = userEvent.setup()
    backend({ confirm: refusal('password_requirements_not_met') })
    openAt(path, role)
    await sendCode(user)

    await submitNew(user)

    await expectOnlyInvalid(copy.newPasswordLabel, copy.errors.password_requirements_not_met)
  })
})
