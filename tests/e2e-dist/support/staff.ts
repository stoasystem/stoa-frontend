import { expect, type Page } from '@playwright/test'
import type { MockBackend } from './backend'

type StaffAccount = { id: string; name: string; email: string; password: string; role: string }

export const TEACHER: StaffAccount = {
  id: 'e2e-teacher-1',
  name: 'Tom Brunner',
  email: 'tom.brunner@example.test',
  password: 'e2e-password-2',
  role: 'teacher',
}

export const ADMIN: StaffAccount = {
  id: 'e2e-admin-1',
  name: 'Ada Rossi',
  email: 'ada.rossi@example.test',
  password: 'e2e-password-3',
  role: 'admin',
}

/**
 * One member of staff and the parts of the backend their pages touch here:
 * sign-in, the account and the bell; for a teacher, an empty request queue
 * with its counts. An administrator's home asks for more, so a test signs
 * them in at a page that asks for nothing (`/admin/system`).
 */
export class StaffWorld {
  private readonly accessToken: string

  constructor(
    private readonly backend: MockBackend,
    private readonly account: StaffAccount,
  ) {
    this.accessToken = `e2e-${account.role}-access-token`
  }

  install() {
    const b = this.backend
    const account = this.account
    const signedIn = (headers: Record<string, string>) => headers.authorization === `Bearer ${this.accessToken}`
    const denied = { status: 401, body: { detail: 'Not authenticated' } }
    const answer = (body: unknown) => ({ headers }: { headers: Record<string, string> }) =>
      signedIn(headers) ? { status: 200, body } : denied
    const user = {
      id: account.id,
      name: account.name,
      email: account.email,
      role: account.role,
      preferredLocale: 'en',
      effectiveLocale: 'en',
      mustChangePassword: false,
    }

    b.on('POST', '/auth/login', ({ body }) => {
      const { email, password } = body as { email: string; password: string }
      if (email !== account.email || password !== account.password) {
        return { status: 401, body: { code: 'invalid_credentials', message: 'Check your email and password.', correlationId: 'e2e' } }
      }
      return { status: 200, body: { accessToken: this.accessToken, user } }
    })
    b.on('GET', '/auth/me', answer(user))
    b.on('POST', '/auth/logout', () => ({ status: 204 }))
    b.on('GET', '/notifications', answer({ items: [], count: 0 }))
    if (account.role === 'teacher') {
      b.on('GET', '/teachers/me/help-requests', answer({ items: [] }))
      b.on('GET', '/teachers/me/stats', answer({ pendingRequests: 0, resolvedToday: 0, averageResponseTimeMinutes: 0 }))
    }
  }
}

/** Opens `path`, signs in on the sign-in page it leads to, and waits to be back at `path`. */
export async function signInAt(page: Page, account: StaffAccount, path: string) {
  await page.goto(path)
  await page.getByLabel(/e-?mail/i).first().fill(account.email)
  await page.locator('input[type=password]').first().fill(account.password)
  await page.locator('button[type=submit]').first().click()
  await expect(page).toHaveURL(path)
}
