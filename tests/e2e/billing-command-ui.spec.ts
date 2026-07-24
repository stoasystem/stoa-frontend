import { createHash } from 'node:crypto'
import { expect, test, type Page, type Request } from '@playwright/test'

const operationStorageKey = 'stoa.billing.checkout.v1'
const webOrigin = 'https://staging.stoaedu.ch'

test.beforeEach(async ({ page }) => {
  await routeReleaseRuntime(page)
  await installParentAuth(page)
  await routeBillingShell(page)
})

test('repeat click and refresh retain one logical checkout key and reference', async ({ page }) => {
  const creates: Request[] = []

  await page.route(/\/parents\/me\/subscription\/checkout$/, async (route) => {
    creates.push(route.request())
    await new Promise((resolve) => setTimeout(resolve, 150))
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      json: checkoutCreateResponse('checkout-ref-1', '/billing?plan=family'),
    })
  })
  await routeCheckoutStatus(page, 'checkout-ref-1', {
    outcome: 'confirming',
    newCheckoutAllowed: false,
    targetPlan: 'family',
    beneficiaries: ['student-1', 'student-2'],
  })

  await page.goto(`${webOrigin}/billing?plan=family`)
  await selectBeneficiary(page, 'Ada Student')
  await selectBeneficiary(page, 'Ben Student')

  const start = page.getByRole('button', { name: /start checkout/i })
  await start.dblclick()
  await expect.poll(() => creates.length).toBe(1)
  await expect(page).toHaveURL(/\/billing\?plan=family/)

  const request = creates[0]
  expect(await request.postDataJSON()).toEqual({
    plan: 'family',
    beneficiaryIds: ['student-1', 'student-2'],
  })
  expect(Object.keys(await request.postDataJSON()).sort()).toEqual(['beneficiaryIds', 'plan'])
  const idempotencyKey = request.headers()['idempotency-key']
  expect(idempotencyKey).toBeTruthy()

  const storedBeforeRefresh = await readStoredOperation(page)
  expect(storedBeforeRefresh).toEqual({
    idempotencyKey,
    checkoutRef: 'checkout-ref-1',
  })

  await page.reload()
  await expect(page.getByTestId('checkout-open-command')).toBeVisible()
  expect(await readStoredOperation(page)).toEqual(storedBeforeRefresh)
  expect(creates).toHaveLength(1)
})

test('client timeout retry reuses the same logical key', async ({ page }) => {
  const keys: string[] = []
  let attempt = 0

  await page.route(/\/parents\/me\/subscription\/checkout$/, async (route) => {
    attempt += 1
    keys.push(route.request().headers()['idempotency-key'])
    if (attempt === 1) {
      await route.abort('timedout')
      return
    }
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      json: checkoutCreateResponse('checkout-ref-retried', '/billing?plan=student'),
    })
  })
  await routeCheckoutStatus(page, 'checkout-ref-retried', {
    outcome: 'confirming',
    newCheckoutAllowed: false,
    targetPlan: 'student',
    beneficiaries: ['student-1'],
  })

  await page.goto(`${webOrigin}/billing?plan=student`)
  await selectBeneficiary(page, 'Ada Student')
  await page.getByRole('button', { name: /start checkout/i }).click()
  await expect(page.getByTestId('checkout-error')).toBeVisible()
  expect(await readStoredOperation(page)).toEqual({ idempotencyKey: keys[0] })

  await page.getByRole('button', { name: /retry checkout/i }).click()
  await expect.poll(() => keys.length).toBe(2)
  expect(keys[0]).toBeTruthy()
  expect(keys[1]).toBe(keys[0])
  expect(await readStoredOperation(page)).toEqual({
    idempotencyKey: keys[0],
    checkoutRef: 'checkout-ref-retried',
  })
})

test('free trial and invalid beneficiary counts cannot create checkout', async ({ page }) => {
  let createCount = 0
  await page.route(/\/parents\/me\/subscription\/checkout$/, async (route) => {
    createCount += 1
    await route.fulfill({ status: 500, json: { detail: 'must not be called' } })
  })

  await page.goto(`${webOrigin}/billing?plan=free_trial`)
  await expect(page.getByRole('button', { name: /free trial does not require checkout/i })).toBeDisabled()

  await page.goto(`${webOrigin}/billing?plan=student`)
  await selectBeneficiary(page, 'Ada Student')
  await selectBeneficiary(page, 'Ben Student')
  await expect(page.getByRole('button', { name: /select exactly one beneficiary/i })).toBeDisabled()

  await page.goto(`${webOrigin}/billing?plan=family`)
  await expect(page.getByRole('button', { name: /select 1 to 3 beneficiaries/i })).toBeDisabled()
  expect(createCount).toBe(0)
})

