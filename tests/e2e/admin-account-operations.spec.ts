import { expect, test, type Page } from '@playwright/test'
import { loginAs } from './helpers'
import type { AdminAccountOperations } from '../../src/types/adminAccountOperations'
import type { SubscriptionBilling, SubscriptionRequest } from '../../src/types/subscriptionOperations'

test('admin can inspect ready parent account operations', async ({ page }) => {
  await routeAdminAccountOperations(page, readyAccountOperations())

  await loginAs(page, 'admin')
  await page.goto('/admin/account-operations?parentId=parent-1&day=2026-07-03')

  await expect(page.getByRole('heading', { name: /parent support console/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /^ready$/i })).toBeVisible()
  await expect(page.getByText('Parent One')).toBeVisible()
  await expect(page.getByText('Anna Keller')).toBeVisible()
  await expect(page.getByText(/invoice paid/i).first()).toBeVisible()
  await expect(page.getByText('Matched', { exact: true })).toBeVisible()
  await expect(page.getByText(/15 remaining/i)).toBeVisible()
})

test('admin sees blockers and warnings for parent account operations', async ({ page }) => {
  await routeAdminAccountOperations(page, blockedAccountOperations())

  await loginAs(page, 'admin')
  await page.goto('/admin/account-operations?parentId=parent-1')

  await expect(page.getByRole('heading', { name: /^blocked$/i })).toBeVisible()
  await expect(page.getByText(/parent email needs verification/i)).toBeVisible()
  await expect(page.getByText(/billing needs attention/i)).toBeVisible()
  await expect(page.getByText(/a child account email is not verified/i)).toBeVisible()
  await expect(page.getByText(/child link needs review: active pending verification/i)).toBeVisible()
  await expect(page.getByText('Reconciling')).toBeVisible()
})

test('admin account operations handles missing parent', async ({ page }) => {
  await page.route('**/admin/account-operations/parents/missing-parent**', async (route) => {
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      json: { detail: 'Parent not found' },
    })
  })

  await loginAs(page, 'admin')
  await page.goto('/admin/account-operations?parentId=missing-parent')

  await expect(page.getByRole('alert')).toContainText(/parent account was not found/i)
})

test('admin account operations handles API error', async ({ page }) => {
  await page.route('**/admin/account-operations/parents/parent-1**', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      json: { detail: 'Account operations unavailable' },
    })
  })

  await loginAs(page, 'admin')
  await page.goto('/admin/account-operations?parentId=parent-1')

  await expect(page.getByRole('alert')).toContainText(/admin account operations are unavailable/i)
})

test('admin can hand off from subscriptions to account operations', async ({ page }) => {
  await routeAdminSubscriptions(page)
  await routeAdminAccountOperations(page, readyAccountOperations())

  await loginAs(page, 'admin')
  await page.goto('/admin/subscriptions')

  await expect(page.getByRole('heading', { name: /subscription requests/i })).toBeVisible()
  await page.getByRole('link', { name: /inspect account operations/i }).first().click()

  await expect(page).toHaveURL(/\/admin\/account-operations\?parentId=parent-1/)
  await expect(page.getByRole('heading', { name: /parent support console/i })).toBeVisible()
  await expect(page.getByText('Parent One')).toBeVisible()
})

async function routeAdminAccountOperations(page: Page, data: AdminAccountOperations) {
  await page.route('**/admin/account-operations/parents/parent-1**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: data,
    })
  })
}

async function routeAdminSubscriptions(page: Page) {
  await page.route('**/admin/subscriptions/requests**', async (route) => {
    const url = route.request().url()
    if (url.includes('/requests/request-1')) {
      await route.fulfill({
        contentType: 'application/json',
        json: subscriptionRequest(),
      })
      return
    }
    await route.fulfill({
      contentType: 'application/json',
      json: { items: [subscriptionRequest()], count: 1 },
    })
  })
  await page.route('**/admin/subscriptions/billing**', async (route) => {
    const url = route.request().url()
    if (url.endsWith('/parent-1')) {
      await route.fulfill({
        contentType: 'application/json',
        json: subscriptionBilling(),
      })
      return
    }
    await route.fulfill({
      contentType: 'application/json',
      json: { items: [subscriptionBilling()], count: 1 },
    })
  })
}

