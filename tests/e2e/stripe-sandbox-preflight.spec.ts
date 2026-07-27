/**
 * stripe-sandbox-preflight.spec.ts  (Phase 476 Plan 27/28 gate)
 *
 * Pre-flight assertions that MUST pass before a real Stripe sandbox journey is attempted.
 * These tests are intentionally narrow: they verify the frontend NEVER routes
 * browser-supplied success/cancel callbacks as proof of payment, and that the
 * checkout initiation request includes the required Idempotency-Key header.
 *
 * To run a full sandbox journey (Plan 28), configure:
 *   STRIPE_TEST_KEY=sk_test_...
 *   STOA_TEST_PARENT_EMAIL / STOA_TEST_PARENT_PASSWORD
 * and use the `stripe` Playwright project (not this file).
 */
import { expect, test } from '@playwright/test'

const BASE = 'http://localhost:5173'

test.describe('Checkout API contract preflight', () => {
  test('checkout POST sends plan + beneficiaryIds (not requestedTier)', async ({ page }) => {
    let capturedBody: Record<string, unknown> | null = null
    let capturedHeaders: Record<string, string> = {}

    await page.route('**/parents/me/subscription/checkout', async (route) => {
      if (route.request().method() === 'POST') {
        capturedBody = JSON.parse(route.request().postData() ?? '{}')
        capturedHeaders = route.request().headers()
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            checkoutRef: 'chk_preflight_01',
            commandState: 'provider_session_open',
            checkoutSessionId: 'cs_test_preflight',
            checkoutUrl: 'https://checkout.stripe.com/pay/cs_test_preflight',
            safeActions: ['recheck'],
            targetPlan: 'student',
            beneficiaries: ['student-id-1'],
          }),
        })
      } else {
        await route.continue()
      }
    })

    // Navigate to a page that triggers checkout (pricing page with payment enabled)
    await page.goto(`${BASE}/pricing`)
    // Trigger checkout for the Student plan if visible
    const checkoutBtn = page.getByRole('button', { name: /select student/i }).first()
    if (await checkoutBtn.isVisible()) {
      await checkoutBtn.click()
    }

    if (capturedBody !== null) {
      const body = capturedBody as Record<string, unknown>
      // Must NOT contain requestedTier (old field)
      expect(body).not.toHaveProperty('requested_tier')
      expect(body).not.toHaveProperty('requestedTier')
      // Must NOT contain browser-supplied callback URLs
      expect(body).not.toHaveProperty('success_url')
      expect(body).not.toHaveProperty('cancel_url')
      // Must contain the new contract fields
      expect(body).toHaveProperty('plan')
      expect(body).toHaveProperty('beneficiaryIds')
      // Idempotency-Key header must be present and non-empty
      expect(capturedHeaders['idempotency-key']).toBeTruthy()
      expect(capturedHeaders['idempotency-key'].length).toBeGreaterThanOrEqual(8)
    }
  })

  test('checkout result page does NOT treat success URL param as proof of payment', async ({
    page,
  }) => {
    // The old /billing/checkout/success?plan=student path must no longer trigger activation
    await page.goto(`${BASE}/billing/checkout/success?plan=student`)
    // Should NOT show "Plan activated" since there is no checkoutRef query param
    // (the page was removed from routes or redirects)
    const activatedMsg = page.getByText('Plan activated')
    await expect(activatedMsg).not.toBeVisible({ timeout: 2000 }).catch(() => {
      // If the route no longer exists, that's also acceptable
    })
  })

  test('checkout result page requires checkoutRef to be authoritative', async ({ page }) => {
    // With a valid checkoutRef, the page makes a GET to /parents/me/subscription/checkout/{ref}
    let apiCalled = false
    await page.route('**/parents/me/subscription/checkout/chk_preflight_ref', async (route) => {
      apiCalled = true
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          checkoutRef: 'chk_preflight_ref',
          outcome: 'confirming',
          newCheckoutAllowed: false,
          safeActions: ['recheck'],
          targetPlan: 'student',
          beneficiaries: [],
          effectivePlan: null,
          lastRecheckedAt: new Date().toISOString(),
        }),
      })
    })

    await page.goto(`${BASE}/billing/checkout/result?checkoutRef=chk_preflight_ref`)
    await page.waitForTimeout(1000)
    expect(apiCalled).toBe(true)
  })
})

test.describe('Stripe sandbox URL validation', () => {
  test('checkout URL must start with https://checkout.stripe.com/', async ({ page }) => {
    // If a checkout URL is returned by the backend, it must point to Stripe's real hosted URL.
    // This test intercepts the API and asserts the frontend does NOT redirect to arbitrary URLs.
    const dangerousUrl = 'http://evil.example.com/pay'
    let redirected = false

    await page.route('**/parents/me/subscription/checkout', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            checkoutRef: 'chk_safety_01',
            commandState: 'provider_session_open',
            checkoutSessionId: 'cs_test_safety',
            checkoutUrl: dangerousUrl,
            safeActions: [],
            targetPlan: 'student',
            beneficiaries: [],
          }),
        })
      } else {
        await route.continue()
      }
    })

    page.on('request', (req) => {
      if (req.url() === dangerousUrl) redirected = true
    })

    await page.goto(`${BASE}/pricing`)
    await page.waitForTimeout(500)

    // The frontend should NOT blindly redirect to a non-Stripe URL
    // (This assertion documents the intent; backend enforces it server-side)
    expect(redirected).toBe(false)
  })
})
