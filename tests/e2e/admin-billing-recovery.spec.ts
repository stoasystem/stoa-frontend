import { readFileSync } from 'node:fs'
import { expect, test, type Page, type Request } from '@playwright/test'
import { loginAs } from './helpers'

const CHECKOUT_REF = 'chk_public_01J2Y8Q1H9R4A7B6C5D3E2F1G0'
const PARENT_ID = 'parent-billing-1'
const DIGEST_A = 'a'.repeat(64)
const DIGEST_B = 'b'.repeat(64)
const FORBIDDEN_CANARIES = [
  'sk_test_private_canary',
  '4242424242424242',
  'cus_full_private_identifier',
  'https://checkout.stripe.com/private-session',
]

test('authorized admin sees exact redacted billing recovery evidence', async ({ page }) => {
  const browserLogs: string[] = []
  page.on('console', (message) => browserLogs.push(message.text()))
  await routeBillingDetail(page, billingDetail())

  await loginAs(page, 'admin')
  await page.goto(
    `/admin/account-operations?parentId=${PARENT_ID}&checkoutRef=${CHECKOUT_REF}`,
  )

  await expect(page.getByRole('heading', { name: /billing recovery evidence/i })).toBeVisible()
  await expect(page.getByText(PARENT_ID, { exact: true }).first()).toBeVisible()
  await expect(page.getByText('Family', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('Active', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('…safe42', { exact: true })).toBeVisible()
  await expect(page.getByText('150,000 input / 25,000 output')).toBeVisible()
  await expect(page.getByText(DIGEST_B, { exact: true })).toBeVisible()
  await expect(page.getByText(/visa ending in 4242/i)).toBeVisible()

  const renderedAndStored = await page.evaluate(() => [
    document.body.innerText,
    JSON.stringify(localStorage),
    JSON.stringify(sessionStorage),
  ].join('\n'))
  for (const canary of FORBIDDEN_CANARIES) {
    expect(renderedAndStored).not.toContain(canary)
    expect(browserLogs.join('\n')).not.toContain(canary)
  }
})

test('support recheck uses the same checkout reference, an empty body, and refreshes detail', async ({ page }) => {
  let detailReads = 0
  const recheckRequests: Request[] = []
  await page.route('**/admin/billing/checkouts/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.pathname.endsWith('/recheck')) {
      recheckRequests.push(request)
      await route.fulfill({
        contentType: 'application/json',
        json: {
          checkoutRef: CHECKOUT_REF,
          parentId: PARENT_ID,
          targetPlan: 'family',
          beneficiaryIds: ['student-selected'],
          createdAt: '2026-07-24T10:00:00Z',
          updatedAt: '2026-07-24T10:06:00Z',
          commandState: 'activation_recorded',
          providerEffectStatus: 'attached',
          lifecycleState: 'active',
          lastRecheckedAt: '2026-07-24T10:06:00Z',
          safeAction: 'view_billing',
          failureCode: 'none',
          providerSessionSuffix: 'safe42',
          reconciliationLeaseGeneration: 10,
        },
      })
      return
    }

    detailReads += 1
    expect(url.searchParams.get('parentId')).toBe(PARENT_ID)
    expect(url.searchParams.get('detail')).toBe('true')
    await route.fulfill({
      contentType: 'application/json',
      json: billingDetail(detailReads === 1 ? 'support_needed' : 'active'),
    })
  })

  await loginAs(page, 'admin')
  await page.goto(
    `/admin/account-operations?parentId=${PARENT_ID}&checkoutRef=${CHECKOUT_REF}`,
  )

  await expect(page.getByText(/provider read unavailable/i)).toBeVisible()
  await page.getByRole('button', { name: /recheck original checkout/i }).click()
  await expect(page.getByText(/billing operation is active/i)).toBeVisible()

  expect(recheckRequests).toHaveLength(1)
  const recheck = recheckRequests[0]
  const recheckUrl = new URL(recheck.url())
  expect(recheck.method()).toBe('POST')
  expect(recheckUrl.pathname).toBe(`/admin/billing/checkouts/${CHECKOUT_REF}/recheck`)
  expect(recheckUrl.searchParams.get('parentId')).toBe(PARENT_ID)
  expect(recheck.postDataJSON()).toEqual({})
  expect(recheck.postData()).not.toMatch(/plan|status|beneficiary|callback/i)
  expect(detailReads).toBeGreaterThanOrEqual(2)
})

test('wrong capability denies detail and exposes no recheck action', async ({ page }) => {
  let providerRecheckCalls = 0
  await page.route('**/admin/billing/checkouts/**', async (route) => {
    if (route.request().url().includes('/recheck')) providerRecheckCalls += 1
    await route.fulfill({
      status: 403,
      contentType: 'application/json',
      json: {
        detail: {
          code: 'capability_denied',
          message: 'This billing support capability is not available.',
        },
      },
    })
  })

  await loginAs(page, 'admin')
  await page.goto(
    `/admin/account-operations?parentId=${PARENT_ID}&checkoutRef=${CHECKOUT_REF}`,
  )

  await expect(page.getByRole('alert')).toContainText(/billing evidence access is denied/i)
  await expect(page.getByRole('button', { name: /recheck original checkout/i })).toHaveCount(0)
  expect(providerRecheckCalls).toBe(0)
})

