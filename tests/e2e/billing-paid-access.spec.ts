import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test, type Page } from '@playwright/test'

type JsonObject = Record<string, unknown>

const frontendRoot = resolve(new URL('../..', import.meta.url).pathname)
const testCardNumber = '4242424242424242'

test('phase476 real hosted checkout converges signed facts and role projections exactly once', async ({
  page,
}, testInfo) => {
  expect(testInfo.project.name).toBe('stripe-sandbox')
  const webOrigin = requiredOrigin('STOA_STRIPE_SANDBOX_WEB_ORIGIN')
  const apiOrigin = requiredOrigin('STOA_STRIPE_SANDBOX_API_ORIGIN')
  const backendRoot = resolve(requiredEnv('STOA_PHASE476_BACKEND_ROOT'))
  const observationPath = resolve(requiredEnv('STOA_PHASE476_OBSERVATION_PATH'))
  const preflightPath = resolve(requiredEnv('STOA_STRIPE_SANDBOX_RECEIPT_PATH'))
  const redeliveryPath = resolve(requiredEnv('STOA_PHASE476_SIGNED_REDELIVERY_RECEIPT_PATH'))
  const beneficiaries = requiredJsonArray('STOA_STRIPE_SANDBOX_BENEFICIARY_LABELS')

  const parent = await login(
    page,
    webOrigin,
    requiredEnv('STOA_STRIPE_SANDBOX_PARENT_EMAIL'),
    requiredEnv('STOA_STRIPE_SANDBOX_PARENT_PASSWORD'),
  )
  expect(parent.role).toBe('parent')

  for (const plan of ['student', 'teacher_supported', 'family']) {
    await page.goto(`${webOrigin}/billing?plan=${plan}`)
    await expect(page.getByText(new RegExp(plan.replace('_', ' '), 'i')).first()).toBeVisible()
  }
  await page.goto(`${webOrigin}/billing?plan=family`)
  for (const beneficiary of beneficiaries) {
    await page.getByLabel(beneficiary, { exact: true }).check()
  }

  const checkoutResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST'
      && new URL(response.url()).pathname.endsWith('/parents/me/subscription/checkout'),
  )
  await page.getByRole('button', { name: 'Start checkout' }).dblclick()
  const checkoutResponse = await checkoutResponsePromise
  expect(checkoutResponse.status()).toBe(201)
  const checkout = await jsonObject(checkoutResponse)
  const checkoutRef = requiredString(checkout.checkoutRef, 'checkoutRef')
  const checkoutSessionId = requiredString(checkout.checkoutSessionId, 'checkoutSessionId')
  const checkoutUrl = new URL(requiredString(checkout.checkoutUrl, 'checkoutUrl'))
  expect(checkoutUrl.origin).toBe('https://checkout.stripe.com')
  expect(checkoutSessionId.startsWith('cs_test_')).toBe(true)
  const idempotencyKey = checkoutResponse.request().headers()['idempotency-key']
  expect(idempotencyKey).toBeTruthy()

  await page.waitForURL((url) => url.origin === 'https://checkout.stripe.com')
  await fillHostedCheckout(page)
  await page.getByRole('button', { name: /subscribe|pay/i }).click()
  await page.waitForURL(
    (url) => url.origin === webOrigin && url.pathname === '/billing/checkout/result',
    { timeout: 60_000 },
  )
  expect(new URL(page.url()).searchParams.get('checkoutRef')).toBe(checkoutRef)
  await expect(page.getByRole('heading', { name: '正在确认付款' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '付款已确认' })).toBeVisible({
    timeout: 60_000,
  })

  await page.reload()
  await expect(page.getByRole('heading', { name: '付款已确认' })).toBeVisible()
  await page.getByRole('link', { name: '查看账单' }).click()
  const parentProjectionText = await page.locator('main').innerText()
  const parentToken = await accessToken(page)
  const parentBilling = await authenticatedJson(
    page,
    `${apiOrigin}/parents/me/subscription/billing`,
    parentToken,
  )

  await clearBrowserAuth(page)
  const admin = await login(
    page,
    webOrigin,
    requiredEnv('STOA_STRIPE_SANDBOX_ADMIN_EMAIL'),
    requiredEnv('STOA_STRIPE_SANDBOX_ADMIN_PASSWORD'),
  )
  expect(admin.role).toBe('admin')
  await page.goto(
    `${webOrigin}/admin/account-operations?parentId=${encodeURIComponent(parent.id)}`
    + `&checkoutRef=${encodeURIComponent(checkoutRef)}`,
  )
  await expect(page.getByRole('heading', { name: 'Parent support console' })).toBeVisible()
  await expect(page.getByText('Authoritative billing facts')).toBeVisible()
  await expect(page.getByText('Signed test-mode evidence').first()).toBeVisible()
  const adminProjectionText = await page.locator('main').innerText()
  const adminToken = await accessToken(page)
  const adminDetail = await authenticatedJson(
    page,
    `${apiOrigin}/admin/billing/checkouts/${encodeURIComponent(checkoutRef)}`
    + `?parentId=${encodeURIComponent(parent.id)}&detail=true`,
    adminToken,
  )

  const recheckOne = await authenticatedPost(
    page,
    `${apiOrigin}/admin/billing/checkouts/${encodeURIComponent(checkoutRef)}/recheck`
    + `?parentId=${encodeURIComponent(parent.id)}`,
    adminToken,
  )
  const recheckTwo = await authenticatedPost(
    page,
    `${apiOrigin}/admin/billing/checkouts/${encodeURIComponent(checkoutRef)}/recheck`
    + `?parentId=${encodeURIComponent(parent.id)}`,
    adminToken,
  )
  expect(recheckOne.checkoutRef).toBe(checkoutRef)
  expect(recheckTwo.checkoutRef).toBe(checkoutRef)

  const redelivery = readJson(redeliveryPath)
  expect(redelivery.schema).toBe('phase476.stripe_sandbox.redelivery.v1')
  expect(redelivery.checkoutRef).toBe(checkoutRef)
  expect(redelivery.checkoutSessionId).toBe(checkoutSessionId)
  expect(redelivery.deliverySource).toBe('stripe_workbench')
  expect(redelivery.signed).toBe(true)
  expect(redelivery.duplicateDeliveryObserved).toBe(true)
  expect(redelivery.outOfOrderObserved).toBe(true)

  const factLifecycle = requiredArray(adminDetail.factLifecycle, 'factLifecycle')
  expect(factLifecycle.some((fact) => isFact(fact, 'invoice_paid'))).toBe(true)
  expect(factLifecycle.some((fact) => isFact(fact, 'subscription_active'))).toBe(true)
  const grantVersions = requiredObject(adminDetail.grantVersion, 'grantVersion')
  const allowanceVersions = requiredObject(adminDetail.allowanceVersion, 'allowanceVersion')
  expect(Object.keys(grantVersions).sort()).toEqual(Object.keys(allowanceVersions).sort())
  expect(Object.values(grantVersions).every((value) => value === 1)).toBe(true)
  expect(Object.values(allowanceVersions).every((value) => value === 1)).toBe(true)

  const collectorPath = resolve(backendRoot, 'scripts/capture_phase476_sandbox_evidence.py')
  const acceptancePath = resolve(frontendRoot, 'tests/e2e/billing-paid-access.spec.ts')
  const preflight = readJson(preflightPath)
  const observation = {
    schema: 'phase476.stripe_sandbox.observation.v1',
    runId: requiredString(redelivery.runId, 'redelivery.runId'),
    observedAt: new Date().toISOString(),
    source: {
      backendSha: gitSha(backendRoot),
      frontendSha: gitSha(frontendRoot),
      acceptanceSourceSha256: sha256File(acceptancePath),
      collectorSourceSha256: sha256File(collectorPath),
      preflightReceiptSha256: sha256File(preflightPath),
    },
    browser: {
      project: 'stripe-sandbox',
      hostedCheckoutOrigin: checkoutUrl.origin,
      mockCheckout: false,
      routeInterception: false,
      returnStates: ['confirming', 'active'],
      createAttempts: 2,
      recheckAttempts: 2,
      parentProjectionSha256: sha256Text(parentProjectionText),
      adminProjectionSha256: sha256Text(adminProjectionText),
      projectionsAgree:
        parentBilling.effectivePlan === adminDetail.targetPlan
        && canonicalObjectKeys(parentBilling.grants) === canonicalObjectKeys(grantVersions),
      adminProjectionRedacted:
        !adminProjectionText.includes(checkoutSessionId)
        && !adminProjectionText.includes(requiredString(redelivery.invoiceId, 'invoiceId'))
        && !adminProjectionText.includes(requiredString(redelivery.subscriptionId, 'subscriptionId')),
    },
    provider: {
      environment: preflight.environment,
      keyMode: preflight.keyMode,
      livemode: false,
      priceModes: preflight.priceModes,
      checkoutSessionId,
      invoiceId: requiredString(redelivery.invoiceId, 'invoiceId'),
      subscriptionId: requiredString(redelivery.subscriptionId, 'subscriptionId'),
      eventIds: requiredArray(redelivery.eventIds, 'eventIds'),
      signedEventDestination: redelivery.signed,
      webhookSignaturesVerified: factLifecycle.every(
        (fact) => requiredObject(fact, 'fact').signatureVerified === true,
      ),
      eventDestinationVersion: preflight.eventDestinationVersion,
      redeliverySource: redelivery.deliverySource,
      redeliveryObserved: redelivery.redeliveryObserved,
      outOfOrderObserved: redelivery.outOfOrderObserved,
      duplicateDeliveryObserved: redelivery.duplicateDeliveryObserved,
    },
    operation: {
      checkoutRef,
      idempotencyKeyDigest: sha256Text(idempotencyKey),
      checkoutCommandCount: redelivery.checkoutCommandCount,
      checkoutSessionCount: redelivery.checkoutSessionCount,
      activationCount: redelivery.activationCount,
      activationVersion: redelivery.activationVersion,
      grantVersions,
      allowanceVersions,
      supportStateVersions: requiredObject(redelivery.supportStateVersions, 'supportStateVersions'),
      factLifecycle,
    },
    safety: {
      liveChargeCount: redelivery.liveChargeCount,
      productionMutationCount: redelivery.productionMutationCount,
      testChargeCount: redelivery.testChargeCount,
      containsSecrets: false,
      containsPii: false,
    },
  }
  writeFileSync(observationPath, `${JSON.stringify(observation)}\n`, {
    encoding: 'utf8',
    flag: 'wx',
    mode: 0o600,
  })
})

