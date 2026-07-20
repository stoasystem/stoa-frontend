import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const monitoringPath = path.join(
  repoRoot,
  'src/services/monitoring/frontendErrorMonitoring.ts',
)
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

async function monitoringHarness({ errorMonitoring = false, runtimeError, postError } = {}) {
  const posts = []
  const logs = []
  const key = `__stoa_monitoring_test_${moduleSequence}_${Math.random().toString(16).slice(2)}`
  globalThis[key] = {
    getRuntimeConfig() {
      if (runtimeError) throw runtimeError
      return { features: { errorMonitoring } }
    },
    async post(endpoint, payload) {
      posts.push({ endpoint, payload })
      if (postError) throw postError
    },
    debug(message, context) {
      logs.push({ level: 'debug', message, context })
    },
    warn(message, context) {
      logs.push({ level: 'warn', message, context })
    },
  }

  const envStub = moduleUrl(`
    export const appEnv = 'staging'
    export const isDevelopment = false
  `, 'env-stub')
  const runtimeStub = moduleUrl(`
    const delegate = globalThis[${JSON.stringify(key)}]
    export const getRuntimeConfig = () => delegate.getRuntimeConfig()
  `, 'runtime-stub')
  const httpStub = moduleUrl(`
    const delegate = globalThis[${JSON.stringify(key)}]
    export const httpClient = { post: (...args) => delegate.post(...args) }
  `, 'http-stub')
  const loggingStub = moduleUrl(`
    const delegate = globalThis[${JSON.stringify(key)}]
    export const logger = {
      debug: (...args) => delegate.debug(...args),
      warn: (...args) => delegate.warn(...args),
    }
  `, 'logging-stub')
  const source = await readFile(monitoringPath, 'utf8')
  const testable = source
    .replace(/from ['"]@\/lib\/env['"]/, `from ${JSON.stringify(envStub)}`)
    .replace(
      /from ['"]@\/lib\/runtimeConfig['"]/,
      `from ${JSON.stringify(runtimeStub)}`,
    )
    .replace(
      /from ['"]@\/services\/api\/httpClient['"]/,
      `from ${JSON.stringify(httpStub)}`,
    )
    .replace(
      /from ['"]@\/services\/logging['"]/,
      `from ${JSON.stringify(loggingStub)}`,
    )
  const module = await import(moduleUrl(
    compileTypeScript(testable, monitoringPath),
    'frontend-error-monitoring',
  ))

  return {
    cleanup: () => { delete globalThis[key] },
    logs,
    module,
    posts,
  }
}

test('monitoring policy source is only the validated runtime feature flag', async () => {
  const source = await readFile(monitoringPath, 'utf8')

  assert.match(source, /getRuntimeConfig\(\)\.features\.errorMonitoring/)
  assert.doesNotMatch(source, /VITE_/i)
  assert.doesNotMatch(source, /import\.meta\.env/i)
  assert.doesNotMatch(source, /isDevelopment/)
})

test('runtime false skips reporting while runtime true uses the bounded backend endpoint', async () => {
  for (const errorMonitoring of [false, true]) {
    const harness = await monitoringHarness({ errorMonitoring })
    try {
      await harness.module.reportFrontendError(new Error('bounded failure'))
      assert.equal(harness.posts.length, errorMonitoring ? 1 : 0)
      if (errorMonitoring) {
        assert.equal(harness.posts[0].endpoint, '/monitoring/frontend-errors')
      }
    } finally {
      harness.cleanup()
    }
  }
})

test('missing runtime configuration fails closed without a report request', async () => {
  const harness = await monitoringHarness({
    runtimeError: new Error('runtime_config_uninitialized credential=private'),
  })
  try {
    await assert.doesNotReject(
      harness.module.reportFrontendError(new Error('application failure')),
    )
    assert.equal(harness.posts.length, 0)
    assert.equal(harness.logs.some(({ level }) => level === 'debug'), true)
  } finally {
    harness.cleanup()
  }
})

test('runtime-enabled reports preserve token and private-text redaction and payload bounds', async () => {
  const token = `eyJ${'a'.repeat(24)}.${'b'.repeat(24)}.${'c'.repeat(24)}`
  const error = new Error(`authorization: Bearer ${token}`)
  error.name = 'password=private-name'
  error.stack = [
    `Error: authorization: Bearer ${token}`,
    ...Array.from(
      { length: 12 },
      (_, index) => `    at safeFrame${index} (https://staging.stoaedu.ch/app.js?token=${token}${'x'.repeat(320)})`,
    ),
  ].join('\n')
  const componentStack = Array.from(
    { length: 12 },
    (_, index) => `    in SafeComponent${index} (https://staging.stoaedu.ch/component.js?secret=${index}${'y'.repeat(320)})`,
  ).join('\n')
  const harness = await monitoringHarness({ errorMonitoring: true })
  try {
    await harness.module.reportFrontendError(error, {
      componentStack,
      source: 'app-error-boundary',
    })
    assert.equal(harness.posts.length, 1)
    const payload = harness.posts[0].payload
    assert.equal(payload.message, 'Error message redacted')
    assert.equal(payload.name, 'Error')
    assert.equal(payload.source, 'app-error-boundary')

    for (const field of ['stack', 'componentStack']) {
      const lines = payload[field].split('\n')
      assert.equal(lines.length <= 8, true, field)
      assert.equal(lines.every((line) => line.length <= 303), true, field)
      assert.equal(lines.every((line) => !line.includes('?')), true, field)
    }

    const serialized = JSON.stringify(payload)
    assert.doesNotMatch(serialized, new RegExp(token.replaceAll('.', '\\.')))
    assert.doesNotMatch(serialized, /private-name|credential=|password=/i)
  } finally {
    harness.cleanup()
  }
})

test('report transport failure remains contained and exposes no provider message', async () => {
  const harness = await monitoringHarness({
    errorMonitoring: true,
    postError: new Error('Bearer provider-secret credential=private'),
  })
  try {
    await assert.doesNotReject(
      harness.module.reportFrontendError(new Error('bounded failure')),
    )
    assert.equal(harness.posts.length, 1)
    const warning = harness.logs.find(({ level }) => level === 'warn')
    assert.equal(warning?.context.errorName, 'Error')
    assert.doesNotMatch(JSON.stringify(warning), /provider-secret|credential=private/i)
  } finally {
    harness.cleanup()
  }
})
