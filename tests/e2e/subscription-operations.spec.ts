import { expect, test, type Page } from '@playwright/test'
import { loginAs } from './helpers'
import type { SubscriptionBilling, SubscriptionRequest } from '../../src/types/subscriptionOperations'

const plans = {
  free_trial: {
    label: 'Free Trial',
    dailyAiQuestionLimit: 5,
    teacherSupport: 'none',
    weeklyReport: 'none',
  },
  student: {
    label: 'Student',
    dailyAiQuestionLimit: 30,
    teacherSupport: 'text_support',
    weeklyReport: 'enabled',
  },
  teacher_supported: {
    label: 'Teacher-supported',
    dailyAiQuestionLimit: 100,
    teacherSupport: 'priority_support',
    weeklyReport: 'enhanced',
  },
  family: {
    label: 'Family',
    dailyAiQuestionLimit: 100,
    teacherSupport: 'priority_support',
    weeklyReport: 'enhanced',
  },
}

const requestedUpgrade = subscriptionRequest('requested')
const approvedUpgrade = subscriptionRequest('approved')
const appliedUpgrade = subscriptionRequest('applied')

test('parent can submit a manual subscription request', async ({ page }) => {
  let submittedBody: Record<string, unknown> | null = null
  let checkoutBody: Record<string, unknown> | null = null
  await routeParentDashboard(page)
  await page.route('**/parents/me/subscription', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        parentId: 'parent-1',
        currentTier: 'free_trial',
        plans,
        pendingRequest: null,
        billing: subscriptionBilling('none'),
      }),
    })
  })
  await page.route('**/parents/me/subscription/checkout', async (route) => {
    checkoutBody = route.request().postDataJSON() as Record<string, unknown>
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        parentId: 'parent-1',
        checkoutSessionId: 'cs_test_parent',
        checkoutUrl: 'https://checkout.stripe.com/c/pay/cs_test_parent',
        provider: 'stripe',
        mode: 'test',
        requestedTier: 'teacher_supported',
        billingStatus: 'checkout_pending',
      }),
    })
  })
  await page.route('**/parents/me/subscription/requests**', async (route) => {
    if (route.request().method() === 'POST') {
      submittedBody = route.request().postDataJSON() as Record<string, unknown>
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(requestedUpgrade) })
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [], count: 0 }),
    })
  })

  await loginAs(page, 'parent')

  await expect(page.getByRole('heading', { name: /subscription operations/i })).toBeVisible()
  await expect(page.getByText(/current plan: free/i)).toBeVisible()
  await expect(page.getByText(/no provider-managed billing is attached/i)).toBeVisible()
  await page.getByRole('button', { name: /premium/i }).click()
  await page.getByRole('button', { name: /start checkout/i }).click()
  await expect.poll(() => checkoutBody).toMatchObject({
    requested_tier: 'teacher_supported',
  })
  await expect(page.getByText(/checkout ready: premium/i)).toBeVisible()
  await expect(page.getByRole('link', { name: /open secure checkout/i })).toBeVisible()
  await page.getByPlaceholder(/add a note/i).fill('Please upgrade for exam prep.')
  await page.getByRole('button', { name: /submit request/i }).click()

  await expect.poll(() => submittedBody).toMatchObject({
    request_type: 'upgrade',
    requested_tier: 'teacher_supported',
    parent_note: 'Please upgrade for exam prep.',
  })
  await expect(page.getByText(/request requested: premium/i)).toBeVisible()
})

test('admin can approve and apply a subscription request', async ({ page }) => {
  let patchBody: Record<string, unknown> | null = null
  let applyBody: Record<string, unknown> | null = null
  await routeAdminSubscriptionRequests(page, {
    onPatch: (body) => {
      patchBody = body
    },
    onApply: (body) => {
      applyBody = body
    },
  })
  await routeAdminSubscriptionBilling(page)

  await loginAs(page, 'admin')
  await page.goto('/admin/subscriptions')

  await expect(page.getByRole('heading', { name: /subscription requests/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /upgrade to premium parent-1/i })).toBeVisible()
  await expect(page.getByText(/provider billing visibility/i)).toBeVisible()
  await expect(page.getByRole('button', { name: /parent-1 premium \/ test/i })).toBeVisible()

  await page.getByRole('button', { name: /^approve$/i }).click()
  await expect.poll(() => patchBody).toMatchObject({
    status: 'approved',
    admin_note: 'Manual subscription review',
  })
  await expect(page.getByText(/request approved/i)).toBeVisible()

  await page.getByRole('button', { name: /apply approved tier/i }).click()
  await expect.poll(() => applyBody).toMatchObject({
    admin_note: 'Manual subscription review',
  })
  await expect(page.getByText(/applied premium to parent-1/i)).toBeVisible()
})

