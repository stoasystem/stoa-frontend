import { expect, test, type Page } from '@playwright/test'
import { loginAs } from './helpers'
import type { SubscriptionRequest } from '../../src/types/subscriptionOperations'

const plans = {
  free: {
    label: 'Free',
    dailyAiQuestionLimit: 5,
    teacherSupport: 'none',
    weeklyReport: 'none',
  },
  standard: {
    label: 'Standard',
    dailyAiQuestionLimit: 30,
    teacherSupport: 'standard',
    weeklyReport: 'summary',
  },
  premium: {
    label: 'Premium',
    dailyAiQuestionLimit: 100,
    teacherSupport: 'priority',
    weeklyReport: 'detailed',
  },
}

const requestedUpgrade = subscriptionRequest('requested')
const approvedUpgrade = subscriptionRequest('approved')
const appliedUpgrade = subscriptionRequest('applied')

test('parent can submit a manual subscription request', async ({ page }) => {
  let submittedBody: Record<string, unknown> | null = null
  await routeParentDashboard(page)
  await page.route('**/parents/me/subscription', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        parent_id: 'parent-1',
        current_tier: 'free',
        plans,
        pending_request: null,
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
  await page.getByRole('button', { name: /premium/i }).click()
  await page.getByPlaceholder(/add a note/i).fill('Please upgrade for exam prep.')
  await page.getByRole('button', { name: /submit request/i }).click()

  await expect.poll(() => submittedBody).toMatchObject({
    request_type: 'upgrade',
    requested_tier: 'premium',
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

  await loginAs(page, 'admin')
  await page.goto('/admin/subscriptions')

  await expect(page.getByRole('heading', { name: /subscription requests/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /upgrade to premium parent-1/i })).toBeVisible()

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
    currentTier: 'free',
    requestedTier: 'premium',
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