async function login(page: Page, webOrigin: string, email: string, password: string) {
  const responsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST'
      && new URL(response.url()).pathname.endsWith('/auth/login'),
  )
  await page.goto(`${webOrigin}/login`)
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole('button', { name: /sign in|log in/i }).click()
  const response = await responsePromise
  expect(response.status()).toBe(200)
  const payload = await jsonObject(response)
  return requiredObject(payload.user, 'login user') as { id: string; role: string }
}

async function fillHostedCheckout(page: Page) {
  const cardNumber = page.getByLabel(/card number/i)
  await cardNumber.fill(testCardNumber)
  await page.getByLabel(/expiration|expiry/i).fill('1234')
  await page.getByLabel(/security code|cvc/i).fill('123')
  const cardholder = page.getByLabel(/cardholder name/i)
  if (await cardholder.count()) await cardholder.fill('STOA Sandbox')
}

async function accessToken(page: Page) {
  const token = await page.evaluate(() => window.localStorage.getItem('access_token'))
  return requiredString(token, 'access token')
}

async function clearBrowserAuth(page: Page) {
  await page.context().clearCookies()
  await page.evaluate(() => window.localStorage.clear())
}

async function authenticatedJson(page: Page, url: string, token: string) {
  const response = await page.request.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  expect(response.status()).toBe(200)
  return jsonObject(response)
}

