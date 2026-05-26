import { expect, test } from '@playwright/test'
import { loginAs } from './helpers'

test('pricing is public and billing redirects unauthenticated users', async ({ page }) => {
  await page.goto('/pricing')
  await expect(page.getByRole('heading', { name: /^pricing$/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /teacher-supported plan/i })).toBeVisible()

  await page.goto('/billing')
  await expect(page).toHaveURL(/\/login/)
})

test('authenticated user can complete and cancel virtual checkout', async ({ page }) => {
  await loginAs(page, 'student')

  await page.goto('/billing?plan=family')
  await expect(page.getByRole('heading', { name: 'Subscription', exact: true })).toBeVisible()
  await page.getByRole('button', { name: /start checkout/i }).click()
  await expect(page).toHaveURL(/\/billing\/checkout\/demo\?plan=family/)
  await expect(page.getByRole('heading', { name: /plan selection preview/i })).toBeVisible()

  await page.getByRole('button', { name: /complete plan preview/i }).click()
  await expect(page).toHaveURL(/\/billing\/checkout\/success\?plan=family/)
  await expect(page.getByRole('heading', { name: /plan preview complete/i })).toBeVisible()

  await page.goto('/billing/checkout/demo?plan=family')
  await page.getByRole('button', { name: /cancel checkout/i }).click()
  await expect(page).toHaveURL(/\/billing\/checkout\/cancel\?plan=family/)
  await expect(page.getByRole('heading', { name: /plan selection canceled/i })).toBeVisible()
})
