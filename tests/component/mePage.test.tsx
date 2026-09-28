/**
 * `/me`, the account page (#46): profile, language, notification preferences
 * and the password change, inside the app shell. The password change is the
 * same flow as /settings/password (same calls, same checks, same messages);
 * these drive it through the real API layer against a mocked backend, and
 * the real router, so the forced change is seen to route as before.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { Suspense } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { AppRoutes } from '@/app/router/AppRoutes'
import i18n from '@/i18n'
import enAuth from '@/i18n/locales/en/auth.json'
import enCommon from '@/i18n/locales/en/common.json'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types/user'
import { mswServer } from '../mswServer'

const copy = enAuth.changePassword

type Seen = { request: unknown[]; confirm: unknown[]; preferences: unknown[]; log: string[] }

const DEFAULT_MATRIX = {
  admin_operations: { in_app: true, realtime: true, email_digest: false, push: false },
  assignments: { in_app: true, realtime: true, email_digest: false, push: false },
  learning_updates: { in_app: true, realtime: true, email_digest: false, push: true },
  teacher_responses: { in_app: true, realtime: true, email_digest: true, push: false },
  weekly_reports: { in_app: true, realtime: true, email_digest: false, push: false },
}

function backend({
  request = () => HttpResponse.json({ status: 'sent', maskedRecipient: 'l******@example.com', expiresAt: 1_790_000_000 }),
  confirm = () => HttpResponse.json({ status: 'changed' }),
}: {
  request?: () => Response
  confirm?: () => Response
} = {}): Seen {
  const seen: Seen = { request: [], confirm: [], preferences: [], log: [] }
  let matrix: Record<string, unknown> = structuredClone(DEFAULT_MATRIX)
  const preferencesBody = () => ({
    userId: 'u-1',
    preferences: matrix,
    supportedCategories: Object.keys(DEFAULT_MATRIX),
    supportedChannels: ['email_digest', 'in_app', 'push', 'realtime'],
    updatedAt: null,
  })
  mswServer.use(
    http.get('https://api.test/notifications', () => HttpResponse.json({ items: [], count: 0 })),
    http.get('https://api.test/notifications/preferences', () => {
      seen.log.push('read')
      return HttpResponse.json(preferencesBody())
    }),
    http.patch('https://api.test/notifications/preferences', async ({ request: req }) => {
      const body = (await req.json()) as { preferences: Record<string, unknown> }
      seen.log.push('write')
      seen.preferences.push(body)
      await delay(40)
      matrix = body.preferences
      seen.log.push('written')
      return HttpResponse.json(preferencesBody())
    }),
    http.post('https://api.test/auth/password-change/request', async ({ request: req }) => {
      seen.request.push(await req.json())
      return request()
    }),
    http.post('https://api.test/auth/password-change/confirm', async ({ request: req }) => {
      seen.confirm.push(await req.json())
      return confirm()
    }),
  )
  return seen
}

let client: QueryClient
let pathname = ''
let go: (to: string) => void = () => {}
function LocationProbe() {
  pathname = useLocation().pathname
  go = useNavigate()
  return null
}

function openAt(path: string, role: UserRole = 'student', options: { mustChangePassword?: boolean } = {}) {
  useAuthStore.setState({
    user: {
      id: 'u-1',
      name: 'Lina Meier',
      email: 'lina@example.com',
      role,
      mustChangePassword: options.mustChangePassword ?? false,
    } as CurrentUser,
    accessToken: 'token',
    isAuthenticated: true,
  })
  client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
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

async function sendCode(user: ReturnType<typeof userEvent.setup>, current = 'Old!Pass123') {
  await user.type(await screen.findByLabelText(copy.currentPasswordLabel), current)
  await user.click(screen.getByRole('button', { name: copy.sendCodeCta }))
}

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }))
beforeEach(async () => {
  await i18n.changeLanguage('en')
})
afterEach(() => {
  mswServer.resetHandlers()
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})
afterAll(() => mswServer.close())

describe('/me', () => {
  it('shows the profile, the language, the notification switch and the password form inside the shell', async () => {
    backend()
    openAt('/me')

    expect(await screen.findByRole('heading', { level: 1, name: enCommon.studentRoutes.me.title })).toBeInTheDocument()
    expect(document.querySelector('[data-top-bar]')).not.toBeNull()
    expect(screen.getByRole('button', { name: enCommon.accountMenu.open })).toBeInTheDocument()

    // Read-only: no endpoint edits them.
    expect(screen.getAllByText('lina@example.com').length).toBeGreaterThan(0)
    expect(screen.queryByRole('textbox', { name: enCommon.me.profile.email })).toBeNull()

    const languages = screen.getByRole('radiogroup', { name: enCommon.me.language.heading })
    expect(within(languages).getAllByRole('radio')).toHaveLength(4)
    expect(within(languages).getByRole('radio', { name: 'English' })).toBeChecked()

    expect(
      await screen.findByRole('switch', { name: enCommon.me.notifications.categories.teacher_responses.title }),
    ).toBeChecked()

    const password = screen.getByRole('region', { name: enCommon.me.password.heading })
    expect(within(password).getByLabelText(copy.currentPasswordLabel)).toHaveAttribute('type', 'password')
    expect(within(password).getByRole('button', { name: copy.sendCodeCta })).toBeInTheDocument()
  })

  it('shows an administrator the page without the student notification switch', async () => {
    backend()
    openAt('/me', 'admin')

    expect(await screen.findByLabelText(copy.currentPasswordLabel)).toBeInTheDocument()
    expect(screen.queryByRole('switch')).toBeNull()
  })

  it('switches the language from the list', async () => {
    const user = userEvent.setup()
    backend()
    mswServer.use(
      http.patch('https://api.test/auth/me/preferences/locale', () =>
        HttpResponse.json({ preferredLocale: 'de', effectiveLocale: 'de', supportedLocales: ['de', 'en', 'fr', 'it'] }),
      ),
    )
    openAt('/me')

    await user.click(await screen.findByRole('radio', { name: 'Deutsch' }))

    await waitFor(() => expect(i18n.language).toBe('de'))
    expect(await screen.findByRole('radio', { name: 'Deutsch' })).toBeChecked()
  })
})

describe('changing the password on /me', () => {
  it('walks current password, emailed code and new password, then says it is done', async () => {
    const user = userEvent.setup()
    const seen = backend()
    openAt('/me')

    await sendCode(user)
    expect(await screen.findByText(copy.sentBody.replace('{{email}}', 'l******@example.com'))).toBeInTheDocument()
    expect(seen.request).toEqual([{ currentPassword: 'Old!Pass123' }])

    await user.type(screen.getByLabelText(copy.codeLabel), '123456')
    await user.type(screen.getByLabelText(copy.newPasswordLabel), 'New!Pass123')
    await user.type(screen.getByLabelText(copy.confirmPasswordLabel), 'New!Pass123')
    await user.click(screen.getByRole('button', { name: copy.submit }))

    expect(await screen.findByText(copy.successBody)).toBeInTheDocument()
    expect(seen.confirm).toEqual([{ currentPassword: 'Old!Pass123', code: '123456', newPassword: 'New!Pass123' }])
    // Still signed in, still on /me: Cognito's change_password revokes nothing.
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(pathname).toBe('/me')
  })

  it('offers another change after one went through, starting from empty fields', async () => {
    const user = userEvent.setup()
    const seen = backend()
    openAt('/me')
    await completeChange(user, 'Old!Pass123')

    await user.click(screen.getByRole('button', { name: enCommon.me.password.again }))

    const current = await screen.findByLabelText(copy.currentPasswordLabel)
    expect(current).toHaveValue('')
    expect(screen.queryByText(copy.successBody)).toBeNull()
    expect(screen.getByText(copy.body)).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(pathname).toBe('/me')

    // Nothing of the first change is left in the second step either.
    await sendCode(user, 'New!Pass123')
    expect(await screen.findByLabelText(copy.codeLabel)).toHaveValue('')
    expect(screen.getByLabelText(copy.newPasswordLabel)).toHaveValue('')
    expect(screen.getByLabelText(copy.confirmPasswordLabel)).toHaveValue('')

    await user.type(screen.getByLabelText(copy.codeLabel), '654321')
    await user.type(screen.getByLabelText(copy.newPasswordLabel), 'Third!Pass123')
    await user.type(screen.getByLabelText(copy.confirmPasswordLabel), 'Third!Pass123')
    await user.click(screen.getByRole('button', { name: copy.submit }))
    expect(await screen.findByText(copy.successBody)).toBeInTheDocument()

    expect(seen.request).toEqual([{ currentPassword: 'Old!Pass123' }, { currentPassword: 'New!Pass123' }])
    expect(seen.confirm).toEqual([
      { currentPassword: 'Old!Pass123', code: '123456', newPassword: 'New!Pass123' },
      { currentPassword: 'New!Pass123', code: '654321', newPassword: 'Third!Pass123' },
    ])
  })

  // A mutation keeps what it was called with; for these that is passwords.
  it('keeps no password in the query client once "Change it again" has reset the form', async () => {
    const user = userEvent.setup()
    backend()
    openAt('/me')
    await completeChange(user, 'Old!Pass123')

    await user.click(screen.getByRole('button', { name: enCommon.me.password.again }))
    await screen.findByLabelText(copy.currentPasswordLabel)

    await waitFor(() => {
      const held = client
        .getMutationCache()
        .getAll()
        .map((mutation) => JSON.stringify(mutation.state.variables ?? null))
      expect(held.filter((variables) => /Pass123|123456/.test(variables))).toEqual([])
    })
    // And an empty first step asks for the password again rather than resending one.
    await user.click(screen.getByRole('button', { name: copy.sendCodeCta }))
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })

  it('says so when the current password is wrong, and asks for no code', async () => {
    const user = userEvent.setup()
    backend({
      request: () =>
        HttpResponse.json(
          { detail: { code: 'password_change_credentials_invalid', message: 'Check the current password and try again.' } },
          { status: 400 },
        ),
    })
    openAt('/me')

    await sendCode(user, 'Wrong!Pass1')

    expect(await screen.findByRole('alert')).toHaveTextContent(copy.errors.password_change_credentials_invalid)
    expect(screen.queryByLabelText(copy.codeLabel)).toBeNull()
    // A 400, not a 401: the session is fine and the visitor stays signed in.
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })

  it('falls back to the general message when the server fails', async () => {
    const user = userEvent.setup()
    backend({ request: () => new HttpResponse(null, { status: 500 }) })
    openAt('/me')

    await sendCode(user)

    expect(await screen.findByRole('alert')).toHaveTextContent(copy.failed)
    expect(screen.queryByLabelText(copy.codeLabel)).toBeNull()
  })

  it('reports a failed confirmation and keeps the code step open', async () => {
    const user = userEvent.setup()
    backend({
      confirm: () =>
        HttpResponse.json({ detail: { code: 'password_change_verification_failed', message: 'x' } }, { status: 400 }),
    })
    openAt('/me')

    await sendCode(user)
    await user.type(await screen.findByLabelText(copy.codeLabel), '000000')
    await user.type(screen.getByLabelText(copy.newPasswordLabel), 'New!Pass123')
    await user.type(screen.getByLabelText(copy.confirmPasswordLabel), 'New!Pass123')
    await user.click(screen.getByRole('button', { name: copy.submit }))

    expect(await screen.findByRole('alert')).toHaveTextContent(copy.errors.password_change_verification_failed)
    expect(screen.getByLabelText(copy.codeLabel)).toBeInTheDocument()
  })

  it('checks the new password before calling the backend, as /settings/password does', async () => {
    const user = userEvent.setup()
    const seen = backend()
    openAt('/me')

    await sendCode(user)
    await user.type(await screen.findByLabelText(copy.codeLabel), '123456')
    await user.type(screen.getByLabelText(copy.newPasswordLabel), 'weakpass')
    await user.type(screen.getByLabelText(copy.confirmPasswordLabel), 'weakpass')
    await user.click(screen.getByRole('button', { name: copy.submit }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/./)
    expect(seen.confirm).toEqual([])
  })

  it('is where the avatar menu’s "Change password" leads a student', async () => {
    const user = userEvent.setup()
    backend()
    openAt('/me')

    await user.click(await screen.findByRole('button', { name: enCommon.accountMenu.open }))
    await user.click(await screen.findByRole('menuitem', { name: enCommon.actions.changePassword }))

    await waitFor(() => expect(screen.getByRole('heading', { name: enCommon.me.password.heading })).toHaveFocus())
    expect(pathname).toBe('/me')
  })
})

describe('the forced change after an administrator reset', () => {
  it('still takes a reset student from /me to /settings/password, with no way out', async () => {
    backend()
    openAt('/me', 'student', { mustChangePassword: true })

    expect(await screen.findByText(copy.forcedTitle)).toBeInTheDocument()
    expect(pathname).toBe('/settings/password')
    expect(screen.queryByRole('link', { name: enCommon.actions.back })).toBeNull()
  })

  it('releases the student once the change goes through', async () => {
    const user = userEvent.setup()
    backend()
    openAt('/settings/password', 'student', { mustChangePassword: true })

    await sendCode(user, 'Temp!Pass123')
    await user.type(await screen.findByLabelText(copy.codeLabel), '123456')
    await user.type(screen.getByLabelText(copy.newPasswordLabel), 'New!Pass123')
    await user.type(screen.getByLabelText(copy.confirmPasswordLabel), 'New!Pass123')
    await user.click(screen.getByRole('button', { name: copy.submit }))

    expect(await screen.findByText(copy.successBody)).toBeInTheDocument()
    await waitFor(() => expect(useAuthStore.getState().user?.mustChangePassword).toBe(false))
    // Clearing the flag does not bounce the page to /me mid-sentence: the
    // student reads that it worked, then carries on home.
    expect(pathname).toBe('/settings/password')
    await user.click(screen.getByRole('link', { name: enCommon.actions.continue }))
    await waitFor(() => expect(pathname).toBe('/'))
  })
})

const otherStudent = (id: string, mustChangePassword = false) =>
  ({ id, name: 'Noah Keller', email: 'noah@example.com', role: 'student', mustChangePassword }) as CurrentUser

async function completeChange(
  user: ReturnType<typeof userEvent.setup>,
  current = 'Temp!Pass123',
  { code = '123456', next = 'New!Pass123' }: { code?: string; next?: string } = {},
) {
  await sendCode(user, current)
  await user.type(await screen.findByLabelText(copy.codeLabel), code)
  await user.type(screen.getByLabelText(copy.newPasswordLabel), next)
  await user.type(screen.getByLabelText(copy.confirmPasswordLabel), next)
  await user.click(screen.getByRole('button', { name: copy.submit }))
  expect(await screen.findByText(copy.successBody)).toBeInTheDocument()
}

// What the page stays for after a forced change must not outlive that
// change, that page or that account (#68 audit).
describe('the page a forced change stays on', () => {
  it('lets a reset student go nowhere else before the change is done', async () => {
    backend()
    openAt('/settings/password', 'student', { mustChangePassword: true })
    expect(await screen.findByText(copy.forcedTitle)).toBeInTheDocument()

    for (const to of ['/', '/me', '/ask', '/assignments', '/settings/password?x=1']) {
      act(() => go(to))
      await waitFor(() => expect(pathname).toBe('/settings/password'))
    }
  })

  it('forwards to /me again once the student has left and comes back', async () => {
    const user = userEvent.setup()
    backend()
    openAt('/settings/password', 'student', { mustChangePassword: true })
    await completeChange(user)

    act(() => go('/'))
    await waitFor(() => expect(pathname).toBe('/'))
    // The lazy home page must commit before we come back: the location probe
    // can render '/' while Suspense still retains the password page.
    expect(await screen.findByRole('heading', { name: 'Mathematics' })).toBeInTheDocument()
    act(() => go('/settings/password'))
    await waitFor(() => expect(pathname).toBe('/me'))
  })

  it('is gone after signing out and another student signing in', async () => {
    const user = userEvent.setup()
    backend()
    openAt('/settings/password', 'student', { mustChangePassword: true })
    await completeChange(user)

    act(() => useAuthStore.getState().clearAuth())
    await waitFor(() => expect(pathname).toBe('/login'))
    act(() => useAuthStore.setState({ user: otherStudent('u-2'), accessToken: 't2', isAuthenticated: true }))
    act(() => go('/settings/password'))
    await waitFor(() => expect(pathname).toBe('/me'))
  })

  it('does not hold another account swapped into the store on the page', async () => {
    const user = userEvent.setup()
    backend()
    openAt('/settings/password', 'student', { mustChangePassword: true })
    await completeChange(user)
    expect(pathname).toBe('/settings/password')

    act(() => useAuthStore.setState({ user: otherStudent('u-3'), accessToken: 't3', isAuthenticated: true }))

    await waitFor(() => expect(pathname).toBe('/me'))
  })
})

const setUserFields = (patch: Record<string, unknown>) =>
  act(() => useAuthStore.setState({ user: { ...(useAuthStore.getState().user as CurrentUser), ...patch } as CurrentUser }))

describe('a forced change the account data moves under', () => {
  it('stays forced when a refetched account arrives without its id', async () => {
    backend()
    openAt('/settings/password', 'student', { mustChangePassword: true })
    expect(await screen.findByText(copy.forcedTitle)).toBeInTheDocument()

    setUserFields({ id: undefined })
    for (const to of ['/me', '/', '/ask']) {
      act(() => go(to))
      await waitFor(() => expect(pathname).toBe('/settings/password'))
    }
    expect(screen.getByText(copy.forcedTitle)).toBeInTheDocument()
  })

  it('is forced again when a late /auth/me raises the flag after the change', async () => {
    const user = userEvent.setup()
    backend()
    openAt('/settings/password', 'student', { mustChangePassword: true })
    await completeChange(user)

    setUserFields({ mustChangePassword: true })
    act(() => go('/'))
    await waitFor(() => expect(pathname).toBe('/settings/password'))
  })

  it('keeps another forced student swapped in on the page', async () => {
    const user = userEvent.setup()
    backend()
    openAt('/settings/password', 'student', { mustChangePassword: true })
    await completeChange(user)

    act(() => useAuthStore.setState({ user: otherStudent('u-9', true) }))
    act(() => go('/me'))
    await waitFor(() => expect(pathname).toBe('/settings/password'))
  })
})

describe('the password fields on /me', () => {
  it('ask the browser for the right kind of password, and carry no name to leak into a URL', async () => {
    const user = userEvent.setup()
    backend()
    openAt('/me')

    const current = await screen.findByLabelText(copy.currentPasswordLabel)
    expect(current).toHaveAttribute('type', 'password')
    expect(current).toHaveAttribute('autocomplete', 'current-password')
    expect(current).not.toHaveAttribute('name')
    // A password manager's paste reaches the field.
    await user.click(current)
    await user.paste('Pasted!Pass1')
    expect(current).toHaveValue('Pasted!Pass1')
    await user.click(screen.getByRole('button', { name: copy.sendCodeCta }))

    const fresh = await screen.findByLabelText(copy.newPasswordLabel)
    const confirm = screen.getByLabelText(copy.confirmPasswordLabel)
    const code = screen.getByLabelText(copy.codeLabel)
    expect(fresh).toHaveAttribute('autocomplete', 'new-password')
    expect(confirm).toHaveAttribute('autocomplete', 'new-password')
    expect(code).toHaveAttribute('autocomplete', 'one-time-code')
    for (const field of [fresh, confirm, code]) expect(field).not.toHaveAttribute('name')
    expect(pathname).toBe('/me')
    expect(window.location.href).not.toContain('Pasted')
  })

  it('go back to the first step on "request a new code" without submitting the second', async () => {
    const user = userEvent.setup()
    const seen = backend()
    openAt('/me')

    await sendCode(user)
    await screen.findByLabelText(copy.codeLabel)
    await user.click(screen.getByRole('button', { name: copy.requestNewCode }))

    expect(seen.confirm).toEqual([])
    expect(await screen.findByLabelText(copy.currentPasswordLabel)).toBeInTheDocument()
  })
})

describe('notification preferences on /me', () => {
  it('turns teacher replies off in the bell and live, and sends the whole matrix back', async () => {
    const user = userEvent.setup()
    const seen = backend()
    openAt('/me')

    const toggle = await screen.findByRole('switch', {
      name: enCommon.me.notifications.categories.teacher_responses.title,
    })
    await user.click(toggle)

    await waitFor(() => expect(seen.preferences).toHaveLength(1))
    // The backend rebuilds the matrix from its defaults and the body, so every
    // other category and channel must be sent as it was.
    expect(seen.preferences[0]).toEqual({
      preferences: {
        ...DEFAULT_MATRIX,
        teacher_responses: { in_app: false, realtime: false, email_digest: true, push: false },
      },
    })
    await waitFor(() => expect(toggle).not.toBeChecked())
  })

  it('applies the change to the matrix as the server has it now, not as the page loaded it', async () => {
    const user = userEvent.setup()
    const seen = backend()
    openAt('/me')
    const toggle = await screen.findByRole('switch', {
      name: enCommon.me.notifications.categories.teacher_responses.title,
    })

    // Meanwhile, on another device: weekly reports by e-mail.
    const elsewhere = {
      ...DEFAULT_MATRIX,
      weekly_reports: { in_app: true, realtime: true, email_digest: true, push: false },
    }
    mswServer.use(
      http.get('https://api.test/notifications/preferences', () =>
        HttpResponse.json({
          userId: 'u-1',
          preferences: elsewhere,
          supportedCategories: Object.keys(DEFAULT_MATRIX),
          supportedChannels: ['email_digest', 'in_app', 'push', 'realtime'],
        }),
      ),
    )
    await user.click(toggle)

    await waitFor(() => expect(seen.preferences).toHaveLength(1))
    expect(seen.preferences[0]).toEqual({
      preferences: {
        ...elsewhere,
        teacher_responses: { in_app: false, realtime: false, email_digest: true, push: false },
      },
    })
  })

  it('writes one toggle after another, each built from its own fresh read', async () => {
    const seen = backend()
    openAt('/me')
    const toggle = await screen.findByRole('switch', {
      name: enCommon.me.notifications.categories.teacher_responses.title,
    })
    seen.log.length = 0

    // Two toggles in the same tick, before the switch can disable itself.
    act(() => {
      toggle.click()
      toggle.click()
    })

    await waitFor(() => expect(seen.log).toHaveLength(6))
    expect(seen.log).toEqual(['read', 'write', 'written', 'read', 'write', 'written'])
  })

  it('writes nothing when the fresh read fails', async () => {
    const user = userEvent.setup()
    const seen = backend()
    openAt('/me')
    const toggle = await screen.findByRole('switch', {
      name: enCommon.me.notifications.categories.teacher_responses.title,
    })
    mswServer.use(http.get('https://api.test/notifications/preferences', () => new HttpResponse(null, { status: 500 })))

    await user.click(toggle)

    expect(await screen.findByRole('alert')).toHaveTextContent(enCommon.me.notifications.saveFailed)
    expect(seen.preferences).toEqual([])
  })

  it('says so when the change is refused', async () => {
    const user = userEvent.setup()
    backend()
    mswServer.use(http.patch('https://api.test/notifications/preferences', () => new HttpResponse(null, { status: 500 })))
    openAt('/me')

    await user.click(
      await screen.findByRole('switch', { name: enCommon.me.notifications.categories.teacher_responses.title }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(enCommon.me.notifications.saveFailed)
  })
})
