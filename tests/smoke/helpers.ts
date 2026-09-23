import { expect, type Page, type Request, type Response } from '@playwright/test'
import { smokeAccounts, smokePassword, type SmokeRole } from './accounts'

/** Everything the page asked the API for that came back a failure. */
export function watchApiFailures(page: Page): string[] {
  const failures: string[] = []
  page.on('response', (response: Response) => {
    const url = response.url()
    if (!url.includes('/api') && !url.includes('api.stoaedu.ch')) return
    if (response.status() < 400) return
    failures.push(`${response.status()} ${response.request().method()} ${path(url)}`)
  })
  page.on('requestfailed', (request: Request) => {
    const url = request.url()
    if (!url.includes('api.stoaedu.ch')) return
    // A cancelled request is the browser tidying up, not the server refusing.
    if (request.failure()?.errorText === 'net::ERR_ABORTED') return
    failures.push(`failed ${request.method()} ${path(url)}`)
  })
  return failures
}

/** Uncaught errors, which a page that looks fine can still be full of. */
export function watchPageErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message.slice(0, 200)))
  return errors
}

function path(url: string): string {
  try {
    return new URL(url).pathname
  } catch {
    return url
  }
}

export async function signIn(page: Page, role: SmokeRole): Promise<void> {
  const account = smokeAccounts[role]
  await page.goto('/login')
  await page.getByLabel(/e-?mail/i).first().fill(account.email)
  await page.locator('input[type=password]').first().fill(smokePassword())
  await page.locator('button[type=submit]').first().click()
  await expect(page).toHaveURL(account.landing, { timeout: 30_000 })
}
