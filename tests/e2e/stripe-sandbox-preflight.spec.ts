import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
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
  prices: {
    family: 'price_phase476_family_canary',
    student: 'price_phase476_student_canary',
    teacher_supported: 'price_phase476_teacher_canary',
  },
  webhookSecret: 'whsec_phase476_preflight_secret_canary',
}

test.describe('Phase 476 Stripe sandbox preflight negative controls', () => {
  test('accepts complete test-mode metadata and emits only digested coordinates', () => {
    const result = runPreflight()

    expect(result.status).toBe(0)
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
    ['route interception', { STOA_PLAYWRIGHT_ROUTE_INTERCEPTION: 'true' }],
    ['live key', { STOA_STRIPE_SECRET_KEY: 'sk_live_phase476_forbidden_canary' }],
    ['production mutation', { STOA_ALLOW_PRODUCTION_MUTATION: 'true' }],
    ['localhost API', { STOA_STRIPE_SANDBOX_API_ORIGIN: 'http://127.0.0.1:8000' }],
    ['production Web origin', { STOA_STRIPE_SANDBOX_WEB_ORIGIN: 'https://app.stoa.example' }],
    ['virtual checkout', { STOA_STRIPE_CHECKOUT_ORIGIN: 'https://staging.stoa.example/billing/checkout/demo' }],
    ['unsigned destination', { STOA_STRIPE_EVENT_DESTINATION_SIGNED: 'false' }],
    ['missing webhook secret', { STOA_STRIPE_WEBHOOK_SECRET: '' }],
    ['trace capture', { STOA_PLAYWRIGHT_TRACE: 'on' }],
    ['video capture', { STOA_PLAYWRIGHT_VIDEO: 'retain-on-failure' }],
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

  test('rejects missing Price and mismatched event destination version', () => {
    const metadata = sandboxMetadata()
    metadata.objects = metadata.objects.filter(
      (entry) => entry.id !== secretCanaries.prices.teacher_supported,
    )
    metadata.eventDestination.apiVersion = '2024-06-20'

    const result = runPreflight({}, metadata)

    expect(result.status).not.toBe(0)
    expect(result.receiptExists).toBe(false)
  })

  test('defines a separate fail-closed stripe-sandbox Playwright project', () => {
    const source = readFileSync(playwrightConfig, 'utf8')

    expect(source).toContain("name: 'stripe-sandbox'")
    expect(source).toContain("dependencies: ['stripe-sandbox-preflight']")
    expect(source).toContain('stripe-sandbox-preflight.mjs')
    expect(source).toContain('STOA_STRIPE_SANDBOX')
    expect(source).not.toMatch(/stripe-sandbox[\s\S]{0,800}VITE_ENABLE_MOCK_CHECKOUT:\s*'true'/)
  })
})

type SandboxObject = {
  id: string
  livemode: boolean
  type: 'checkout.session' | 'event' | 'invoice' | 'price' | 'subscription'
}

type SandboxMetadata = {
  accountId: string
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
      { id: 'cs_test_phase476_canary', livemode: false, type: 'checkout.session' },
      { id: 'in_phase476_canary', livemode: false, type: 'invoice' },
      { id: 'sub_phase476_canary', livemode: false, type: 'subscription' },
      { id: 'evt_phase476_canary', livemode: false, type: 'event' },
    ],
    providerAccessVerified: true,
  }
}

function runPreflight(
  overrides: Record<string, string> = {},
  metadata: SandboxMetadata = sandboxMetadata(),
) {
  const evidenceDirectory = mkdtempSync(join(tmpdir(), 'stoa-stripe-sandbox-preflight-'))
  const metadataPath = join(evidenceDirectory, 'provider-metadata.json')
  const receiptPath = join(evidenceDirectory, 'preflight-receipt.json')
  writeFileSync(metadataPath, JSON.stringify(metadata))

  const env = {
    ...process.env,
    CI: 'true',
    STOA_ALLOW_PRODUCTION_MUTATION: 'false',
    STOA_EVIDENCE_OUTPUT_DIR: evidenceDirectory,
    STOA_PLAYWRIGHT_ROUTE_INTERCEPTION: 'false',
    STOA_PLAYWRIGHT_TRACE: 'off',
    STOA_PLAYWRIGHT_VIDEO: 'off',
    STOA_STRIPE_CHECKOUT_ORIGIN: 'https://checkout.stripe.com',
    STOA_STRIPE_EVENT_DESTINATION_API_VERSION: '2025-06-30.basil',
    STOA_STRIPE_EVENT_DESTINATION_SIGNED: 'true',
    STOA_STRIPE_FAMILY_PRICE_ID: secretCanaries.prices.family,
    STOA_STRIPE_PROVIDER_ACCESS_VERIFIED: 'true',
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
    receiptExists: result.status === 0 && receiptPath.length > 0,
    receiptPath,
    status: result.status,
    stderr: result.stderr,
    stdout: result.stdout,
  }
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
