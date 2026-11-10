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

export const PARENT: StaffAccount = {
  id: 'e2e-parent-1',
  name: 'Paula Meier',
  email: 'paula.meier@example.test',
  password: 'e2e-password-4',
  role: 'parent',
}

/** `GET /parents/me/usage-period` (stoa-backend#343): `endsAt` a Zurich day; children carry no `daysLeft`. */
export type ParentUsagePeriods = {
  own: { endsAt: string | null; state: 'active' | 'expired' | 'none'; daysLeft: number | null }
  children: {
    studentId: string
    name: string
    endsAt: string | null
    state: 'active' | 'expired' | 'none'
    paidBy: 'you' | 'self' | 'other_parent' | null
  }[]
  renewalContactEmail: string
}

/**
 * One member of staff and the parts of the backend their pages touch here:
 * sign-in, the account and the bell; for a teacher, an empty request queue
 * with its counts. An administrator's home asks for more, so a test signs
 * them in at a page that asks for nothing (`/admin/system`). A parent gets the
 * Overview's reads: the children, the account and the usage periods (#616).
 */
export class StaffWorld {
  private readonly accessToken: string
  /** A parent's children, as `GET /parents/me/children` lists them. */
  children: { id: string; userId: string; name: string; email: string; grade: string | null; subjects: string[] }[] = []
  /** A parent's usage periods; by default their own months away and no children. */
  usagePeriods: ParentUsagePeriods = {
    own: { endsAt: '2027-06-30', state: 'active', daysLeft: 200 },
    children: [],
    renewalContactEmail: 'info@stoaedu.ch',
  }

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
    if (account.role === 'parent') {
      b.on('GET', '/parents/me/children', ({ headers }) => answer({ items: this.children })({ headers }))
      b.on('GET', '/parents/me/account-operations', answer({
        parentId: account.id,
        supportState: { state: 'ready', blockers: [], warnings: [] },
        children: [],
      }))
      b.on('GET', '/parents/me/usage-period', ({ headers }) => answer(this.usagePeriods)({ headers }))
      // The weekly report email switch on the account page (#621).
      b.on('GET', '/notifications/preferences', answer({
        userId: account.id,
        preferences: {},
        dispatchEmail: true,
        weeklyReportEmail: true,
        supportedCategories: [],
        supportedChannels: [],
        updatedAt: null,
      }))
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
