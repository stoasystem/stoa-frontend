import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import ts from 'typescript'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const sourcePath = path.join(repoRoot, 'src/lib/runtimeConfig.ts')
const schemaPath = path.join(repoRoot, 'schemas/release/runtime-config-v1.schema.json')
const templatePath = path.join(repoRoot, 'public/runtime-config.json.template')

async function loadRuntimeConfigModule() {
  const source = await readFile(sourcePath, 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: sourcePath,
    reportDiagnostics: true,
  })
  const errors = (compiled.diagnostics ?? []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  )
  assert.deepEqual(errors, [])
  const url = `data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`
  return import(url)
}

const sha = (character) => character.repeat(64)

function validConfig() {
  return {
    schema: 'stoa.web.runtime-config.v1',
    environment: 'staging',
    release: {
      releaseId: sha('1'),
      manifestSha256: sha('2'),
      frontendArtifactSha256: sha('3'),
      backendArtifactSha256: sha('4'),
    },
    web: { origin: 'https://staging.stoaedu.ch' },
    api: { origin: 'https://api-staging.stoaedu.ch' },
    auth: { mode: 'backend-api' },
    realtime: {
      enabled: true,
      endpoint: 'wss://api-staging.stoaedu.ch/realtime',
    },
    features: {
      analytics: false,
      errorMonitoring: false,
      feedback: true,
      parentReports: true,
      payments: false,
      publicRegistration: true,
      realtimeNotifications: true,
      referrals: true,
      supportTickets: true,
      teacherHelp: true,
    },
  }
}

function responseFor(body, overrides = {}) {
  return {
    ok: true,
    status: 200,
    redirected: false,
    url: 'https://staging.stoaedu.ch/runtime-config.json',
    headers: new Headers({
      'content-length': String(new TextEncoder().encode(body).byteLength),
      'content-type': 'application/json',
    }),
    text: async () => body,
    ...overrides,
  }
}

test('template and schema expose one closed backend-api Web contract', async () => {
  const schema = JSON.parse(await readFile(schemaPath, 'utf8'))
  const template = JSON.parse(await readFile(templatePath, 'utf8'))

  assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema')
  assert.equal(schema.additionalProperties, false)
  assert.equal(schema.properties.auth.properties.mode.const, 'backend-api')
  assert.equal(schema.properties.features.additionalProperties, false)
  assert.equal(schema.properties.release.additionalProperties, false)
  assert.equal(schema.properties.web.additionalProperties, false)
  assert.equal(schema.properties.api.additionalProperties, false)
  assert.deepEqual(schema.required, [
    'schema', 'environment', 'release', 'web', 'api', 'auth', 'realtime', 'features',
  ])
  assert.equal(template.auth.mode, 'backend-api')
  assert.deepEqual(Object.keys(template), [
    'schema',
    'environment',
    'release',
    'web',
    'api',
    'auth',
    'realtime',
    'features',
  ])
  assert.doesNotMatch(JSON.stringify(template).toLowerCase(), /cognito|amplify|secret|password|credential/)
})

test('valid configuration is canonical, digest-bound, and deeply frozen', async () => {
  const runtime = await loadRuntimeConfigModule()
  const config = validConfig()
  const digest = await runtime.digestRuntimeConfig(config)
  const parsed = await runtime.validateRuntimeConfig(config, {
    expectedDigest: digest,
    expectedEnvironment: 'staging',
    expectedWebOrigin: 'https://staging.stoaedu.ch',
  })

  assert.equal(digest.length, 64)
  assert.equal(parsed.auth.mode, 'backend-api')
  assert.equal(Object.isFrozen(parsed), true)
  assert.equal(Object.isFrozen(parsed.release), true)
  assert.equal(Object.isFrozen(parsed.features), true)
  assert.equal(
    runtime.canonicalizeRuntimeConfig({ b: true, a: { d: false, c: true } }),
    '{"a":{"c":true,"d":false},"b":true}',
  )
})

test('closed validation rejects unknown, secret-shaped, unsafe, mismatched, and demo fields', async () => {
  const runtime = await loadRuntimeConfigModule()
  const cases = [
    ['unknown top-level', (value) => { value.extra = true }],
    ['secret-shaped nested key', (value) => { value.auth.clientSecret = 'hidden' }],
    ['unknown release key', (value) => { value.release.branch = 'main' }],
    ['unknown feature flag', (value) => { value.features.experimental = true }],
    ['alternate auth', (value) => { value.auth.mode = 'cognito' }],
    ['amplify config', (value) => { value.auth.amplify = {} }],
    ['unsafe Web origin', (value) => { value.web.origin = 'http://staging.stoaedu.ch' }],
    ['origin credentials', (value) => { value.api.origin = 'https://user:pass@api.stoaedu.ch' }],
    ['origin query', (value) => { value.api.origin = 'https://api-staging.stoaedu.ch?token=x' }],
    ['origin path', (value) => { value.api.origin = 'https://api-staging.stoaedu.ch/v1' }],
    ['environment mismatch', (value) => { value.environment = 'production' }],
    ['Web origin mismatch', (value) => { value.web.origin = 'https://other.stoaedu.ch' }],
    ['release identity mismatch', (value) => { value.release.releaseId = 'latest' }],
    ['realtime mismatch', (value) => { value.features.realtimeNotifications = false }],
    ['realtime host mismatch', (value) => { value.realtime.endpoint = 'wss://attacker.example/realtime' }],
    ['demo flag', (value) => { value.features.demoApi = true }],
    ['native config', (value) => { value.mobile = { ios: true } }],
  ]

  for (const [name, mutate] of cases) {
    const value = validConfig()
    mutate(value)
    await assert.rejects(
      runtime.validateRuntimeConfig(value, {
        expectedDigest: sha('a'),
        expectedEnvironment: 'staging',
        expectedWebOrigin: 'https://staging.stoaedu.ch',
      }),
      { name: 'RuntimeConfigError' },
      name,
    )
  }
})