async function authenticatedPost(page: Page, url: string, token: string) {
  const response = await page.request.post(url, {
    data: {},
    headers: { Authorization: `Bearer ${token}` },
  })
  expect(response.status()).toBe(200)
  return jsonObject(response)
}

async function jsonObject(response: { json(): Promise<unknown> }) {
  return requiredObject(await response.json(), 'JSON response')
}

function requiredEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`${name}_REQUIRED`)
  return value
}

function requiredOrigin(name: string) {
  const value = new URL(requiredEnv(name))
  if (value.protocol !== 'https:' || value.username || value.password || value.pathname !== '/') {
    throw new Error(`${name}_INVALID`)
  }
  return value.origin
}

function requiredJsonArray(name: string) {
  const value = JSON.parse(requiredEnv(name))
  if (!Array.isArray(value) || value.length < 1 || value.length > 3) {
    throw new Error(`${name}_INVALID`)
  }
  return value.map((entry) => requiredString(entry, name))
}

function requiredString(value: unknown, field: string) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field}_INVALID`)
  return value
}

function requiredObject(value: unknown, field: string): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${field}_INVALID`)
  }
  return value as JsonObject
}

function requiredArray(value: unknown, field: string): unknown[] {
  if (!Array.isArray(value) || value.length === 0) throw new Error(`${field}_INVALID`)
  return value
}

function readJson(path: string) {
  return requiredObject(JSON.parse(readFileSync(path, 'utf8')), path)
}

function sha256File(path: string) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

function sha256Text(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

function gitSha(root: string) {
  return execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: root,
    encoding: 'utf8',
  }).trim()
}

function isFact(value: unknown, kind: string) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const fact = value as JsonObject
  return (
    fact.kind === kind
    && fact.signatureVerified === true
    && fact.providerLivemode === false
  )
}

function canonicalObjectKeys(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => requiredObject(entry, 'grant').beneficiaryId)
      .sort()
      .join('\u0000')
  }
  return Object.keys(requiredObject(value, 'version map')).sort().join('\u0000')
}