function readyAccountOperations(): AdminAccountOperations {
  return {
    parentId: 'parent-1',
    parent: {
      userId: 'parent-1',
      email: 'parent@test.com',
      name: 'Parent One',
      role: 'parent',
      verification: {
        emailVerificationStatus: 'verified',
        emailVerificationRequired: false,
        accountActivationStatus: 'active',
      },
    },
    billing: {
      status: 'active',
      mode: 'test',
      provider: 'stripe',
      subscriptionTier: 'premium',
      requestedTier: 'premium',
      paymentMethodType: 'card',
      currentPeriodStart: '2026-07-01T00:00:00Z',
      currentPeriodEnd: '2026-08-01T00:00:00Z',
      cancelAtPeriodEnd: false,
      lastProviderEventType: 'invoice.paid',
      lastProviderEventAt: '2026-07-01T01:00:00Z',
      manualOverrideSource: null,
      events: [
        {
          eventId: 'event-1',
          eventAt: '2026-07-01T01:00:00Z',
          eventType: 'invoice.paid',
          provider: 'stripe',
          providerMode: 'test',
          billingStatus: 'active',
          requestedTier: 'premium',
          providerEventId: 'evt_test_1',
        },
      ],
    },
    children: [
      {
        studentId: 'student-1',
        profile: {
          userId: 'student-1',
          email: 'student@test.com',
          name: 'Anna Keller',
          role: 'student',
          verification: {
            emailVerificationStatus: 'verified',
            emailVerificationRequired: false,
            accountActivationStatus: 'active',
          },
        },
        binding: {
          parentId: 'parent-1',
          studentId: 'student-1',
          status: 'active',
          relationship: 'child',
          source: 'admin_test',
        },
        entitlement: {
          effectivePlan: 'premium',
          source: 'billing',
          billingState: 'active',
          limits: { dailyAiQuestionLimit: 20 },
        },
        usage: usageSummary(false),
      },
    ],
    usage: [usageSummary(false)],
    supportState: {
      state: 'ready',
      blockers: [],
      warnings: [],
    },
  }
}

function blockedAccountOperations(): AdminAccountOperations {
  const data = readyAccountOperations()
  return {
    ...data,
    parent: {
      ...data.parent,
      verification: {
        emailVerificationStatus: 'pending_verification',
        emailVerificationRequired: true,
        accountActivationStatus: 'pending_email_verification',
      },
    },
    billing: {
      ...data.billing,
      status: 'past_due',
      lastProviderEventType: 'invoice.payment_failed',
      events: [
        {
          eventId: 'event-failed',
          eventAt: '2026-07-02T01:00:00Z',
          eventType: 'invoice.payment_failed',
          provider: 'stripe',
          providerMode: 'test',
          billingStatus: 'past_due',
          requestedTier: 'premium',
          providerEventId: 'evt_failed_1',
        },
      ],
    },
    children: [
      {
        ...data.children[0],
        binding: {
          ...data.children[0].binding,
          status: 'active_pending_verification',
        },
        profile: {
          ...data.children[0].profile,
          verification: {
            emailVerificationStatus: 'expired_verification',
            emailVerificationRequired: true,
            accountActivationStatus: 'pending_email_verification',
          },
        },
        usage: usageSummary(true),
      },
    ],
    usage: [usageSummary(true)],
    supportState: {
      state: 'blocked',
      blockers: ['billing_inactive', 'parent_email_unverified'],
      warnings: ['child_binding_active_pending_verification', 'child_email_unverified', 'usage_unreconciled'],
    },
  }
}

function usageSummary(unreconciled: boolean) {
  return {
    studentId: 'student-1',
    parentId: 'parent-1',
    quotaPeriod: '2026-07-03',
    action: 'ai_question',
    consumed: unreconciled ? 6 : 5,
    limit: 20,
    remaining: unreconciled ? 14 : 15,
    effectivePlan: 'premium',
    entitlementSource: 'billing',
    billingState: 'active',
    unreconciled,
  }
}

function subscriptionRequest(): SubscriptionRequest {
  return {
    requestId: 'request-1',
    parentId: 'parent-1',
    currentTier: 'standard',
    requestedTier: 'premium',
    requestType: 'upgrade',
    status: 'approved',
    source: 'parent_portal',
    parentNote: 'Please upgrade for exam prep.',
    adminNote: 'Manual subscription review',
    createdAt: '2026-07-01T09:00:00Z',
    updatedAt: '2026-07-01T10:00:00Z',
    effectiveAt: null,
    appliedAt: null,
    appliedBy: null,
    history: [
      {
        eventId: 'history-1',
        eventAt: '2026-07-01T09:00:00Z',
        eventType: 'requested',
        actorId: 'parent-1',
        actorRole: 'parent',
        note: 'Please upgrade for exam prep.',
      },
    ],
  }
}

function subscriptionBilling(): SubscriptionBilling {
  return {
    parentId: 'parent-1',
    provider: 'stripe',
    mode: 'test',
    status: 'active',
    subscriptionTier: 'premium',
    requestedTier: 'premium',
    providerCustomerId: 'cus_test_parent',
    providerSubscriptionId: 'sub_test_parent',
    providerPriceId: 'price_test_parent',
    checkoutSessionId: 'cs_test_parent',
    checkoutUrl: null,
    currentPeriodStart: '2026-07-01T00:00:00Z',
    currentPeriodEnd: '2026-08-01T00:00:00Z',
    cancelAtPeriodEnd: false,
    lastProviderEventId: 'evt_test_1',
    lastProviderEventType: 'invoice.paid',
    lastProviderEventAt: '2026-07-01T01:00:00Z',
    manualOverrideAt: null,
    manualOverrideBy: null,
    manualOverrideSource: null,
    updatedAt: '2026-07-01T01:00:00Z',
    events: [
      {
        eventId: 'event-1',
        eventAt: '2026-07-01T01:00:00Z',
        eventType: 'invoice.paid',
        provider: 'stripe',
        providerMode: 'test',
        billingStatus: 'active',
        requestedTier: 'premium',
        providerEventId: 'evt_test_1',
      },
    ],
  }
}
