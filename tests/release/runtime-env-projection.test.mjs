import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath, URL } from 'node:url'
import { TextEncoder } from 'node:util'
import ts from 'typescript'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const runtimeConfigPath = path.join(repoRoot, 'src/lib/runtimeConfig.ts')
const projectionPath = path.join(repoRoot, 'src/lib/env.ts')
let moduleSequence = 0

function compileTypeScript(source, fileName) {
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2020,
    },
    fileName,
    reportDiagnostics: true,
  })
  const errors = (compiled.diagnostics ?? []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  )
  assert.deepEqual(errors, [])
  return compiled.outputText
}

function moduleUrl(source, label) {
  moduleSequence += 1
  return `data:text/javascript;base64,${Buffer.from(source).toString('base64')}#${label}-${moduleSequence}`
}

async function projectionHarness() {
  const runtimeSource = await readFile(runtimeConfigPath, 'utf8')
  const projectionSource = await readFile(projectionPath, 'utf8')
  const runtimeUrl = moduleUrl(
    compileTypeScript(runtimeSource, runtimeConfigPath),
    'runtime-config',
  )
  const runtime = await import(runtimeUrl)
  const testableProjection = projectionSource
    .replace(
      /import \{ DEFAULT_API_BASE_URL \} from ['"]@\/lib\/constants['"]/,
      "const DEFAULT_API_BASE_URL = 'http://localhost:8000'",
    )
    .replace(
      /from ['"]@\/lib\/runtimeConfig['"]/,
      `from ${JSON.stringify(runtimeUrl)}`,
    )
    .replaceAll('import.meta.env', '({})')
  const projectionOutput = compileTypeScript(testableProjection, projectionPath)

  return {
    projectionSource,
    projectionOutput,
    runtime,
    importProjection: () => import(moduleUrl(projectionOutput, 'env-projection')),
  }
}

const sha = (character) => character.repeat(64)

const ENVIRONMENTS = {
  staging: {
    webOrigin: 'https://staging.stoaedu.ch',
    apiOrigin: 'https://api-staging.stoaedu.ch',
  },
  'staging-pilot': {
    webOrigin: 'https://pilot.staging.stoaedu.ch',
    apiOrigin: 'https://api-pilot.staging.stoaedu.ch',
  },
  production: {
    webOrigin: 'https://stoaedu.ch',
    apiOrigin: 'https://api.stoaedu.ch',
  },
}

function validConfig(environment, overrides = {}) {
  const origins = ENVIRONMENTS[environment]
  const realtimeEnabled = overrides.realtimeEnabled ?? true
  return {
    schema: 'stoa.web.runtime-config.v1',
    environment,
    release: {
      releaseId: sha('1'),
      manifestSha256: sha('2'),
      frontendArtifactSha256: sha('3'),
      backendArtifactSha256: sha('4'),
    },
    web: { origin: origins.webOrigin },
    api: { origin: origins.apiOrigin },
    auth: { mode: 'backend-api' },
    realtime: {
      enabled: realtimeEnabled,
      endpoint: realtimeEnabled ? `wss://${new URL(origins.apiOrigin).host}/realtime` : null,
    },
    features: {
      analytics: overrides.analytics ?? false,
      errorMonitoring: overrides.errorMonitoring ?? false,
      feedback: overrides.feedback ?? false,
      parentReports: overrides.parentReports ?? false,
      payments: overrides.payments ?? false,
      publicRegistration: overrides.publicRegistration ?? false,
      realtimeNotifications: realtimeEnabled,
      referrals: overrides.referrals ?? false,
      supportTickets: overrides.supportTickets ?? false,
      teacherHelp: overrides.teacherHelp ?? false,
    },
  }
}

function headerBag(values) {
  const normalized = new Map(
    Object.entries(values).map(([key, value]) => [key.toLowerCase(), value]),
  )
  return {
    get: (name) => normalized.get(name.toLowerCase()) ?? null,
  }
}

function responseFor(body, webOrigin) {
  return {
    ok: true,
    status: 200,
    redirected: false,
    url: `${webOrigin}/runtime-config.json`,
    headers: headerBag({
      'content-length': String(new TextEncoder().encode(body).byteLength),
      'content-type': 'application/json',
    }),
    text: async () => body,
  }
}

async function install(runtime, config) {
  const digest = await runtime.digestRuntimeConfig(config)
  await runtime.initializeRuntimeConfig({
    webOrigin: config.web.origin,
    expectedDigest: digest,
    expectedRelease: { ...config.release },
    expectedEnvironment: config.environment,
    fetchImpl: async () => responseFor(JSON.stringify(config), config.web.origin),
  })
}

const EXPECTED_EXPORTS = [
  'allowDemoFallback',
  'apiBaseUrl',
  'apiMode',
  'appEnv',
  'enableAnalytics',
  'enableDemoApi',
  'enableDemoShortcuts',
  'enableFeedback',
  'enableMSW',
  'enableMockCheckout',
  'enableParentReport',
  'enablePayment',
  'enablePublicRegister',
  'enableRealtimeNotifications',
  'enableReferral',
  'enableSupportTickets',
  'enableTeacherHelp',
  'isDevelopment',
  'isProduction',
  'isProductionFacing',
  'isStaging',
  'showCheckoutPreview',
  'showDemoAccounts',
  'showDemoBadges',
  'showDemoSurfaces',
  'showInternalDebug',
  'websocketBaseUrl',
].sort()

test('projection source and compiled output contain no alternate release truth', async () => {
  const source = await readFile(projectionPath, 'utf8')
  const output = compileTypeScript(source, projectionPath)
  for (const forbidden of [
    /VITE_/i,
    /import\.meta\.env/i,
    /localhost/i,
    /cognito/i,
    /amplify/i,
    /emailjs/i,
    /react.?native/i,
    /\bmobile\b/i,
  ]) {
    assert.doesNotMatch(source, forbidden)
    assert.doesNotMatch(output, forbidden)
  }
  assert.match(source, /getRuntimeConfig\(\)/)
})

test('import before runtime configuration installation fails closed', async () => {
  const harness = await projectionHarness()
  await assert.rejects(
    harness.importProjection(),
    (error) => error.name === 'RuntimeConfigError' &&
      error.code === 'runtime_config_uninitialized',
  )
})

test('staging, pilot, and production project exact API, feature, and realtime values', async () => {
  const cases = [
    ['staging', {
      analytics: true,
      feedback: false,
      parentReports: true,
      payments: false,
      publicRegistration: true,
      realtimeEnabled: true,
      referrals: false,
      supportTickets: true,
      teacherHelp: false,
    }],
    ['staging-pilot', {
      analytics: false,
      feedback: true,
      parentReports: false,
      payments: true,
      publicRegistration: false,
      realtimeEnabled: true,
      referrals: true,
      supportTickets: false,
      teacherHelp: true,
    }],
    ['production', {
      analytics: true,
      feedback: true,
      parentReports: true,
      payments: true,
      publicRegistration: true,
      realtimeEnabled: false,
      referrals: true,
      supportTickets: true,
      teacherHelp: true,
    }],
  ]

  for (const [environment, overrides] of cases) {
    const harness = await projectionHarness()
    const config = validConfig(environment, overrides)
    await install(harness.runtime, config)
    const projection = await harness.importProjection()

    assert.deepEqual(Object.keys(projection).sort(), EXPECTED_EXPORTS)
    assert.equal(projection.appEnv, environment)
    assert.equal(projection.apiMode, environment === 'production' ? 'production' : 'staging')
    assert.equal(projection.apiBaseUrl, config.api.origin)
    assert.equal(projection.isDevelopment, false)
    assert.equal(projection.isStaging, environment !== 'production')
    assert.equal(projection.isProduction, environment === 'production')
    assert.equal(
      projection.isProductionFacing,
      environment === 'production' || environment === 'staging-pilot',
    )
    assert.equal(projection.enableAnalytics, config.features.analytics)
    assert.equal(projection.enableFeedback, config.features.feedback)
    assert.equal(projection.enablePayment, config.features.payments)
    assert.equal(projection.enablePublicRegister, config.features.publicRegistration)
    assert.equal(projection.enableTeacherHelp, config.features.teacherHelp)
    assert.equal(projection.enableParentReport, config.features.parentReports)
    assert.equal(projection.enableReferral, config.features.referrals)
    assert.equal(projection.enableSupportTickets, config.features.supportTickets)
    assert.equal(
      projection.enableRealtimeNotifications,
      config.features.realtimeNotifications,
    )
    assert.equal(projection.websocketBaseUrl, config.realtime.endpoint ?? '')
  }
})

test('mock, demo, MSW, debug, checkout preview, and fallback surfaces remain disabled', async () => {
  const harness = await projectionHarness()
  const config = validConfig('staging', {
    analytics: true,
    feedback: true,
    parentReports: true,
    payments: true,
    publicRegistration: true,
    realtimeEnabled: true,
    referrals: true,
    supportTickets: true,
    teacherHelp: true,
  })
  await install(harness.runtime, config)
  const projection = await harness.importProjection()

  for (const name of [
    'enableMSW',
    'enableDemoShortcuts',
    'enableMockCheckout',
    'enableDemoApi',
    'allowDemoFallback',
    'showDemoAccounts',
    'showDemoBadges',
    'showInternalDebug',
    'showDemoSurfaces',
    'showCheckoutPreview',
  ]) {
    assert.equal(projection[name], false, name)
  }
  assert.notEqual(projection.apiMode, 'mock')
  assert.notEqual(projection.apiMode, 'demo')
})
