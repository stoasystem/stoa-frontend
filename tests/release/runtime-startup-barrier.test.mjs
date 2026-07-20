import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const bootstrapPath = path.join(repoRoot, 'src/bootstrap.ts')
const mainPath = path.join(repoRoot, 'src/main.tsx')
let moduleSequence = 0

function compileTypeScript(source, fileName) {
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
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

async function loadBootstrap(delegate) {
  const key = `__stoa_startup_test_${moduleSequence}_${Math.random().toString(16).slice(2)}`
  globalThis[key] = delegate
  const servedStub = moduleUrl(`
    const delegate = globalThis[${JSON.stringify(key)}]
    export const loadServedRelease = (...args) => delegate.loadServedRelease(...args)
    export const toRuntimeConfigLoadOptions = (...args) => delegate.toRuntimeConfigLoadOptions(...args)
  `, 'served-stub')
  const runtimeStub = moduleUrl(`
    const delegate = globalThis[${JSON.stringify(key)}]
    export const initializeRuntimeConfig = (...args) => delegate.initializeRuntimeConfig(...args)
  `, 'runtime-stub')
  const source = await readFile(bootstrapPath, 'utf8')
  const testable = source
    .replace(/from ['"]@\/lib\/servedRelease['"]/, `from ${JSON.stringify(servedStub)}`)
    .replace(/from ['"]@\/lib\/runtimeConfig['"]/, `from ${JSON.stringify(runtimeStub)}`)
  const module = await import(moduleUrl(
    compileTypeScript(testable, bootstrapPath),
    'bootstrap',
  ))
  return {
    module,
    cleanup: () => { delete globalThis[key] },
  }
}

function baseDelegate(events = []) {
  const descriptor = { release: { releaseId: 'release-id' } }
  const runtimeOptions = { configUrl: '/runtime-config.json' }
  return {
    descriptor,
    runtimeOptions,
    loadServedRelease: async (options) => {
      events.push(['descriptor', options])
      return descriptor
    },
    toRuntimeConfigLoadOptions: (value, options) => {
      events.push(['project', value, options])
      return runtimeOptions
    },
    initializeRuntimeConfig: async (options) => {
      events.push(['config', options])
      return { environment: 'staging' }
    },
  }
}

function deferred() {
  let resolve
  let reject
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, reject, resolve }
}

function fakeFailureTarget() {
  const attributes = new Map()
  return {
    attributes,
    textContent: '',
    setAttribute(name, value) {
      attributes.set(name, value)
    },
  }
}

test('main statically imports only the barrier and dynamically loads the application graph', async () => {
  const source = await readFile(mainPath, 'utf8')
  const syntax = ts.createSourceFile(mainPath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const staticImports = syntax.statements
    .filter((statement) => ts.isImportDeclaration(statement))
    .map((statement) => statement.moduleSpecifier.text)

  assert.deepEqual(staticImports, ['./bootstrap'])
  assert.doesNotMatch(source, /from\s+['"].*(?:App|api|auth|react|i18n)/i)
  assert.match(source, /import\(['"]\.\/App['"]\)/)
  assert.match(source, /import\(['"]react['"]\)/)
  assert.match(source, /import\(['"]react-dom\/client['"]\)/)
  assert.match(source, /import\(['"]@\/i18n['"]\)/)
  assert.match(source, /startWebApplication\(/)
  assert.doesNotMatch(source, /VITE_/)
  const metaEnvReads = source.match(/import\.meta\.env\.[A-Z0-9_]+/g) ?? []
  assert.equal(metaEnvReads.every((value) => value === 'import.meta.env.DEV'), true)
})

test('startup orders descriptor, projection, config installation, dynamic import, and render', async () => {
  const events = []
  const delegate = baseDelegate(events)
  const harness = await loadBootstrap(delegate)
  try {
    const result = await harness.module.startWebApplication({
      webOrigin: 'https://staging.stoaedu.ch',
      timeoutMs: 1_000,
      renderFailure: () => events.push(['failure']),
      loadApplication: async () => {
        events.push(['import-app'])
        return async () => { events.push(['start-app']) }
      },
    })

    assert.equal(result, true)
    assert.deepEqual(events.map(([name]) => name), [
      'descriptor',
      'project',
      'config',
      'import-app',
      'start-app',
    ])
    assert.deepEqual(events[0][1], { webOrigin: 'https://staging.stoaedu.ch' })
    assert.equal(events[1][1], delegate.descriptor)
    assert.deepEqual(events[1][2], { expectedWebOrigin: 'https://staging.stoaedu.ch' })
    assert.equal(events[2][1], delegate.runtimeOptions)
  } finally {
    harness.cleanup()
  }
})

test('descriptor and config failures never import or start the application', async () => {
  for (const failurePoint of ['descriptor', 'config']) {
    const events = []
    const delegate = baseDelegate(events)
    const sensitive = new Error(
      `https://private.example/${'a'.repeat(64)}?credential=secret`,
    )
    if (failurePoint === 'descriptor') {
      delegate.loadServedRelease = async () => { throw sensitive }
    } else {
      delegate.initializeRuntimeConfig = async () => { throw sensitive }
    }
    const harness = await loadBootstrap(delegate)
    let failures = 0
    let imports = 0
    let starts = 0
    try {
      const result = await harness.module.startWebApplication({
        webOrigin: 'https://staging.stoaedu.ch',
        timeoutMs: 1_000,
        renderFailure: () => { failures += 1 },
        loadApplication: async () => {
          imports += 1
          return () => { starts += 1 }
        },
      })
      assert.equal(result, false, failurePoint)
      assert.equal(failures, 1, failurePoint)
      assert.equal(imports, 0, failurePoint)
      assert.equal(starts, 0, failurePoint)
    } finally {
      harness.cleanup()
    }
  }
})

test('timeout and concurrent duplicate initialization fail one attempt before App import', async () => {
  for (const mode of ['timeout', 'duplicate']) {
    const gate = deferred()
    const events = []
    const delegate = baseDelegate(events)
    delegate.loadServedRelease = async () => {
      events.push(['descriptor'])
      return gate.promise
    }
    const harness = await loadBootstrap(delegate)
    let failures = 0
    let imports = 0
    try {
      const options = {
        webOrigin: 'https://staging.stoaedu.ch',
        timeoutMs: mode === 'timeout' ? 5 : 1_000,
        renderFailure: () => { failures += 1 },
        loadApplication: async () => {
          imports += 1
          return () => undefined
        },
      }
      const first = harness.module.startWebApplication(options)
      let second
      if (mode === 'duplicate') second = harness.module.startWebApplication(options)
      if (mode === 'timeout') {
        await delay(15)
      }
      gate.resolve(delegate.descriptor)

      assert.equal(await first, false)
      if (second) assert.equal(await second, false)
      assert.equal(failures, 1)
      assert.equal(imports, 0)
      assert.deepEqual(events.map(([name]) => name), ['descriptor'])
    } finally {
      harness.cleanup()
    }
  }
})

test('a completed startup cannot be repeated or replace installed configuration', async () => {
  const events = []
  const delegate = baseDelegate(events)
  const harness = await loadBootstrap(delegate)
  let failures = 0
  let imports = 0
  let starts = 0
  const options = {
    webOrigin: 'https://staging.stoaedu.ch',
    timeoutMs: 1_000,
    renderFailure: () => { failures += 1 },
    loadApplication: async () => {
      imports += 1
      return () => { starts += 1 }
    },
  }
  try {
    assert.equal(await harness.module.startWebApplication(options), true)
    delegate.descriptor = { release: { releaseId: 'replacement' } }
    assert.equal(await harness.module.startWebApplication(options), false)
    assert.equal(imports, 1)
    assert.equal(starts, 1)
    assert.equal(events.filter(([name]) => name === 'config').length, 1)
    assert.equal(failures, 1)
  } finally {
    harness.cleanup()
  }
})

test('failure renderer exposes only one fixed friendly actionable message', async () => {
  const delegate = baseDelegate()
  const harness = await loadBootstrap(delegate)
  const target = fakeFailureTarget()
  try {
    harness.module.renderStartupFailure(target)
    assert.equal(
      target.textContent,
      '应用暂时无法启动，请刷新重试；问题持续请联系支持。',
    )
    assert.equal(target.attributes.get('role'), 'alert')
    assert.equal(target.attributes.get('aria-live'), 'assertive')
    assert.doesNotMatch(target.textContent, /https?:|[0-9a-f]{32,}|error|digest|credential/i)
  } finally {
    harness.cleanup()
  }
})
