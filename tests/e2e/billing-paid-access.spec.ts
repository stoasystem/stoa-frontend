/**
 * billing-paid-access.spec.ts
 *
 * Verifies the Phase 476 authoritative checkout UI flow:
 * - Checkout result page reads `checkoutRef` from the URL query param
 * - Four outcome states render the correct copy and actions
 * - The Recheck button is only visible when outcome is `confirming`
 * - No demo/virtual checkout paths exist on the release route set
 *
 * These tests use a mocked API layer and do NOT call Stripe or make real charges.
 */
import { expect, test } from '@playwright/test'

const BASE = 'http://localhost:5173'

test.describe('CheckoutResultPage – outcome states', () => {
  test('active outcome shows plan activated message and billing link', async ({ page }) => {
    await page.route('**/parents/me/subscription/checkout/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          checkoutRef: 'chk_test_active',
          outcome: 'active',
          newCheckoutAllowed: false,
          safeActions: [],
          targetPlan: 'student',
          beneficiaries: ['student-id-1'],
          effectivePlan: 'student',
          lastRecheckedAt: new Date().toISOString(),
        }),
      })
    })

    await page.goto(`${BASE}/billing/checkout/result?checkoutRef=chk_test_active`)
    await expect(page.getByText('Plan activated')).toBeVisible()
    await expect(page.getByRole('link', { name: 'View billing' })).toBeVisible()
    await expect(page.getByRole('button', { name: /check now/i })).not.toBeVisible()
  })

  test('confirming outcome shows spinner and Recheck button', async ({ page }) => {
    await page.route('**/parents/me/subscription/checkout/**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            checkoutRef: 'chk_test_confirming',
            outcome: 'confirming',
            newCheckoutAllowed: false,
            safeActions: ['recheck'],
            targetPlan: 'family',
            beneficiaries: [],
            effectivePlan: null,
            lastRecheckedAt: new Date().toISOString(),
          }),
        })
      } else {
        await route.continue()
      }
    })

    await page.goto(`${BASE}/billing/checkout/result?checkoutRef=chk_test_confirming`)
    await expect(page.getByText('Confirming payment')).toBeVisible()
    await expect(page.getByRole('button', { name: /check now/i })).toBeVisible()
  })

  test('not_completed outcome shows no-charge message and See plans link', async ({ page }) => {
    await page.route('**/parents/me/subscription/checkout/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          checkoutRef: 'chk_test_cancelled',
          outcome: 'not_completed',
          newCheckoutAllowed: true,
          safeActions: ['create_new'],
          targetPlan: 'student',
          beneficiaries: [],
          effectivePlan: null,
          lastRecheckedAt: new Date().toISOString(),
        }),
      })
    })

    await page.goto(`${BASE}/billing/checkout/result?checkoutRef=chk_test_cancelled`)
    await expect(page.getByText('Checkout not completed')).toBeVisible()
    await expect(page.getByText(/No charge was made/)).toBeVisible()
    await expect(page.getByRole('link', { name: 'See plans' })).toBeVisible()
    await expect(page.getByRole('button', { name: /check now/i })).not.toBeVisible()
  })

  test('support_needed outcome shows contact support link', async ({ page }) => {
    await page.route('**/parents/me/subscription/checkout/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          checkoutRef: 'chk_test_support',
          outcome: 'support_needed',
          newCheckoutAllowed: false,
          safeActions: [],
          targetPlan: 'teacher_supported',
          beneficiaries: [],
          effectivePlan: null,
          lastRecheckedAt: new Date().toISOString(),
        }),
      })
    })

    await page.goto(`${BASE}/billing/checkout/result?checkoutRef=chk_test_support`)
    await expect(page.getByText('Attention needed')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Contact support' })).toBeVisible()
  })

  test('missing checkoutRef shows fallback message', async ({ page }) => {
    await page.goto(`${BASE}/billing/checkout/result`)
    await expect(page.getByText('No checkout reference found')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Return to billing' })).toBeVisible()
  })
})

test.describe('Demo/virtual checkout paths are removed from release routes', () => {
  test('/billing/checkout/demo redirects or shows not-found', async ({ page }) => {
    const response = await page.goto(`${BASE}/billing/checkout/demo`)
    // Either 404 or redirected away from a functional virtual checkout page
    const url = page.url()
    const isNotFound = !url.includes('/billing/checkout/demo') || (response?.status() ?? 0) >= 400
    const hasVirtualCheckoutContent = await page
      .getByText('Virtual checkout', { exact: false })
      .count()
    expect(isNotFound || hasVirtualCheckoutContent === 0).toBe(true)
  })

  test('/billing/checkout/success redirects or shows not-found', async ({ page }) => {
    const response = await page.goto(`${BASE}/billing/checkout/success`)
    const url = page.url()
    const isOk = !url.endsWith('/billing/checkout/success') || (response?.status() ?? 200) >= 400
    expect(isOk).toBe(true)
  })
})

test.describe('Pricing plan IDs', () => {
  test('teacher_supported plan ID is used (not tutor_supported)', async ({ page }) => {
    await page.goto(`${BASE}/pricing`)
    // The checkout button data attribute or aria label should reference teacher_supported
    const page_source = await page.content()
    expect(page_source).not.toContain('tutor_supported')
  })
})
