import { createHash } from 'node:crypto'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { expect, test } from '@playwright/test'

const frontendRoot = new URL('../..', import.meta.url).pathname
const preflightScript = join(frontendRoot, 'scripts', 'stripe-sandbox-preflight.mjs')
const playwrightConfig = join(frontendRoot, 'playwright.config.ts')

const secretCanaries = {
  account: 'acct_phase476_preflight_canary',
  destination: 'we_phase476_preflight_canary',
  key: 'sk_test_phase476_preflight_secret_canary',
  objects: {
    event: 'evt_phase476_canary',
    invoice: 'in_phase476_canary',
    session: 'cs_test_phase476_canary',
    subscription: 'sub_phase476_canary',
  },
  prices: {
    family: 'price_phase476_family_canary',
    student: 'price_phase476_student_canary',
    teacher_supported: 'price_phase476_teacher_canary',
  },
  webhookSecret: 'whsec_phase476_preflight_secret_canary',
}

test('validates the configured sandbox before the acceptance project starts', async ({ browserName }, testInfo) => {
  expect(browserName).toBe('chromium')
  const result = spawnSync(process.execPath, [preflightScript], {
    cwd: frontendRoot,
    encoding: 'utf8',
    env: process.env,
  })

  if (testInfo.project.name === 'stripe-sandbox-preflight') {
    expect(result.status, result.stderr).toBe(0)
    expect(result.stdout).toBe('')
    expect(result.stderr).toBe('')
  } else {
    expect(result.status).not.toBe(0)
    expect(result.stdout).toBe('')
  }
})

