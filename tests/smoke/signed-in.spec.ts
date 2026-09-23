import { expect, test } from '@playwright/test'
import { smokeAccounts, type SmokeRole } from './accounts'
import { signIn, watchApiFailures, watchPageErrors } from './helpers'

// These run against a real deployment with real accounts, because that is where
// every defect found on 2026-09-23 actually lived. Each one had a green unit
// suite behind it:
//
//   * a student an administrator opened could not sign in at all
//   * their own profile answered 503 because nobody had set a year group
//   * asking a question got no answer, and the failure said "uploads"
//   * the account console listed nothing, on a table of thousands of rows
//
// None of that is reachable from a suite that talks to fixtures. These are few
// on purpose: one signed-in pass per role, and the two flows the product is for.

const ROLES = Object.keys(smokeAccounts) as SmokeRole[]

test.describe('every role can sign in and land on its own screen', () => {
  for (const role of ROLES) {
    test(`${role} signs in and the screen comes up clean`, async ({ page }) => {
      const failures = watchApiFailures(page)
      const errors = watchPageErrors(page)

      await signIn(page, role)
      await page.waitForTimeout(4000)

      expect(errors, 'uncaught page errors').toEqual([])
      expect(failures, 'API responses the page could not use').toEqual([])
      // A page that rendered nothing also has no failures.
      expect((await page.locator('body').innerText()).length).toBeGreaterThan(200)
    })
  }
})

test('a student asks a question and the assistant answers', async ({ page }) => {
  test.slow()
  const failures = watchApiFailures(page)
  await signIn(page, 'student')

  await page.goto('/chat')
  const composer = page.locator('textarea').first()
  await expect(composer).toBeVisible({ timeout: 20_000 })
  await composer.fill('Wie loese ich 3x + 5 = 20?')
  await page.locator('form button, button[type=submit]').last().click()

  // The reply streams, so this waits for text rather than a request.
  await expect
    .poll(async () => (await page.locator('body').innerText()).includes('15'), {
      timeout: 60_000,
      message: 'the assistant never worked the question through',
    })
    .toBe(true)

  expect(failures, 'API responses the page could not use').toEqual([])
})

test('an administrator sees the accounts that exist', async ({ page }) => {
  const failures = watchApiFailures(page)
  await signIn(page, 'admin')

  await page.goto('/admin/users')
  await page.waitForTimeout(6000)
  const body = await page.locator('body').innerText()

  // The console reads every page of a filtered scan, so the accounts behind the
  // first one have to be here too - the administrator's own was on page two.
  for (const account of Object.values(smokeAccounts)) {
    expect(body, `${account.email} is missing from the console`).toContain(account.email)
  }
  expect(failures, 'API responses the page could not use').toEqual([])
})
