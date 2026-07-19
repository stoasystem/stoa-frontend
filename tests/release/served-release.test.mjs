import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { TextEncoder } from 'node:util'
import ts from 'typescript'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const sourcePath = path.join(repoRoot, 'src/lib/servedRelease.ts')
const schemaPath = path.join(repoRoot, 'schemas/release/served-release-v1.schema.json')
const templatePath = path.join(repoRoot, 'public/served-release.json.template')

async function loadServedReleaseModule() {
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
const releaseId = sha('1')

function validDescriptor() {
  return {
    schema: 'stoa.web.served-release.v1',
    environment: 'staging',
    release: {
      releaseId,
      manifestSha256: sha('2'),
      frontendArtifactSha256: sha('3'),
      backendArtifactSha256: sha('4'),
    },
    runtimeConfig: {
      key: 'runtime-config.json',
      versionId: 'runtime-version_A1b2c3d4',
      url: 'https://staging.stoaedu.ch/runtime-config.json',
      sha256: sha('5'),
    },
    webEntry: {
      key: 'index.html',
      versionId: 'web-version_E5f6g7h8',
      url: 'https://staging.stoaedu.ch/index.html',
      sha256: sha('6'),
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

function responseFor(body, overrides = {}) {
  return {
    ok: true,
    status: 200,
    redirected: false,
    url: 'https://staging.stoaedu.ch/served-release.json',
    headers: headerBag({
      'content-length': String(new TextEncoder().encode(body).byteLength),
      'content-type': 'application/json',
    }),
    text: async () => body,
    ...overrides,
  }
}

test('template and schema expose one closed non-circular served-release contract', async () => {
  const schema = JSON.parse(await readFile(schemaPath, 'utf8'))
  const template = JSON.parse(await readFile(templatePath, 'utf8'))

  assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema')
  assert.equal(schema.additionalProperties, false)
  assert.deepEqual(schema.required, [
    'schema',
    'environment',
    'release',
    'runtimeConfig',
    'webEntry',
  ])
  assert.equal(schema.properties.release.additionalProperties, false)
  assert.equal(schema.properties.runtimeConfig.additionalProperties, false)
  assert.equal(schema.properties.webEntry.additionalProperties, false)
  assert.deepEqual(schema.properties.environment.enum, ['staging', 'staging-pilot', 'production'])
  assert.deepEqual(Object.keys(template), schema.required)
  assert.doesNotMatch(
    JSON.stringify({ schema, template }).toLowerCase(),
    /cognito|amplify|clientsecret|password|credential|mobile|native|demo/,
  )
  assert.equal('descriptorSha256' in template, false)
  assert.equal('descriptorVersionId' in template, false)
  assert.equal('servedRelease' in template, false)
})

test('valid descriptor is canonical and deeply frozen', async () => {
  const served = await loadServedReleaseModule()
  const descriptor = validDescriptor()
  const parsed = served.validateServedRelease(descriptor, {
    expectedWebOrigin: 'https://staging.stoaedu.ch',
  })

  assert.equal(parsed.release.releaseId, releaseId)
  assert.equal(Object.isFrozen(parsed), true)
  assert.equal(Object.isFrozen(parsed.release), true)
  assert.equal(Object.isFrozen(parsed.runtimeConfig), true)
  assert.equal(Object.isFrozen(parsed.webEntry), true)
  assert.equal(
    served.canonicalizeServedRelease({ b: true, a: { d: false, c: true } }),
    '{"a":{"c":true,"d":false},"b":true}',
  )
})

test('validated descriptor maps exactly to the Plan 72 runtime-config loader contract', async () => {
  const served = await loadServedReleaseModule()
  const parsed = served.validateServedRelease(validDescriptor(), {
    expectedWebOrigin: 'https://staging.stoaedu.ch',
  })
  const runtimeOptions = served.toRuntimeConfigLoadOptions(parsed, {
    expectedWebOrigin: 'https://staging.stoaedu.ch',
  })

  assert.deepEqual(runtimeOptions, {
    configUrl: '/runtime-config.json',
    webOrigin: 'https://staging.stoaedu.ch',
    expectedDigest: sha('5'),
    expectedRelease: {
      releaseId,
      manifestSha256: sha('2'),
      frontendArtifactSha256: sha('3'),
      backendArtifactSha256: sha('4'),
    },
    expectedEnvironment: 'staging',
  })
  assert.equal(parsed.runtimeConfig.url, 'https://staging.stoaedu.ch/runtime-config.json')
  assert.equal(parsed.webEntry.url, 'https://staging.stoaedu.ch/index.html')

  const forged = validDescriptor()
  forged.runtimeConfig.url = 'https://attacker-staging.example/runtime-config.json'
  forged.webEntry.url = 'https://attacker-staging.example/index.html'
  assert.throws(
    () => served.toRuntimeConfigLoadOptions(forged, {
      expectedWebOrigin: 'https://staging.stoaedu.ch',
    }),
    { name: 'ServedReleaseError' },
  )
})

test('closed validation rejects unknown, secret, provider, demo, and native fields', async () => {
  const served = await loadServedReleaseModule()
  const cases = [
    ['unknown top-level', (value) => { value.extra = true }],
    ['unknown release key', (value) => { value.release.branch = 'main' }],
    ['unknown object key', (value) => { value.runtimeConfig.etag = 'opaque' }],
    ['secret-shaped key', (value) => { value.webEntry.clientSecret = 'hidden' }],
    ['provider field', (value) => { value.authProvider = 'cognito' }],
    ['amplify field', (value) => { value.amplify = {} }],
    ['demo field', (value) => { value.demo = true }],
    ['native field', (value) => { value.mobile = { ios: true } }],
    ['AWS key value', (value) => { value.runtimeConfig.versionId = 'AKIA1234567890ABCDEF' }],
    ['Bearer value', (value) => { value.webEntry.versionId = 'Bearer abc.def.ghi' }],
    ['JWT value', (value) => { value.webEntry.versionId = 'abcdefgh.ijklmnop.qrstuvwx' }],
  ]

  for (const [name, mutate] of cases) {
    const value = validDescriptor()
    mutate(value)
    assert.throws(
      () => served.validateServedRelease(value, {
        expectedWebOrigin: 'https://staging.stoaedu.ch',
      }),
      { name: 'ServedReleaseError' },
      name,
    )
  }
})

test('object coordinates reject mutable, malformed, cross-release, and unsafe identities', async () => {
  const served = await loadServedReleaseModule()
  const cases = [
    ['mutable release', (value) => { value.release.releaseId = 'latest' }],
    ['mutable key', (value) => { value.runtimeConfig.key = 'latest/runtime-config.json' }],
    ['branch key', (value) => { value.webEntry.key = 'main/index.html' }],
    ['path traversal', (value) => { value.runtimeConfig.key = '../runtime-config.json' }],
    ['leading slash', (value) => { value.runtimeConfig.key = `/${value.runtimeConfig.key}` }],
    ['wrong object name', (value) => { value.webEntry.key = `releases/${releaseId}/app.html` }],
    ['mutable VersionId', (value) => { value.webEntry.versionId = 'latest' }],
    ['null VersionId', (value) => { value.webEntry.versionId = 'null' }],
    ['empty VersionId', (value) => { value.runtimeConfig.versionId = '' }],
    ['malformed SHA', (value) => { value.runtimeConfig.sha256 = sha('A') }],
    ['cross-origin URL', (value) => { value.runtimeConfig.url = `https://attacker.example/${value.runtimeConfig.key}` }],
    ['HTTP URL', (value) => { value.webEntry.url = `http://staging.stoaedu.ch/${value.webEntry.key}` }],
    ['URL credentials', (value) => { value.webEntry.url = `https://user:pass@staging.stoaedu.ch/${value.webEntry.key}` }],
    ['URL query', (value) => { value.webEntry.url += '?token=x' }],
    ['URL fragment', (value) => { value.runtimeConfig.url += '#main' }],
    ['key URL mismatch', (value) => { value.runtimeConfig.url = value.webEntry.url }],
    ['origin mismatch', () => {}],
  ]

  for (const [name, mutate] of cases) {
    const value = validDescriptor()
    mutate(value)
    assert.throws(
      () => served.validateServedRelease(value, {
        expectedWebOrigin: name === 'origin mismatch'
          ? 'https://pilot.staging.stoaedu.ch'
          : 'https://staging.stoaedu.ch',
      }),
      { name: 'ServedReleaseError' },
      name,
    )
  }
})

test('loader fetches only exact same-origin descriptor without credentials, cache, or redirects', async () => {
  const served = await loadServedReleaseModule()
  const body = JSON.stringify(validDescriptor())
  const calls = []
  const loaded = await served.loadServedRelease({
    webOrigin: 'https://staging.stoaedu.ch',
    fetchImpl: async (...args) => {
      calls.push(args)
      return responseFor(body)
    },
  })

  assert.equal(loaded.release.releaseId, releaseId)
  assert.equal(calls.length, 1)
  assert.equal(calls[0][0], 'https://staging.stoaedu.ch/served-release.json')
  assert.deepEqual(calls[0][1], {
    method: 'GET',
    credentials: 'omit',
    cache: 'no-store',
    redirect: 'error',
    headers: { Accept: 'application/json' },
  })
})

test('loader rejects redirects, final URL drift, wrong media, duplicates, and oversized bodies', async () => {
  const served = await loadServedReleaseModule()
  const body = JSON.stringify(validDescriptor())
  const base = { webOrigin: 'https://staging.stoaedu.ch' }
  const cases = [
    ['redirect', responseFor(body, { redirected: true })],
    ['final URL drift', responseFor(body, { url: 'https://staging.stoaedu.ch/other.json' })],
    ['wrong media', responseFor(body, { headers: headerBag({ 'content-type': 'text/html' }) })],
    ['bad status', responseFor(body, { ok: false, status: 503 })],
    ['oversized declared body', responseFor(body, { headers: headerBag({
      'content-length': String(16 * 1024 + 1),
      'content-type': 'application/json',
    }) })],
    ['oversized actual body', responseFor(`${body}${' '.repeat(16 * 1024)}`)],
    ['duplicate JSON keys', responseFor('{"schema":"one","schema":"two"}')],
  ]

  for (const [name, response] of cases) {
    await assert.rejects(
      served.loadServedRelease({ ...base, fetchImpl: async () => response }),
      { name: 'ServedReleaseError' },
      name,
    )
  }

  await assert.rejects(
    served.loadServedRelease({
      webOrigin: 'https://user:pass@staging.stoaedu.ch',
      fetchImpl: async () => responseFor(body),
    }),
    { name: 'ServedReleaseError' },
  )
  await assert.rejects(
    served.loadServedRelease({
      ...base,
      fetchImpl: async () => { throw new Error('provider details must not escape') },
    }),
    (error) => error.name === 'ServedReleaseError' && error.code === 'served_release_fetch_failed',
  )
})
