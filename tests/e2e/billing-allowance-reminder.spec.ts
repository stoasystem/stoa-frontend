import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'

const WEB_ORIGIN = 'https://staging.stoaedu.ch'
const FORBIDDEN_CANARIES = [
  '4242424242424242',
  '123',
  'pm_provider_private_canary',
  'sk_test_private_canary',
]

test.beforeEach(async ({ page }) => {
  await routeReleaseRuntime(page)
})

test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'ignoreErrors' })
})

test('parent allowance renders exact server percentages, remaining values, and Zurich week', async ({ page }) => {
  await installSession(page, 'parent')
  await routeParentShell(page, billingOverview())
  await routeNotifications(page, [])

  await page.goto(`${WEB_ORIGIN}/billing`)

  await expect(page.getByTestId('allowance-window')).toContainText(
    'Europe/Zurich',
  )
  await expect(page.getByTestId('allowance-input-student-selected')).toContainText(
    '25% used · 750 tokens remaining',
  )
  await expect(page.getByTestId('allowance-output-student-selected')).toContainText(
    '100% used · 0 tokens remaining',
  )
  await expect(page.getByTestId('allowance-teacher-cases')).toContainText(
    '1 of 2 support cases remaining',
  )
  await expect(page.getByText(/learning messages|file uploads|daily/i)).toHaveCount(0)
})

test('parent and selected beneficiary student receive identical safe reminder copy', async ({ page }) => {
  const reminder = paymentReminder()

  await installSession(page, 'parent')
  await routeParentShell(page, billingOverview({ reminder }))
  await routeNotifications(page, [paymentReminderNotification('parent-1', reminder)])
  await page.goto(`${WEB_ORIGIN}/parent`)
  const parentCopy = await reminderText(page)

  await installSession(page, 'student', 'student-selected')
  await routeNotifications(page, [
    paymentReminderNotification('student-selected', reminder),
  ])
  await page.goto(`${WEB_ORIGIN}/dashboard`)
  const studentCopy = await reminderText(page)

  expect(studentCopy).toBe(parentCopy)
  expect(studentCopy).toContain('CHF 89/month')
  expect(studentCopy).toContain('Active')
  expect(studentCopy).toContain('Visa ending in 4242')
  expect(studentCopy).toContain('08/2026')
  await expect(
    page.getByTestId('payment-method-reminder').getByRole('link', {
      name: /billing/i,
    }),
  ).toHaveCount(0)
})

test('student outside the backend recipient projection sees no family reminder', async ({ page }) => {
  await installSession(page, 'student', 'student-unselected')
  await routeNotifications(page, [])

  await page.goto(`${WEB_ORIGIN}/dashboard`)

  await expect(page.getByTestId('payment-method-reminder')).toHaveCount(0)
})

test('in-app-only and email failure remain explicit without changing billing state', async ({ page }) => {
  await installSession(page, 'student', 'student-selected')
  await routeNotifications(page, [
    paymentReminderNotification(
      'student-selected',
      paymentReminder({ emailDelivery: 'failed' }),
    ),
  ])

  await page.goto(`${WEB_ORIGIN}/dashboard`)

  const banner = page.getByTestId('payment-method-reminder')
  await expect(banner).toContainText('Active')
  await expect(banner).toContainText('Available here in STOA')
  await expect(banner).toContainText('Email delivery failed')

  await routeNotifications(page, [
    paymentReminderNotification(
      'student-selected',
      paymentReminder({ emailDelivery: 'ineligible' }),
    ),
  ])
  await page.reload()
  await expect(banner).toContainText('Available here in STOA')
  await expect(banner).toContainText('No billing email is required')
  await expect(banner).toContainText('Active')
})

test('resolved reminder clears and a backend replacement becomes the only banner', async ({ page }) => {
  await installSession(page, 'student', 'student-selected')
  await routeNotifications(page, [
    paymentReminderNotification(
      'student-selected',
      paymentReminder({ reminderId: 'old-reminder', resolved: true }),
    ),
    paymentReminderNotification(
      'student-selected',
      paymentReminder({
        reminderId: 'replacement-reminder',
        lastFour: '5555',
        expiryMonth: 9,
      }),
    ),
  ])

  await page.goto(`${WEB_ORIGIN}/dashboard`)

  const banner = page.getByTestId('payment-method-reminder')
  await expect(banner).toContainText('ending in 5555')
  await expect(banner).not.toContainText('ending in 4242')
})

test('reminder loading and failure states are non-blocking and explicit', async ({ page }) => {
  await installSession(page, 'student', 'student-selected')
  await page.route('**/notifications', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 250))
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      json: {
        detail: {
          code: 'notifications_temporarily_unavailable',
          message: 'Notifications are temporarily unavailable.',
        },
      },
    })
  })

  await page.goto(`${WEB_ORIGIN}/dashboard`)

  await expect(page.getByTestId('payment-reminder-loading')).toBeVisible()
  await expect(page.getByTestId('payment-reminder-error')).toContainText(
    'Billing reminder is temporarily unavailable',
  )
  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
})

