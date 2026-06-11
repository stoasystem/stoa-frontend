import { expect, test } from '@playwright/test'
import { loginAs } from './helpers'

test('authenticated language switch persists through the locale preference API', async ({ page }) => {
  let requestedLocale: string | undefined

  await page.route('**/auth/me/preferences/locale', async (route) => {
    const body = route.request().postDataJSON() as { preferredLocale?: string }
    requestedLocale = body.preferredLocale

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        preferredLocale: body.preferredLocale,
        effectiveLocale: body.preferredLocale,
        supportedLocales: ['en', 'de'],
        updatedAt: '2026-06-11T12:00:00Z',
      }),
    })
  })

  await loginAs(page, 'student')
  await page.getByRole('button', { name: /language/i }).click()
  await page.getByRole('menuitem', { name: 'DE' }).click()

  await expect.poll(() => requestedLocale).toBe('de')
  await expect(page.locator('html')).toHaveAttribute('lang', 'de')
  await expect(page.getByRole('link', { name: /frage stellen/i }).first()).toBeVisible()

  await page.reload()

  await expect(page.locator('html')).toHaveAttribute('lang', 'de')
  await expect(page.getByRole('link', { name: /frage stellen/i }).first()).toBeVisible()
})