test('digest mismatch fails closed', async () => {
  const runtime = await loadRuntimeConfigModule()
  await assert.rejects(
    runtime.validateRuntimeConfig(validConfig(), {
      expectedDigest: sha('f'),
      expectedEnvironment: 'staging',
      expectedWebOrigin: 'https://staging.stoaedu.ch',
    }),
    (error) => error.name === 'RuntimeConfigError' && error.code === 'runtime_config_digest_mismatch',
  )
})

test('loader fetches a same-origin bounded document without credentials, cache, or redirects', async () => {
  const runtime = await loadRuntimeConfigModule()
  const config = validConfig()
  const body = JSON.stringify(config)
  const digest = await runtime.digestRuntimeConfig(config)
  const calls = []
  const loaded = await runtime.loadRuntimeConfig({
    configUrl: '/runtime-config.json',
    webOrigin: 'https://staging.stoaedu.ch',
    expectedDigest: digest,
    expectedEnvironment: 'staging',
    fetchImpl: async (...args) => {
      calls.push(args)
      return responseFor(body)
    },
  })

  assert.equal(loaded.release.releaseId, sha('1'))
  assert.equal(calls.length, 1)
  assert.equal(calls[0][0], 'https://staging.stoaedu.ch/runtime-config.json')
  assert.deepEqual(calls[0][1], {
    method: 'GET',
    credentials: 'omit',
    cache: 'no-store',
    redirect: 'error',
    headers: { Accept: 'application/json' },
  })
})

test('loader rejects cross-origin paths, redirects, wrong media, and documents over 16 KiB', async () => {
  const runtime = await loadRuntimeConfigModule()
  const config = validConfig()
  const body = JSON.stringify(config)
  const digest = await runtime.digestRuntimeConfig(config)
  const base = {
    webOrigin: 'https://staging.stoaedu.ch',
    expectedDigest: digest,
    expectedEnvironment: 'staging',
  }

  await assert.rejects(runtime.loadRuntimeConfig({
    ...base,
    configUrl: 'https://attacker.example/runtime-config.json',
    fetchImpl: async () => responseFor(body),
  }), { name: 'RuntimeConfigError' })
  await assert.rejects(runtime.loadRuntimeConfig({
    ...base,
    fetchImpl: async () => responseFor(body, { redirected: true }),
  }), { name: 'RuntimeConfigError' })
  await assert.rejects(runtime.loadRuntimeConfig({
    ...base,
    fetchImpl: async () => responseFor(body, { headers: new Headers({ 'content-type': 'text/html' }) }),
  }), { name: 'RuntimeConfigError' })
  await assert.rejects(runtime.loadRuntimeConfig({
    ...base,
    fetchImpl: async () => responseFor(`${body}${' '.repeat(16_384)}`),
  }), { name: 'RuntimeConfigError' })
  await assert.rejects(runtime.loadRuntimeConfig({
    ...base,
    fetchImpl: async () => responseFor(body, { ok: false, status: 503 }),
  }), { name: 'RuntimeConfigError' })
  await assert.rejects(runtime.loadRuntimeConfig({
    ...base,
    fetchImpl: async () => responseFor('{"schema":"one","schema":"two"}'),
  }), { name: 'RuntimeConfigError' })
  await assert.rejects(runtime.loadRuntimeConfig({
    ...base,
    fetchImpl: async () => responseFor(body, {
      url: 'https://staging.stoaedu.ch/other.json',
    }),
  }), { name: 'RuntimeConfigError' })
  await assert.rejects(runtime.loadRuntimeConfig({
    ...base,
    configUrl: '/runtime-config.json?token=x',
    fetchImpl: async () => responseFor(body),
  }), { name: 'RuntimeConfigError' })
})

test('registry publishes only validated state and clears failed initialization', async () => {
  const runtime = await loadRuntimeConfigModule()
  const config = validConfig()
  const body = JSON.stringify(config)
  const digest = await runtime.digestRuntimeConfig(config)
  runtime.resetRuntimeConfigForTests()

  await assert.rejects(runtime.initializeRuntimeConfig({
    webOrigin: 'https://staging.stoaedu.ch',
    expectedDigest: sha('e'),
    expectedEnvironment: 'staging',
    fetchImpl: async () => responseFor(body),
  }))
  assert.throws(() => runtime.getRuntimeConfig(), { name: 'RuntimeConfigError' })

  const loaded = await runtime.initializeRuntimeConfig({
    webOrigin: 'https://staging.stoaedu.ch',
    expectedDigest: digest,
    expectedEnvironment: 'staging',
    fetchImpl: async () => responseFor(body),
  })
  assert.equal(runtime.getRuntimeConfig(), loaded)
  runtime.resetRuntimeConfigForTests()
})