test.describe('Phase 476 Stripe sandbox preflight negative controls', () => {
  test('accepts complete test-mode metadata and emits only digested coordinates', () => {
    const result = runPreflight()

    expect(result.status, result.stderr).toBe(0)
    expect(result.stdout).toBe('')
    expect(result.stderr).toBe('')

    const receipt = JSON.parse(readFileSync(result.receiptPath, 'utf8')) as Record<string, unknown>
    expect(receipt).toMatchObject({
      environment: 'staging',
      eventDestinationVersion: '2025-06-30.basil',
      keyMode: 'test',
      mockDisabled: true,
      priceModes: {
        family: 'test',
        student: 'test',
        teacher_supported: 'test',
      },
      routeInterceptionDisabled: true,
      status: 'PASS',
    })
    expect(receipt.webOriginSha256).toBe(sha256('https://staging.stoa.example'))
    expect(receipt.apiOriginSha256).toBe(sha256('https://api.staging.stoa.example'))
    expect(receipt.accountSha256).toBe(sha256(secretCanaries.account))

    const serialized = JSON.stringify(receipt)
    for (const canary of [
      secretCanaries.account,
      secretCanaries.destination,
      secretCanaries.key,
      secretCanaries.webhookSecret,
      ...Object.values(secretCanaries.prices),
      ...Object.values(secretCanaries.objects),
      'https://staging.stoa.example',
      'https://api.staging.stoa.example',
    ]) {
      expect(serialized).not.toContain(canary)
      expect(result.stdout).not.toContain(canary)
      expect(result.stderr).not.toContain(canary)
    }
  })

  for (const [name, override] of [
    ['mock checkout', { VITE_ENABLE_MOCK_CHECKOUT: 'true' }],
    ['demo API', { VITE_ENABLE_DEMO_API: 'true' }],
    ['disabled payment', { VITE_ENABLE_PAYMENT: 'false' }],
    ['demo surfaces', { VITE_SHOW_DEMO_SURFACES: 'true' }],
    ['sandbox evidence relabel', { STOA_STRIPE_SANDBOX: 'false' }],
    ['route interception', { STOA_PLAYWRIGHT_ROUTE_INTERCEPTION: 'true' }],
    ['live key', { STOA_STRIPE_SECRET_KEY: 'sk_live_phase476_forbidden_canary' }],
    ['production mutation', { STOA_ALLOW_PRODUCTION_MUTATION: 'true' }],
    ['localhost API', { STOA_STRIPE_SANDBOX_API_ORIGIN: 'http://127.0.0.1:8000' }],
    ['production Web origin', { STOA_STRIPE_SANDBOX_WEB_ORIGIN: 'https://app.stoa.example' }],
    ['virtual checkout', { STOA_STRIPE_CHECKOUT_ORIGIN: 'https://staging.stoa.example/billing/checkout/demo' }],
    ['unsigned destination', { STOA_STRIPE_EVENT_DESTINATION_SIGNED: 'false' }],
    ['missing signed destination', { STOA_STRIPE_EVENT_DESTINATION_ID: '' }],
    ['missing webhook secret', { STOA_STRIPE_WEBHOOK_SECRET: '' }],
    ['trace capture', { STOA_PLAYWRIGHT_TRACE: 'on' }],
    ['video capture', { STOA_PLAYWRIGHT_VIDEO: 'retain-on-failure' }],
    ['screenshot capture', { STOA_PLAYWRIGHT_SCREENSHOT: 'only-on-failure' }],
    ['missing provider access', { STOA_STRIPE_PROVIDER_ACCESS_VERIFIED: 'false' }],
  ] as const) {
    test(`rejects ${name}`, () => {
      const result = runPreflight(override)

      expect(result.status).not.toBe(0)
      expect(result.receiptExists).toBe(false)
      expect(result.stdout).toBe('')
      expect(result.stderr).not.toContain(secretCanaries.key)
      expect(result.stderr).not.toContain(secretCanaries.webhookSecret)
    })
  }

  for (const objectType of ['price', 'checkout.session', 'invoice', 'subscription', 'event'] as const) {
    test(`rejects live ${objectType} evidence`, () => {
      const metadata = sandboxMetadata()
      const target = metadata.objects.find((entry) => entry.type === objectType)
      if (!target) throw new Error(`missing fixture for ${objectType}`)
      target.livemode = true

      const result = runPreflight({}, metadata)

      expect(result.status).not.toBe(0)
      expect(result.receiptExists).toBe(false)
      expect(result.stdout).toBe('')
      expect(result.stderr).not.toContain(secretCanaries.key)
    })
  }

  test('rejects a missing configured test Price', () => {
    const metadata = sandboxMetadata()
    metadata.objects = metadata.objects.filter(
      (entry) => entry.id !== secretCanaries.prices.teacher_supported,
    )

    const result = runPreflight({}, metadata)

    expect(result.status).not.toBe(0)
    expect(result.receiptExists).toBe(false)
  })

  test('rejects a mismatched event destination version', () => {
    const metadata = sandboxMetadata()
    metadata.eventDestination.apiVersion = '2024-06-20'

    const result = runPreflight({}, metadata)

    expect(result.status).not.toBe(0)
    expect(result.receiptExists).toBe(false)
  })

  test('rejects acceptance source that intercepts or fulfills browser routes', () => {
    const result = runPreflight({}, sandboxMetadata(), `
      test('forbidden mock', async ({ page }) => {
        await page.route('**/checkout', (route) => route.fulfill({ status: 200 }))
      })
    `)

    expect(result.status).not.toBe(0)
    expect(result.receiptExists).toBe(false)
  })

  test('defines a separate fail-closed stripe-sandbox Playwright project', () => {
    const source = readFileSync(playwrightConfig, 'utf8')

    expect(source).toContain("name: 'stripe-sandbox'")
    expect(source).toContain("dependencies: ['stripe-sandbox-preflight']")
    expect(source).toContain('stripe-sandbox-preflight.mjs')
    expect(source).toContain('STOA_STRIPE_SANDBOX')
    const sandboxProject = source.slice(source.lastIndexOf("name: 'stripe-sandbox'"))
    expect(sandboxProject).not.toContain("VITE_ENABLE_MOCK_CHECKOUT: 'true'")
    expect(sandboxProject).toContain('mockCheckout: false')
    expect(sandboxProject).toContain('routeInterception: false')
  })
})

type SandboxObject = {
  id: string
  livemode: boolean
  type: 'checkout.session' | 'event' | 'invoice' | 'price' | 'subscription'
}

type SandboxMetadata = {
  accountId: string
  backendReadiness: {
    accountId: string
    environment: string
    keyMode: string
    reachable: boolean
  }
  enabledPaymentMethods: string[]
  eventDestination: {
    apiVersion: string
    enabled: boolean
    id: string
    signed: boolean
  }
  objects: SandboxObject[]
  providerAccessVerified: boolean
}

