import { expect, test } from './support/fixtures'
import { ACCESS_TOKEN, STUDENT, StudentWorld } from './support/student'

/**
 * Controls: if one of these changes outcome, the suite has stopped testing
 * what it claims to (card 076: a suite that ran empty stayed "green" for
 * months). The first is a negative control and is expected to fail.
 */

test('control: the app really renders (fails while it does)', async ({ page, backend }) => {
  test.fail()
  new StudentWorld(backend).install()
  await page.goto('/login')
  // Give the app time to start, then claim the sign-in form is not there:
  // true only if the app never rendered (dist not served, startup refused).
  await page.waitForTimeout(5_000)
  expect(await page.locator('input[type=password]').count()).toBe(0)
})

test('control: a reply that breaks the backend contract is caught, for that reason', async ({ page, backend }) => {
  new StudentWorld(backend).install()
  // `access_token` is not what the backend's AuthResponse calls it.
  backend.on('POST', '/auth/login', () => ({
    status: 200,
    body: { access_token: ACCESS_TOKEN, user: { id: STUDENT.id, name: STUDENT.name, email: STUDENT.email, role: 'student', preferredLocale: 'en', effectiveLocale: 'en' } },
  }))
  await page.goto('/login')
  await page.getByLabel(/e-?mail/i).first().fill(STUDENT.email)
  await page.locator('input[type=password]').first().fill(STUDENT.password)
  await page.locator('button[type=submit]').first().click()
  await expect.poll(() => backend.callsTo('POST', '/auth/login').length).toBe(1)
  expect(backend.problems).toEqual([
    "POST /auth/login: reply 200 breaks the contract: data must have required property 'accessToken'; data must NOT have unevaluated properties",
  ])
  // Caught as it should be; cleared so the fixture's own check passes.
  backend.problems.length = 0
})
