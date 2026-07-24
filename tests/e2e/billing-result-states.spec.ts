import { createHash } from 'node:crypto'
import { expect, test, type Page, type Request } from '@playwright/test'

const webOrigin = 'https://staging.stoaedu.ch'
const checkoutRef = 'checkout-public-ref_123'
const statusPath = `/parents/me/subscription/checkout/${checkoutRef}`

type CheckoutOutcome =
  | 'confirming'
  | 'active'
  | 'not_completed'
  | 'support_needed'

type CheckoutStatus = {
  outcome: CheckoutOutcome | 'unexpected_provider_state'
  newCheckoutAllowed?: boolean
  targetPlan?: 'student' | 'teacher_supported' | 'family'
  beneficiaries?: string[]
  effectivePlan?: 'student' | 'teacher_supported' | 'family' | null
}

test.beforeEach(async ({ page }) => {
  await routeReleaseRuntime(page)
  await installParentAuth(page)
})

test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'ignoreErrors' })
})

test('begins with friendly confirming and renders active only from authoritative status', async ({ page }) => {
  let createCalls = 0
  await page.route(/\/parents\/me\/subscription\/checkout$/, async (route) => {
    createCalls += 1
    await route.fulfill({ status: 500, json: { detail: 'must not create' } })
  })
  await routeCheckoutStatus(page, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1_500))
    await route.fulfill({
      contentType: 'application/json',
      json: checkoutStatus({
        outcome: 'active',
        effectivePlan: 'family',
        beneficiaries: ['Ada Student', 'Ben Student'],
      }),
    })
  })

  const navigation = page.goto(
    `${webOrigin}/billing/checkout/result?checkoutRef=${checkoutRef}&flow=return&plan=student&status=success`,
  )
  await expect(page.getByRole('heading', { name: '正在确认付款' })).toBeVisible()
  await expect(page.getByRole('status')).toContainText('正在向 STOA 确认')
  await navigation

  await expect(page.getByRole('heading', { name: '付款已确认' })).toBeVisible()
  await expect(page.getByText('家庭计划')).toBeVisible()
  await expect(page.getByText('Ada Student')).toBeVisible()
  await expect(page.getByText('Ben Student')).toBeVisible()
  await expect(page.getByRole('link', { name: '查看账单' })).toHaveAttribute('href', '/billing')
  await expect(page.getByRole('link', { name: '返回家长主页' })).toHaveAttribute('href', '/parent')
  expect(createCalls).toBe(0)

  await page.goto(
    `${webOrigin}/billing/checkout/success?checkoutRef=${checkoutRef}&status=success`,
  )
  await expect(page.getByRole('heading', { name: '付款已确认' })).toHaveCount(0)
  expect(createCalls).toBe(0)
})

test('polls only while confirming and stops after a terminal not-completed outcome', async ({ page }) => {
  let statusCalls = 0
  await routeCheckoutStatus(page, async (route) => {
    statusCalls += 1
    const outcome = statusCalls < 3 ? 'confirming' : 'not_completed'
    await route.fulfill({
      contentType: 'application/json',
      json: checkoutStatus({
        outcome,
        newCheckoutAllowed: outcome === 'not_completed',
      }),
    })
  })

  await page.goto(`${webOrigin}/billing/checkout/result?checkoutRef=${checkoutRef}`)
  await expect(page.getByRole('heading', { name: '付款未完成' })).toBeVisible({
    timeout: 8_000,
  })
  const callsAtTerminal = statusCalls
  await page.waitForTimeout(2_500)
  expect(statusCalls).toBe(callsAtTerminal)
  await expect(page.getByRole('status')).toContainText('没有启用任何付费权益')
  await expect(page.getByRole('link', { name: '返回账单' })).toBeVisible()
})