test('expired admin session returns to login without exposing a recheck action', async ({ page }) => {
  let providerRecheckCalls = 0
  await page.route('**/admin/billing/checkouts/**', async (route) => {
    if (route.request().url().includes('/recheck')) providerRecheckCalls += 1
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      json: {
        detail: {
          code: 'session_expired',
          message: 'The admin session has expired.',
        },
      },
    })
  })

  await loginAs(page, 'admin')
  await page.goto(
    `/admin/account-operations?parentId=${PARENT_ID}&checkoutRef=${CHECKOUT_REF}`,
  )

  await expect(page).toHaveURL(/\/login$/)
  expect(providerRecheckCalls).toBe(0)
})

test('provider dependency and recheck contention are explicit support states', async ({ page }) => {
  let failRead = true
  await page.route('**/admin/billing/checkouts/**', async (route) => {
    const request = route.request()
    if (request.url().includes('/recheck')) {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        json: {
          detail: {
            code: 'billing_recheck_in_progress',
            message: 'Another recheck is already in progress.',
          },
        },
      })
      return
    }
    if (failRead) {
      failRead = false
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        json: {
          detail: {
            code: 'billing_projection_temporarily_unavailable',
            message: 'Billing details are temporarily unavailable.',
          },
        },
      })
      return
    }
    await route.fulfill({ contentType: 'application/json', json: billingDetail('support_needed') })
  })

  await loginAs(page, 'admin')
  await page.goto(
    `/admin/account-operations?parentId=${PARENT_ID}&checkoutRef=${CHECKOUT_REF}`,
  )

  await expect(page.getByRole('alert')).toContainText(/billing provider is temporarily unavailable/i)
  await page.reload()
  await page.getByRole('button', { name: /recheck original checkout/i }).click()
  await expect(page.getByRole('alert')).toContainText(/recheck is already in progress/i)
})

test('billing recovery source is read and same-ref recheck only', () => {
  const hookSource = readFileSync(
    new URL('../../src/hooks/admin/useAdminBillingOperation.ts', import.meta.url),
    'utf8',
  )
  const pageSource = readFileSync(
    new URL('../../src/pages/admin/AdminAccountOperationsPage.tsx', import.meta.url),
    'utf8',
  )
  const apiSource = readFileSync(
    new URL('../../src/services/admin/adminApi.ts', import.meta.url),
    'utf8',
  )
  const contractStart = apiSource.indexOf('export type AdminBillingOperationDetail')
  const billingContractSource = apiSource.slice(contractStart)
  const source = `${hookSource}\n${pageSource}\n${billingContractSource}`

  expect(hookSource).toContain('billing/checkouts')
  expect(hookSource).toContain('checkoutRef')
  expect(source).not.toMatch(/markPaid|manualSuccess|setPaymentStatus|setEntitlementActive/i)
  expect(billingContractSource).not.toMatch(
    /checkoutUrl|providerCustomerId|cardNumber|clientSecret|secretKey/i,
  )
})

async function routeBillingDetail(page: Page, detail: ReturnType<typeof billingDetail>) {
  await page.route('**/admin/billing/checkouts/**', async (route) => {
    const url = new URL(route.request().url())
    expect(route.request().method()).toBe('GET')
    expect(url.pathname).toBe(`/admin/billing/checkouts/${CHECKOUT_REF}`)
    expect(url.searchParams.get('parentId')).toBe(PARENT_ID)
    expect(url.searchParams.get('detail')).toBe('true')
    await route.fulfill({ contentType: 'application/json', json: detail })
  })
}

function billingDetail(lifecycleState: 'active' | 'support_needed' = 'active') {
  return {
    checkoutRef: CHECKOUT_REF,
    parentId: PARENT_ID,
    targetPlan: 'family',
    beneficiaryIds: ['student-selected'],
    commandLifecycle: {
      state: lifecycleState === 'active' ? 'activation_recorded' : 'provider_session_open',
      providerEffectStatus: lifecycleState === 'active' ? 'attached' : 'session_attached',
      createdAt: '2026-07-24T10:00:00Z',
      updatedAt: '2026-07-24T10:05:00Z',
    },
    factLifecycle: [
      {
        kind: 'invoice_paid',
        factVersion: 5,
        providerEventIdDigest: DIGEST_A,
        providerObjectIdDigest: DIGEST_B,
        signatureVerified: true,
        providerLivemode: false,
        observedAt: '2026-07-24T10:04:00Z',
      },
    ],
    grantVersion: lifecycleState === 'active' ? { 'student-selected': 7 } : {},
    allowanceVersion: lifecycleState === 'active' ? { 'student-selected': 4 } : {},
    providerUsageEvidence: [
      {
        beneficiaryId: 'student-selected',
        correlationDigest: DIGEST_B,
        providerRequestIdDigest: DIGEST_A,
        modelIdDigest: DIGEST_B,
        inputTokens: 150_000,
        outputTokens: 25_000,
        providerCostRetained: true,
        observedAt: '2026-07-24T10:04:30Z',
      },
    ],
    paymentReminder: {
      brand: 'visa',
      last4: '4242',
      expiryMonth: 8,
      expiryYear: 2027,
      reminderAt: '2027-08-24T00:00:00Z',
      status: 'pending',
    },
    reconciliation: {
      lifecycleState,
      lastRecheckedAt: '2026-07-24T10:06:00Z',
      safeAction: lifecycleState === 'active' ? 'view_billing' : 'contact_support',
      failureCode: lifecycleState === 'active' ? 'none' : 'provider_read_unavailable',
      providerSessionSuffix: 'safe42',
      reconciliationLeaseGeneration: lifecycleState === 'active' ? 9 : 8,
    },
  }
}