test('changed pending intent requires confirmation and supersedes only after confirm', async ({ page }) => {
  await installStoredOperation(page, {
    idempotencyKey: 'original-logical-key',
    checkoutRef: 'checkout-ref-original',
  })
  await routeCheckoutStatus(page, 'checkout-ref-original', {
    outcome: 'confirming',
    newCheckoutAllowed: false,
    targetPlan: 'student',
    beneficiaries: ['student-1'],
  })

  const supersedeRequests: Request[] = []
  await page.route(
    /\/parents\/me\/subscription\/checkout\/checkout-ref-original\/supersede$/,
    async (route) => {
      supersedeRequests.push(route.request())
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: checkoutCreateResponse('checkout-ref-successor', '/billing?plan=teacher_supported'),
      })
    },
  )
  await routeCheckoutStatus(page, 'checkout-ref-successor', {
    outcome: 'confirming',
    newCheckoutAllowed: false,
    targetPlan: 'teacher_supported',
    beneficiaries: ['student-2'],
  })

  await page.goto(`${webOrigin}/billing?plan=teacher_supported`)
  await selectBeneficiary(page, 'Ben Student')
  await page.getByRole('button', { name: /change pending checkout/i }).click()
  await expect(page.getByTestId('checkout-supersession-confirmation')).toBeVisible()
  await page.getByRole('button', { name: /keep original checkout/i }).click()
  expect(supersedeRequests).toHaveLength(0)
  expect(await readStoredOperation(page)).toEqual({
    idempotencyKey: 'original-logical-key',
    checkoutRef: 'checkout-ref-original',
  })

  await page.getByRole('button', { name: /change pending checkout/i }).click()
  await page.getByRole('button', { name: /confirm plan change/i }).click()
  await expect.poll(() => supersedeRequests.length).toBe(1)

  const request = supersedeRequests[0]
  expect(await request.postDataJSON()).toEqual({
    confirmed: true,
    plan: 'teacher_supported',
    beneficiaryIds: ['student-2'],
  })
  expect(request.headers()['idempotency-key']).toBeTruthy()
  expect(request.headers()['idempotency-key']).not.toBe('original-logical-key')
  expect(await readStoredOperation(page)).toEqual({
    idempotencyKey: request.headers()['idempotency-key'],
    checkoutRef: 'checkout-ref-successor',
  })
})

test('backend failure cannot become demo, virtual, or static checkout success', async ({ page }) => {
  let createCount = 0
  await page.route(/\/parents\/me\/subscription\/checkout$/, async (route) => {
    createCount += 1
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      json: {
        detail: {
          code: 'checkout_temporarily_unavailable',
          message: 'Checkout is temporarily unavailable.',
        },
      },
    })
  })

  await page.goto(`${webOrigin}/billing?plan=student`)
  await selectBeneficiary(page, 'Ada Student')
  await page.getByRole('button', { name: /start checkout/i }).click()

  await expect(page.getByTestId('checkout-error')).toContainText(/temporarily unavailable/i)
  await expect(page).toHaveURL(/\/billing\?plan=student/)
  expect(page.url()).not.toMatch(/demo|success/)
  expect(createCount).toBe(1)
  expect(Object.keys(await readStoredOperation(page))).toEqual(['idempotencyKey'])
})

async function routeBillingShell(page: Page) {
  await page.route(/\/parents\/me\/subscription$/, async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: {
        parentId: 'parent-1',
        currentTier: 'free',
        plans: {},
        pendingRequest: null,
        billing: {},
        effectiveEntitlements: [],
      },
    })
  })
  await page.route(/\/parents\/me\/children$/, async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: {
        items: [
          parentChild('student-1', 'Ada Student'),
          parentChild('student-2', 'Ben Student'),
          parentChild('student-3', 'Cara Student'),
        ],
      },
    })
  })
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
    web: { origin: webOrigin },
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

  await page.route(`${webOrigin}/**`, async (route) => {
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
            url: `${webOrigin}/runtime-config.json`,
            sha256: runtimeDigest,
          },
          webEntry: {
            key: 'index.html',
            versionId: 'web-version_E5f6g7h8',
            url: `${webOrigin}/index.html`,
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
    const response = await route.fetch({
      url: `http://127.0.0.1:5173${url.pathname}${url.search}`,
    })
    await route.fulfill({ response })
  })
}

async function installParentAuth(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('stoa_access_token', 'e2e-parent-token')
  })
}

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) =>
    `${JSON.stringify(key)}:${canonicalize(record[key])}`).join(',')}}`
}

async function routeCheckoutStatus(
  page: Page,
  checkoutRef: string,
  input: {
    outcome: 'confirming' | 'active' | 'not_completed' | 'support_needed'
    newCheckoutAllowed: boolean
    targetPlan: 'student' | 'teacher_supported' | 'family'
    beneficiaries: string[]
  },
) {
  await page.route(
    new RegExp(`/parents/me/subscription/checkout/${checkoutRef}$`),
    async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        json: {
          checkoutRef,
          outcome: input.outcome,
          newCheckoutAllowed: input.newCheckoutAllowed,
          safeActions: ['recheck_payment', 'contact_support'],
          targetPlan: input.targetPlan,
          beneficiaries: input.beneficiaries,
          effectivePlan: null,
          lastRecheckedAt: '2026-07-24T00:00:00Z',
        },
      })
    },
  )
}

function checkoutCreateResponse(checkoutRef: string, checkoutUrl: string) {
  return {
    checkoutRef,
    commandState: 'provider_session_open',
    checkoutSessionId: `cs_test_${checkoutRef}`,
    checkoutUrl,
    safeActions: ['recheck_payment', 'contact_support'],
    targetPlan: 'family',
    beneficiaries: ['student-1', 'student-2'],
  }
}

function parentChild(id: string, name: string) {
  return {
    id,
    userId: id,
    name,
    email: `${id}@test.com`,
    grade: '7',
    subjects: ['math'],
    relationship: 'child',
  }
}

async function selectBeneficiary(page: Page, name: string) {
  await page.getByRole('checkbox', { name }).click()
}

async function installStoredOperation(
  page: Page,
  value: { idempotencyKey: string; checkoutRef?: string },
) {
  await page.addInitScript(
    ([key, operation]) => {
      window.sessionStorage.setItem(key, JSON.stringify(operation))
    },
    [operationStorageKey, value] as const,
  )
}

async function readStoredOperation(page: Page) {
  return page.evaluate((key) => {
    const value = window.sessionStorage.getItem(key)
    return value ? JSON.parse(value) : null
  }, operationStorageKey)
}
