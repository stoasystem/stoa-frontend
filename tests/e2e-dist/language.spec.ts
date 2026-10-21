import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { Page } from '@playwright/test'
import { expect, test } from './support/fixtures'

/*
 * The build ships English and fetches every other language when a tab is read
 * in it (#414). The component tests stand in for the chunks; these fetch the
 * ones the build made, through Vite's own loader.
 */

/** The sign-in page's line under the logo, in `language`. */
function audience(language: 'de' | 'en' | 'fr'): string {
  const file = path.resolve(import.meta.dirname, `../../src/i18n/locales/${language}/auth.json`)
  return (JSON.parse(readFileSync(file, 'utf8')) as { login: { audience: string } }).login.audience
}

/** The copy chunks the page fetched, by name: `de`, `fr`, `it`, `admin`. */
function copyFetched(page: Page) {
  const fetched: string[] = []
  page.on('request', (request) => {
    const match = /^\/assets\/(de|fr|it|admin)-[\w-]+\.js$/.exec(new URL(request.url()).pathname)
    if (match) fetched.push(match[1])
  })
  return fetched
}

/** Counts the documents the tab loads: a reload is one more. */
function documentLoads(page: Page) {
  let loads = 0
  page.on('request', (request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) loads += 1
  })
  return () => loads
}

test.describe('a browser set to German', () => {
  test.use({ locale: 'de-CH' })

  test('shows the first screen in German, and fetches German alone for it', async ({ page, backend }) => {
    void backend
    const fetched = copyFetched(page)

    await page.goto('/login')

    await expect(page.getByText(audience('de'))).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'de')
    expect(fetched).toEqual(['de'])
  })

  test('switches to French once French is in', async ({ page, backend }) => {
    void backend
    let release = () => {}
    const held = new Promise<void>((resolve) => {
      release = resolve
    })
    let asked = false
    await page.route('**/assets/fr-*.js', async (route) => {
      asked = true
      await held
      await route.fallback()
    })
    await page.goto('/login')
    await expect(page.getByText(audience('de'))).toBeVisible()

    await page.getByRole('button', { name: /^Sprache:/ }).click()
    await page.getByRole('menuitemradio', { name: 'Français' }).click()
    await expect.poll(() => asked, { message: 'French was asked for' }).toBe(true)

    // Still on its way: the page stays German, no raw key in between.
    await expect(page.getByText(audience('de'))).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'de')

    release()

    await expect(page.getByText(audience('fr'))).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
  })

  test('reads in English when German cannot be fetched, and the tab is not reloaded for it', async ({
    page,
    backend,
  }) => {
    void backend
    await page.route('**/assets/de-*.js', (route) => route.abort('internetdisconnected'))
    const documents = documentLoads(page)

    await page.goto('/login')

    await expect(page.getByText(audience('en'))).toBeVisible()
    // A reload would follow the failure at once; give it the time to.
    await page.waitForTimeout(1_000)
    expect(documents(), 'documents loaded').toBe(1)
    await expect(page.getByText(audience('en'))).toBeVisible()
  })
})