test('masked reminder never exposes payment-capable values in browser surfaces', async ({ page }) => {
  const browserLogs: string[] = []
  page.on('console', (message) => browserLogs.push(message.text()))
  await installSession(page, 'student', 'student-selected')
  await routeNotifications(page, [
    {
      ...paymentReminderNotification('student-selected', paymentReminder()),
      metadata: {
        paymentReminder: paymentReminder(),
        cardNumber: FORBIDDEN_CANARIES[0],
        cvc: FORBIDDEN_CANARIES[1],
        providerPaymentMethodId: FORBIDDEN_CANARIES[2],
        providerSecret: FORBIDDEN_CANARIES[3],
      },
    },
  ])

  await page.goto(`${WEB_ORIGIN}/dashboard`)

  const browserSurface = await page.evaluate(() =>
    [
      document.body.innerText,
      JSON.stringify(localStorage),
      JSON.stringify(sessionStorage),
    ].join('\n'),
  )
  for (const canary of FORBIDDEN_CANARIES) {
    expect(browserSurface).not.toContain(canary)
    expect(browserLogs.join('\n')).not.toContain(canary)
  }
})

test('source binds the authenticated layout to a closed server-driven reminder', () => {
  const layoutSource = readFileSync(
    new URL('../../src/layouts/DashboardLayout.tsx', import.meta.url),
    'utf8',
  )
  const bannerSource = readFileSync(
    new URL('../../src/components/billing/PaymentMethodReminderBanner.tsx', import.meta.url),
    'utf8',
  )
  const usageSource = readFileSync(
    new URL('../../src/components/billing/PlanUsageCard.tsx', import.meta.url),
    'utf8',
  )

  expect(layoutSource).toContain('PaymentMethodReminderBanner')
  expect(bannerSource).toMatch(/parent.*student|student.*parent/s)
  expect(bannerSource).toContain('reminder.resolved')
  expect(bannerSource).not.toMatch(
    /cardNumber|cvc|providerPaymentMethodId|providerSecret|clientSecret/i,
  )
  expect(usageSource).toContain('inputPercentUsed')
  expect(usageSource).toContain('outputPercentUsed')
  expect(usageSource).not.toMatch(
    /dailyAiQuestionLimit|aiMessagesUsed|fileUploadsUsed|planLimit/,
  )
})

async function reminderText(page: Page) {
  const banner = page.getByTestId('payment-method-reminder')
  await expect(banner).toBeVisible()
  await expect(banner).toHaveAttribute('role', 'status')
  return (await banner.innerText()).replace(/\s+/g, ' ').trim()
}

async function routeParentShell(
  page: Page,
  overview: ReturnType<typeof billingOverview>,
) {
  await page.route(/\/parents\/me\/subscription\/billing$/, async (route) => {
    await route.fulfill({ contentType: 'application/json', json: overview })
  })
  await page.route(/\/parents\/me\/subscription$/, async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: {
        parentId: 'parent-1',
        currentTier: 'premium',
        plans: {},
        pendingRequest: null,
        billing: { status: 'active' },
        effectiveEntitlements: [],
      },
    })
  })
  await page.route(/\/parents\/me\/children$/, async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: {
        items: [
          {
            id: 'student-selected',
            userId: 'student-selected',
            name: 'Ada Student',
            email: 'ada@test.com',
            grade: '7',
            subjects: ['math'],
            relationship: 'child',
          },
        ],
      },
    })
  })
}

async function routeNotifications(page: Page, items: unknown[]) {
  await page.route('**/notifications', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: { items, count: items.length },
    })
  })
}

async function installSession(
  page: Page,
  role: 'parent' | 'student',
  id = role === 'parent' ? 'parent-1' : 'student-selected',
) {
  await page.addInitScript(() => {
    window.localStorage.setItem('stoa_access_token', 'e2e-billing-token')
  })
  await page.route(/\/auth\/me$/, async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: {
        id,
        name: role === 'parent' ? 'Parent Billing' : 'Ada Student',
        email: `${id}@test.com`,
        role,
        effectiveLocale: 'en',
      },
    })
  })
}

function billingOverview(
  input: { reminder?: ReturnType<typeof paymentReminder> | null } = {},
) {
  return {
    parentId: 'parent-1',
    effectivePlan: 'teacher_supported',
    beneficiaries: [
      { studentId: 'student-selected', effectivePlan: 'teacher_supported' },
    ],
    allowanceWindow: {
      weekIdentity: '2026-W30',
      timezone: 'Europe/Zurich',
      utcStart: '2026-07-19T22:00:00+00:00',
      utcEnd: '2026-07-26T22:00:00+00:00',
      localStart: '2026-07-20T00:00:00+02:00',
      localEnd: '2026-07-27T00:00:00+02:00',
    },
    inputRemaining: { 'student-selected': 750 },
    outputRemaining: { 'student-selected': 0 },
    inputPercentUsed: { 'student-selected': 25 },
    outputPercentUsed: { 'student-selected': 100 },
    teacherCasesRemaining: {
      scope: 'per_beneficiary',
      remaining: 1,
      limit: 2,
      byBeneficiary: { 'student-selected': 1 },
    },
    paymentReminder: input.reminder ?? paymentReminder(),
    supportActions: ['view_billing', 'go_home'],
    status: 'active',
    subscriptionTier: 'teacher_supported',
    paymentMethodType: 'card',
    dunning: { state: 'current', supportAction: null, nextPaymentAttempt: null },
    latestInvoice: {
      currency: 'CHF',
      amountPaid: 8900,
      amountRemaining: 0,
      amountRefunded: 0,
      taxStatus: 'not_applicable',
      hostedInvoiceUrl: null,
      receiptUrl: null,
    },
    refund: { state: 'none', eligibleAmount: 0, refundedAmount: 0 },
  }
}