test('bounded confirming recovery rechecks only the same reference and never creates', async ({ page }) => {
  const rechecks: Request[] = []
  let statusCalls = 0
  let createCalls = 0
  await routeCheckoutStatus(page, async (route) => {
    statusCalls += 1
    await route.fulfill({
      contentType: 'application/json',
      json: checkoutStatus({ outcome: 'confirming' }),
    })
  })
  await page.route(/\/parents\/me\/subscription\/checkout$/, async (route) => {
    createCalls += 1
    await route.fulfill({ status: 500, json: { detail: 'must not create' } })
  })
  await page.route(new RegExp(`${statusPath}/recheck$`), async (route) => {
    rechecks.push(route.request())
    await route.fulfill({
      contentType: 'application/json',
      json: checkoutStatus({ outcome: 'support_needed' }),
    })
  })

  await page.goto(`${webOrigin}/billing/checkout/result?checkoutRef=${checkoutRef}`)
  const recheck = page.getByRole('button', { name: '重新检查付款状态' })
  await expect(recheck).toBeVisible({ timeout: 8_000 })
  const callsAtPollLimit = statusCalls
  await page.waitForTimeout(2_500)
  expect(statusCalls).toBe(callsAtPollLimit)

  await recheck.click()
  await expect(page.getByRole('heading', { name: '需要帮助' })).toBeVisible()
  expect(rechecks).toHaveLength(1)
  expect(rechecks[0].method()).toBe('POST')
  expect(rechecks[0].url()).toMatch(new RegExp(`${statusPath}/recheck$`))
  expect(await rechecks[0].postDataJSON()).toEqual({})
  expect(createCalls).toBe(0)
})

for (const scenario of [
  {
    outcome: 'not_completed' as const,
    heading: '付款未完成',
    liveCopy: '没有启用任何付费权益',
  },
  {
    outcome: 'support_needed' as const,
    heading: '需要帮助',
    liveCopy: '请联系 STOA 支持',
  },
]) {
  test(`renders the authoritative ${scenario.outcome} terminal state accessibly`, async ({ page }) => {
    await routeCheckoutStatus(page, async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        json: checkoutStatus({
          outcome: scenario.outcome,
          newCheckoutAllowed: scenario.outcome === 'not_completed',
        }),
      })
    })

    await page.goto(`${webOrigin}/billing/checkout/result?checkoutRef=${checkoutRef}`)
    await expect(page.getByRole('heading', { name: scenario.heading })).toBeVisible()
    await expect(page.getByRole('status')).toContainText(scenario.liveCopy)
    const action = page.getByRole('link', { name: /返回账单|联系支持/ }).first()
    await expect(action).toBeVisible()
    await action.focus()
    await expect(action).toBeFocused()
    await expect(page.getByRole('heading', { name: '付款已确认' })).toHaveCount(0)
  })
}

test('missing, foreign, failed, and unknown references fail closed without URL proof', async ({ page }) => {
  await page.goto(`${webOrigin}/billing/checkout/result?plan=family&status=success`)
  await expect(page.getByRole('heading', { name: '需要帮助' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '付款已确认' })).toHaveCount(0)

  await page.route(
    /\/parents\/me\/subscription\/checkout\/foreign-ref$/,
    async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        json: { detail: { code: 'not_found', message: 'Not found.' } },
      })
    },
  )
  await page.goto(
    `${webOrigin}/billing/checkout/result?checkoutRef=foreign-ref&plan=family&status=success`,
  )
  await expect(page.getByRole('heading', { name: '需要帮助' })).toBeVisible()
  await expect(page.getByText(/not found/i)).toHaveCount(0)

  await routeCheckoutStatus(page, async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: checkoutStatus({ outcome: 'unexpected_provider_state' }),
    })
  })
  await page.goto(`${webOrigin}/billing/checkout/result?checkoutRef=${checkoutRef}`)
  await expect(page.getByRole('heading', { name: '需要帮助' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '付款已确认' })).toHaveCount(0)
})

function checkoutStatus(input: CheckoutStatus) {
  return {
    checkoutRef,
    outcome: input.outcome,
    newCheckoutAllowed: input.newCheckoutAllowed ?? false,
    safeActions: ['recheck_payment', 'contact_support'],
    targetPlan: input.targetPlan ?? 'family',
    beneficiaries: input.beneficiaries ?? ['Ada Student'],
    effectivePlan: input.effectivePlan ?? null,
    lastRecheckedAt: '2026-07-24T00:00:00Z',
  }
}

async function routeCheckoutStatus(
  page: Page,
  handler: Parameters<Page['route']>[1],
) {
  await page.route(new RegExp(`${statusPath}$`), handler)
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
