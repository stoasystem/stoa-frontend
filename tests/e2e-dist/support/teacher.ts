import { expect, type Page } from '@playwright/test'
import type { MockBackend } from './backend'

export const TEACHER = {
  id: 'e2e-teacher-1',
  name: 'Tom Brunner',
  email: 'tom.brunner@example.test',
  password: 'e2e-password-2',
}
const ACCESS_TOKEN = 'e2e-teacher-access-token'

/**
 * One teacher and the parts of the backend their home touches: sign-in, the
 * account, the bell, and an empty request queue with its counts.
 */
export class TeacherWorld {
  constructor(private readonly backend: MockBackend) {}

  install() {
    const b = this.backend
    const signedIn = (headers: Record<string, string>) => headers.authorization === `Bearer ${ACCESS_TOKEN}`
    const denied = { status: 401, body: { detail: 'Not authenticated' } }
    const answer = (body: unknown) => ({ headers }: { headers: Record<string, string> }) =>
      signedIn(headers) ? { status: 200, body } : denied

    b.on('POST', '/auth/login', ({ body }) => {
      const { email, password } = body as { email: string; password: string }
      if (email !== TEACHER.email || password !== TEACHER.password) {
        return { status: 401, body: { code: 'invalid_credentials', message: 'Check your email and password.', correlationId: 'e2e' } }
      }
      return { status: 200, body: { accessToken: ACCESS_TOKEN, user: user() } }
    })
    b.on('GET', '/auth/me', answer(user()))
    b.on('POST', '/auth/logout', () => ({ status: 204 }))
    b.on('GET', '/notifications', answer({ items: [], count: 0 }))
    b.on('GET', '/teachers/me/help-requests', answer({ items: [] }))
    b.on('GET', '/teachers/me/stats', answer({ pendingRequests: 0, resolvedToday: 0, averageResponseTimeMinutes: 0 }))
  }
}

export async function signInAsTeacher(page: Page) {
  await page.goto('/login')
  await page.getByLabel(/e-?mail/i).first().fill(TEACHER.email)
  await page.locator('input[type=password]').first().fill(TEACHER.password)
  await page.locator('button[type=submit]').first().click()
  await expect(page).toHaveURL('/teacher')
}

function user() {
  return {
    id: TEACHER.id,
    name: TEACHER.name,
    email: TEACHER.email,
    role: 'teacher',
    preferredLocale: 'en',
    effectiveLocale: 'en',
    mustChangePassword: false,
  }
}