function paymentReminder(
  input: {
    reminderId?: string
    resolved?: boolean
    lastFour?: string
    expiryMonth?: number
    emailDelivery?: 'sent' | 'ineligible' | 'failed'
  } = {},
) {
  return {
    reminderId: input.reminderId ?? 'reminder-active',
    billingState: 'active',
    price: { amount: 89, currency: 'CHF' as const },
    paymentMethod: {
      brand: 'visa',
      lastFour: input.lastFour ?? '4242',
      expiryMonth: input.expiryMonth ?? 8,
      expiryYear: 2026,
    },
    resolved: input.resolved ?? false,
    remindAt: '2026-07-24T00:00:00Z',
    updatedAt: '2026-07-24T00:00:00Z',
    delivery: {
      inApp: 'active',
      email: input.emailDelivery ?? 'sent',
    },
  }
}

function paymentReminderNotification(
  recipientId: string,
  reminder: ReturnType<typeof paymentReminder>,
) {
  return {
    eventId: `payment-${recipientId}-${reminder.reminderId}`,
    recipientId,
    recipientRole: recipientId.startsWith('parent') ? 'parent' : 'student',
    eventType: 'system_notice',
    targetType: 'billing_payment_method',
    targetId: reminder.reminderId,
    title: 'Payment method reminder',
    summary: 'A family payment method needs attention.',
    status: 'created',
    createdAt: reminder.updatedAt,
    readAt: null,
    archivedAt: null,
    metadata: { paymentReminder: reminder },
    actorId: null,
    actorRole: null,
  }
}

async function routeReleaseRuntime(page: Page) {
  const release = {
    releaseId: '1'.repeat(64),
    manifestSha256: '2'.repeat(64),
    frontendArtifactSha256: '3'.repeat(64),
    backendArtifactSha256: '4'.repeat(64),
  }
  const runtimeConfig = {
    schema: 'stoa.web.runtime-config.v1',
    environment: 'staging',
    release,
    web: { origin: WEB_ORIGIN },
    api: { origin: 'https://api-staging.stoaedu.ch' },
    auth: { mode: 'backend-api' },
    realtime: { enabled: false, endpoint: null },
    features: {
      analytics: false,
      errorMonitoring: false,
      feedback: false,
      parentReports: true,
      payments: true,
      publicRegistration: false,
      realtimeNotifications: false,
      referrals: false,
      supportTickets: true,
      teacherHelp: true,
    },
  }
  const runtimeDigest = createHash('sha256')
    .update(canonicalize(runtimeConfig))
    .digest('hex')

  await page.route(`${WEB_ORIGIN}/**`, async (route) => {
    const url = new URL(route.request().url())
    if (url.pathname === '/served-release.json') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          schema: 'stoa.web.served-release.v1',
          environment: 'staging',
          release,
          runtimeConfig: {
            key: 'runtime-config.json',
            versionId: 'runtime-version_A1b2c3d4',
            url: `${WEB_ORIGIN}/runtime-config.json`,
            sha256: runtimeDigest,
          },
          webEntry: {
            key: 'index.html',
            versionId: 'web-version_E5f6g7h8',
            url: `${WEB_ORIGIN}/index.html`,
            sha256: '6'.repeat(64),
          },
        },
      })
      return
    }
    if (url.pathname === '/runtime-config.json') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: runtimeConfig,
      })
      return
    }
    const response = await fetchLocalAsset(
      route,
      `http://127.0.0.1:5173${url.pathname}${url.search}`,
    )
    const headers = Object.fromEntries(
      Object.entries(response.headers).filter(
        ([name]) => name !== 'content-encoding' && name !== 'content-length',
      ),
    )
    await route.fulfill({
      status: response.status,
      headers,
      body: response.body,
    })
  })
}

async function fetchLocalAsset(
  route: Parameters<Parameters<Page['route']>[1]>[0],
  url: string,
) {
  let lastError: unknown
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const response = await route.fetch({
        url,
        headers: {
          accept: route.request().headers().accept ?? '*/*',
          'user-agent': route.request().headers()['user-agent'],
        },
      })
      return {
        status: response.status(),
        headers: response.headers(),
        body: await response.body(),
      }
    } catch (error) {
      lastError = error
      await new Promise((resolve) => setTimeout(resolve, 50 * (attempt + 1)))
    }
  }
  throw lastError
}

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`)
    .join(',')}}`
}
