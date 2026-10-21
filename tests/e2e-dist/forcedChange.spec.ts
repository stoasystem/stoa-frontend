import type { MockBackend } from './support/backend'
import { expect, test } from './support/fixtures'
import { ACCESS_TOKEN, STUDENT, StudentWorld } from './support/student'

// #412: an account an administrator has reset goes to the password change
// first, and the change then leads on to the page it asked for. The page
// travels in the history entry's state, which only a real browser keeps
// across a reload. While the reset stands the app asks for nothing the backend
// refuses (it answers 403 to everything but GET /auth/me and the change
// itself), and the shell offers no page that would only bounce back.

const ANSWERED_WHILE_RESET = new Set([
  'post /auth/login',
  'get /auth/me',
  'post /auth/password-change/request',
  'post /auth/password-change/confirm',
])

/** The student world, with the student's password reset until the change is confirmed. */
function resetStudent(backend: MockBackend) {
  new StudentWorld(backend).install()
  let reset = true
  const user = () => ({
    id: STUDENT.id,
    name: STUDENT.name,
    email: STUDENT.email,
    role: 'student',
    preferredLocale: 'en',
    effectiveLocale: 'en',
    mustChangePassword: reset,
  })
  const signedIn = (headers: Record<string, string>) => headers.authorization === `Bearer ${ACCESS_TOKEN}`
  const denied = { status: 401, body: { detail: 'Not authenticated' } }
  backend.on('POST', '/auth/login', ({ body }) => {
    const { email, password } = body as { email: string; password: string }
    if (email !== STUDENT.email || password !== STUDENT.password) return denied
    return { status: 200, body: { accessToken: ACCESS_TOKEN, user: user() } }
  })
  backend.on('GET', '/auth/me', ({ headers }) => (signedIn(headers) ? { status: 200, body: user() } : denied))
  backend.on('POST', '/auth/password-change/request', ({ headers }) =>
    signedIn(headers)
      ? { status: 200, body: { status: 'sent', maskedRecipient: 'm***@example.test', expiresAt: 1_790_000_000 } }
      : denied,
  )
  backend.on('POST', '/auth/password-change/confirm', ({ headers }) => {
    if (!signedIn(headers)) return denied
    reset = false
    return { status: 200, body: { status: 'changed' } }
  })
  // As the backend does (deps.py): while the reset stands, every other route
  // that takes the account is refused. Sign-in and sign-out do not take it.
  backend.refuse((method, template) =>
    reset && !ANSWERED_WHILE_RESET.has(`${method} ${template}`) && template !== '/auth/logout'
      ? { status: 403, body: { detail: { code: 'action_not_allowed', message: 'This action is not allowed.', correlationId: 'e2e-correlation' } } }
      : null,
  )
}

test('a reset student who opened /ask: the change first, kept across a reload, then Continue opens /ask', async ({ page, backend }) => {
  resetStudent(backend)
  await page.goto('/ask')
  await expect(page).toHaveURL('/login')

  await page.getByLabel(/e-?mail/i).first().fill(STUDENT.email)
  await page.locator('input[type=password]').first().fill(STUDENT.password)
  await page.locator('button[type=submit]').first().click()
  await expect(page).toHaveURL('/settings/password')
  await expect(page.getByRole('heading', { name: 'Change your password' })).toBeVisible()

  // The shell: the avatar menu holds Language, Help and Log out, there is no
  // bell, and the logo leads to the change.
  await page.getByRole('button', { name: 'Account' }).first().click()
  await expect(page.getByRole('menuitem')).toHaveText([/^Language/, 'Help and support', 'Log out'])
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Notifications' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'STOA home' })).toHaveAttribute('href', '/settings/password')

  // A reload keeps the page the change was asked from.
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Change your password' })).toBeVisible()

  await page.getByLabel('Current password').fill(STUDENT.password)
  await page.getByRole('button', { name: 'Send code' }).click()
  await page.getByLabel('Email code').fill('123456')
  await page.getByLabel('New password', { exact: true }).fill('New!Pass1234')
  await page.getByLabel('Confirm new password').fill('New!Pass1234')
  await page.getByRole('button', { name: 'Set new password' }).click()
  const next = page.getByRole('link', { name: 'Continue' })
  await expect(next).toBeVisible()

  const asked = backend.calls.map((call) => `${call.method} ${call.template}`)
  const through = asked.indexOf('post /auth/password-change/confirm')
  expect(through, 'the change went through').toBeGreaterThan(-1)
  expect(asked.slice(0, through).filter((call) => !ANSWERED_WHILE_RESET.has(call)), 'asked while the reset stood').toEqual([])

  await next.click()
  await expect(page).toHaveURL('/ask')
  await expect(page.getByRole('textbox', { name: 'Your question' }).first()).toBeVisible()
  // The sky is read once the change is through, and the map beside Ask shows it.
  await expect(page.getByRole('heading', { name: 'Mathematics' })).toBeVisible()
  await expect(page.getByText(/star map didn.t load/)).toHaveCount(0)
})