async function routeParentDashboard(page: Page) {
  await page.route('**/parents/me/children', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [] }),
    })
  })
}

async function routeAdminSubscriptionBilling(page: Page) {
  await page.route('**/admin/subscriptions/billing**', async (route) => {
    const url = route.request().url()
    if (url.endsWith('/parent-1')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(subscriptionBilling('active')),
      })
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [subscriptionBilling('active')], count: 1 }),
    })
  })
}

async function routeAdminSubscriptionRequests(
  page: Page,
  callbacks: {
    onPatch: (body: Record<string, unknown>) => void
    onApply: (body: Record<string, unknown>) => void
  },
) {
  let currentRequest = requestedUpgrade
  await page.route('**/admin/subscriptions/requests**', async (route) => {
    const url = route.request().url()
    const method = route.request().method()

    if (url.endsWith('/apply') && method === 'POST') {
      callbacks.onApply(route.request().postDataJSON() as Record<string, unknown>)
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(appliedUpgrade) })
      return
    }

    if (url.endsWith('/request-1') && method === 'PATCH') {
      callbacks.onPatch(route.request().postDataJSON() as Record<string, unknown>)
      currentRequest = approvedUpgrade
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(approvedUpgrade) })
      return
    }

    if (url.endsWith('/request-1') && method === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(currentRequest) })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [currentRequest], count: 1 }),
    })
  })
}

function subscriptionRequest(status: SubscriptionRequest['status']): SubscriptionRequest {
  return {
    requestId: 'request-1',
    parentId: 'parent-1',
    studentId: null,
    currentTier: 'free_trial',
    requestedTier: 'teacher_supported',
    requestType: 'upgrade',
    status,
    source: 'parent_portal',
    parentNote: 'Please upgrade for exam prep.',
    adminNote: status === 'requested' ? null : 'Manual subscription review',
    createdAt: '2026-06-08T08:00:00Z',
    updatedAt: '2026-06-08T08:30:00Z',
    effectiveAt: null,
    appliedAt: status === 'applied' ? '2026-06-08T09:00:00Z' : null,
    appliedBy: status === 'applied' ? 'admin-1' : null,
    history: [
      {
        eventId: `event-${status}`,
        eventAt: '2026-06-08T08:00:00Z',
        eventType: status,
        actorId: 'parent-1',
        actorRole: 'parent',
        note: status === 'requested' ? 'Parent submitted request.' : 'Manual subscription review',
      },
    ],
  }
}

function subscriptionBilling(status: SubscriptionBilling['status']): SubscriptionBilling {
  return {
    parentId: 'parent-1',
    provider: status === 'none' ? null : 'stripe',
    mode: status === 'none' ? 'manual' : 'test',
    status,
    subscriptionTier: status === 'none' ? 'free_trial' : 'teacher_supported',
    requestedTier: status === 'none' ? null : 'teacher_supported',
    providerCustomerId: status === 'none' ? null : 'cus_test_parent',
    providerSubscriptionId: status === 'none' ? null : 'sub_test_parent',
    providerPriceId: status === 'none' ? null : 'price_test_premium',
    checkoutSessionId: status === 'none' ? null : 'cs_test_parent',
    checkoutUrl: status === 'none' ? null : 'https://checkout.stripe.com/c/pay/cs_test_parent',
    currentPeriodStart: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    lastProviderEventId: status === 'none' ? null : 'evt_checkout_completed_1',
    lastProviderEventType: status === 'none' ? null : 'checkout.session.completed',
    lastProviderEventAt: status === 'none' ? null : '2026-06-08T09:00:00Z',
    manualOverrideAt: null,
    manualOverrideBy: null,
    manualOverrideSource: null,
    updatedAt: '2026-06-08T09:00:00Z',
    events: status === 'none'
      ? []
      : [
          {
            eventId: 'stripe_evt_checkout_completed_1',
            eventAt: '2026-06-08T09:00:00Z',
            eventType: 'checkout.session.completed',
            provider: 'stripe',
            providerMode: 'test',
            billingStatus: 'active',
            requestedTier: 'teacher_supported',
            providerEventId: 'evt_checkout_completed_1',
          },
        ],
  }
}