function sandboxMetadata(): SandboxMetadata {
  return {
    accountId: secretCanaries.account,
    backendReadiness: {
      accountId: secretCanaries.account,
      environment: 'staging',
      keyMode: 'test',
      reachable: true,
    },
    enabledPaymentMethods: ['card'],
    eventDestination: {
      apiVersion: '2025-06-30.basil',
      enabled: true,
      id: secretCanaries.destination,
      signed: true,
    },
    objects: [
      { id: secretCanaries.prices.student, livemode: false, type: 'price' },
      { id: secretCanaries.prices.teacher_supported, livemode: false, type: 'price' },
      { id: secretCanaries.prices.family, livemode: false, type: 'price' },
      { id: secretCanaries.objects.session, livemode: false, type: 'checkout.session' },
      { id: secretCanaries.objects.invoice, livemode: false, type: 'invoice' },
      { id: secretCanaries.objects.subscription, livemode: false, type: 'subscription' },
      { id: secretCanaries.objects.event, livemode: false, type: 'event' },
    ],
    providerAccessVerified: true,
  }
}

function runPreflight(
  overrides: Record<string, string> = {},
  metadata: SandboxMetadata = sandboxMetadata(),
  acceptanceSource = "test('hosted Stripe checkout acceptance', async ({ page }) => page.goto('/billing'))\n",
) {
  const evidenceDirectory = mkdtempSync(join(tmpdir(), 'stoa-stripe-sandbox-preflight-'))
  const acceptanceSpecPath = join(evidenceDirectory, 'billing-paid-access.spec.ts')
  const metadataPath = join(evidenceDirectory, 'provider-metadata.json')
  const receiptPath = join(evidenceDirectory, 'preflight-receipt.json')
  writeFileSync(acceptanceSpecPath, acceptanceSource)
  writeFileSync(metadataPath, JSON.stringify(metadata))

  const env = {
    ...process.env,
    CI: 'true',
    STOA_ALLOW_PRODUCTION_MUTATION: 'false',
    STOA_EVIDENCE_OUTPUT_DIR: evidenceDirectory,
    STOA_PLAYWRIGHT_ROUTE_INTERCEPTION: 'false',
    STOA_PLAYWRIGHT_SCREENSHOT: 'off',
    STOA_PLAYWRIGHT_TRACE: 'off',
    STOA_PLAYWRIGHT_VIDEO: 'off',
    STOA_STRIPE_ACCOUNT_ID: secretCanaries.account,
    STOA_STRIPE_ACCEPTANCE_SPEC_PATH: acceptanceSpecPath,
    STOA_STRIPE_APPROVED_API_ORIGIN: 'https://api.staging.stoa.example',
    STOA_STRIPE_APPROVED_WEB_ORIGIN: 'https://staging.stoa.example',
    STOA_STRIPE_CHECKOUT_ORIGIN: 'https://checkout.stripe.com',
    STOA_STRIPE_ENABLED_PAYMENT_METHODS: 'card',
    STOA_STRIPE_EVENT_DESTINATION_ID: secretCanaries.destination,
    STOA_STRIPE_EVENT_DESTINATION_API_VERSION: '2025-06-30.basil',
    STOA_STRIPE_EVENT_DESTINATION_SIGNED: 'true',
    STOA_STRIPE_FAMILY_PRICE_ID: secretCanaries.prices.family,
    STOA_STRIPE_PROVIDER_ACCESS_VERIFIED: 'true',
    STOA_STRIPE_SANDBOX: 'true',
    STOA_STRIPE_SANDBOX_API_ORIGIN: 'https://api.staging.stoa.example',
    STOA_STRIPE_SANDBOX_ENVIRONMENT: 'staging',
    STOA_STRIPE_SANDBOX_METADATA_PATH: metadataPath,
    STOA_STRIPE_SANDBOX_RECEIPT_PATH: receiptPath,
    STOA_STRIPE_SANDBOX_WEB_ORIGIN: 'https://staging.stoa.example',
    STOA_STRIPE_SECRET_KEY: secretCanaries.key,
    STOA_STRIPE_STUDENT_PRICE_ID: secretCanaries.prices.student,
    STOA_STRIPE_TEACHER_SUPPORTED_PRICE_ID: secretCanaries.prices.teacher_supported,
    STOA_STRIPE_WEBHOOK_SECRET: secretCanaries.webhookSecret,
    VITE_ENABLE_DEMO_API: 'false',
    VITE_ENABLE_MOCK_CHECKOUT: 'false',
    VITE_ENABLE_PAYMENT: 'true',
    VITE_SHOW_DEMO_SURFACES: 'false',
    ...overrides,
  }

  const result = spawnSync(process.execPath, [preflightScript], {
    cwd: frontendRoot,
    encoding: 'utf8',
    env,
  })

  return {
    receiptExists: existsSync(receiptPath),
    receiptPath,
    status: result.status,
    stderr: result.stderr,
    stdout: result.stdout,
  }
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
