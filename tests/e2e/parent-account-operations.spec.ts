import { expect, test, type Page } from '@playwright/test'
import { loginAs } from './helpers'
import type { ParentAccountOperations } from '../../src/types/parentAccountOperations'

test('parent can review ready account operations status', async ({ page }) => {
  await routeParentDashboardDependencies(page, readyAccountOperations())

  await loginAs(page, 'parent')
  await page.goto('/parent/account-operations')

  await expect(page.getByRole('heading', { name: /family account status/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /^ready$/i })).toBeVisible()
  await expect(page.getByText(/the parent account is operational/i)).toBeVisible()
  await expect(page.getByText('Anna Keller').first()).toBeVisible()
  await expect(page.getByText('student@test.com').first()).toBeVisible()
  await expect(page.getByText('Active').first()).toBeVisible()
  await expect(page.getByText('Matched')).toBeVisible()
  await expect(page.getByText(/15 remaining/i)).toBeVisible()
})

test('parent sees attention signals for child access and usage reconciliation', async ({ page }) => {
  await routeParentDashboardDependencies(page, attentionAccountOperations())

  await loginAs(page, 'parent')
  await page.goto('/parent/account-operations')

  await expect(page.getByRole('heading', { name: /^attention$/i })).toBeVisible()
  await expect(page.getByText(/a child account email is not verified/i)).toBeVisible()
  await expect(page.getByText(/child link needs review: pending review/i)).toBeVisible()
  await expect(page.getByText(/usage is still being reconciled/i)).toBeVisible()
  await expect(page.getByText('Pending verification').first()).toBeVisible()
  await expect(page.getByText('Reconciling')).toBeVisible()
})

test('parent sees blocked no-child account operations status', async ({ page }) => {
  await routeParentDashboardDependencies(page, blockedNoChildAccountOperations(), [])

  await loginAs(page, 'parent')
  await page.goto('/parent/account-operations')

  await expect(page.getByRole('heading', { name: /^blocked$/i })).toBeVisible()
  await expect(page.getByText(/parent email needs verification/i)).toBeVisible()
  await expect(page.getByText(/billing needs attention/i)).toBeVisible()
  await expect(page.getByText(/no linked child account is available/i)).toBeVisible()
  await expect(page.getByText(/no child account is linked yet/i)).toBeVisible()
})

test('parent account operations renders API error state', async ({ page }) => {
  await routeParentBaseDependencies(page)
  await page.route('**/parents/me/account-operations', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      json: { detail: 'Account operations unavailable' },
    })
  })

  await loginAs(page, 'parent')
  await page.goto('/parent/account-operations')

  await expect(page.getByRole('alert')).toContainText(/account operations are unavailable/i)
})

test('parent dashboard links to account operations view', async ({ page }) => {
  await routeParentDashboardDependencies(page, readyAccountOperations())

  await loginAs(page, 'parent')

  await expect(page.getByRole('heading', { name: /parent dashboard/i })).toBeVisible()
  await expect(page.getByText(/account is ready/i)).toBeVisible()
  await page.getByRole('link', { name: /view account operations/i }).click()

  await expect(page).toHaveURL(/\/parent\/account-operations/)
  await expect(page.getByRole('heading', { name: /family account status/i })).toBeVisible()
})

async function routeParentDashboardDependencies(
  page: Page,
  accountOperations: ParentAccountOperations,
  children = [parentChild()],
) {
  await routeParentBaseDependencies(page, children)
  await page.route('**/parents/me/account-operations', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: accountOperations,
    })
  })
}

async function routeParentBaseDependencies(page: Page, children = [parentChild()]) {
  await page.route('**/parents/me/children', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: { items: children },
    })
  })
  await page.route('**/parents/me/subscription/requests**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: { items: [], count: 0 },
    })
  })
  await page.route('**/parents/me/subscription', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: {
        parentId: 'parent-1',
        currentTier: 'standard',
        pendingRequest: null,
        billing: {
          parentId: 'parent-1',
          status: 'active',
          mode: 'test',
          provider: 'stripe',
          subscriptionTier: 'standard',
          requestedTier: 'standard',
          checkoutUrl: null,
          cancelAtPeriodEnd: false,
          lastProviderEventType: 'invoice.paid',
        },
        plans: {
          free: {
            label: 'Free',
            dailyAiQuestionLimit: 5,
            teacherSupport: 'basic',
            weeklyReport: 'monthly_digest',
          },
          standard: {
            label: 'Standard',
            dailyAiQuestionLimit: 20,
            teacherSupport: 'standard',
            weeklyReport: 'weekly_summary',
          },
          premium: {
            label: 'Premium',
            dailyAiQuestionLimit: 50,
            teacherSupport: 'priority',
            weeklyReport: 'weekly_deep_dive',
          },
        },
      },
    })
  })
}

function parentChild() {
  return {
    id: 'student-1',
    userId: 'student-1',
    name: 'Anna Keller',
    email: 'student@test.com',
    grade: 'Grade 8',
    subjects: ['Mathematics'],
    relationship: 'child',
  }
}

function readyAccountOperations(): ParentAccountOperations {
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
      subscriptionTier: 'standard',
      requestedTier: 'standard',
      lastProviderEventType: 'invoice.paid',
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
        },
        entitlement: {
          effectivePlan: 'standard',
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

function attentionAccountOperations(): ParentAccountOperations {
  const data = readyAccountOperations()
  return {
    ...data,
    children: [
      {
        ...data.children[0],
        binding: {
          ...data.children[0].binding,
          status: 'pending_review',
        },
        profile: {
          ...data.children[0].profile,
          verification: {
            emailVerificationStatus: 'pending_verification',
            emailVerificationRequired: true,
            accountActivationStatus: 'pending_email_verification',
          },
        },
        usage: usageSummary(true),
      },
    ],
    usage: [usageSummary(true)],
    supportState: {
      state: 'attention',
      blockers: [],
      warnings: ['child_email_unverified', 'child_binding_pending_review', 'usage_unreconciled'],
    },
  }
}

function blockedNoChildAccountOperations(): ParentAccountOperations {
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
    },
    children: [],
    usage: [],
    supportState: {
      state: 'blocked',
      blockers: ['parent_email_unverified', 'billing_inactive', 'no_linked_children'],
      warnings: [],
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
    effectivePlan: 'standard',
    entitlementSource: 'billing',
    billingState: 'active',
    unreconciled,
  }
}
