/**
 * Frozen with the paid surface (card 007). The routes these walk — /billing,
 * /billing/checkout/*, /admin/subscriptions, /pricing — are no longer
 * registered, so every expectation here now describes a screen that cannot be
 * reached. They are skipped rather than deleted: when billing comes back, this
 * is the record of what it used to do, and a deleted file is a record nobody
 * finds.
 *
 * Unfreezing means turning `BILLING_AND_SUBSCRIPTION_ENABLED` back on in the
 * backend, restoring the route registrations in AppRouter, and then reading
 * each of these again — some described screens that were already broken before
 * the freeze (/pricing was never registered at all).
 */
import { expect, test, type Page } from '@playwright/test'
import { loginAs } from './helpers'

test.skip('pricing is public and billing redirects unauthenticated users', async ({ page }) => {
  await page.goto('/pricing')
  await expect(page.getByRole('heading', { name: /^pricing$/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /teacher-supported plan/i })).toBeVisible()

  await page.goto('/billing')
  await expect(page).toHaveURL(/\/login/)
})

test.skip('authenticated user can complete and cancel virtual checkout', async ({ page }) => {
  await routeParentSubscription(page)

  await loginAs(page, 'student')

  await page.goto('/billing?plan=family')
  await expect(page.locator('h1').filter({ hasText: /^Subscription$/ })).toBeVisible()
  await page.getByRole('button', { name: /start checkout/i }).click()
  await expect(page).toHaveURL(/\/billing\/checkout\/demo\?plan=family/)
  await expect(page.getByRole('heading', { name: /review your plan selection/i })).toBeVisible()

  await page.getByRole('button', { name: /complete plan review/i }).click()
  await expect(page).toHaveURL(/\/billing\/checkout\/success\?plan=family/)
  await expect(page.getByRole('heading', { name: /plan review complete/i })).toBeVisible()

  await page.goto('/billing/checkout/demo?plan=family')
  await page.getByRole('button', { name: /cancel checkout/i }).click()
  await expect(page).toHaveURL(/\/billing\/checkout\/cancel\?plan=family/)
  await expect(page.getByRole('heading', { name: /plan selection canceled/i })).toBeVisible()
})

test.skip('billing page surfaces parent subscription API failures without demo fallback', async ({ page }) => {
  await page.route('**/parents/me/subscription', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      json: { detail: 'billing unavailable' },
    })
  })

  await loginAs(page, 'student')
  await page.goto('/billing?plan=family')

  await expect(page.getByText(/billing details are not available yet/i)).toBeVisible()
})

async function routeParentSubscription(page: Page) {
  await page.route('**/parents/me/subscription', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: {
        parentId: 'parent-1',
        currentTier: 'standard',
        plans: {},
        pendingRequest: null,
        billing: {
          parentId: 'parent-1',
          provider: 'stripe',
          mode: 'test',
          status: 'active',
          subscriptionTier: 'standard',
          cancelAtPeriodEnd: false,
          currentPeriodEnd: '2026-08-01T00:00:00Z',
        },
        effectiveEntitlements: [{ studentId: 'student-1', effectivePlan: 'standard', source: 'provider_billing', limits: { dailyAiQuestionLimit: 30 } }],
      },
    })
  })
}
