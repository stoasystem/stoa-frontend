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
        supportedLocales: ['en', 'de', 'fr', 'it'],
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

test('public language switcher supports all launch languages at runtime', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: /language/i }).click()
  await expect(page.getByRole('menuitem', { name: 'EN' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'DE' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'FR' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'IT' })).toBeVisible()

  await page.getByRole('menuitem', { name: 'FR' }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr')

  await page.getByRole('button', { name: /langue|language/i }).click()
  await page.getByRole('menuitem', { name: 'IT' }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'it')
})
