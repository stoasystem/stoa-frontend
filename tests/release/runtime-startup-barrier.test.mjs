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
    removeAttribute(name) {
      attributes.delete(name)
    },
    ownerDocument: { documentElement: { lang: 'en' } },
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
  assert.match(source, /clearFailure: \(\) => clearStartupFailure\(rootElement\)/)
  // #344: a late start may follow failure text that set the page language
  // after i18next did; the application's own start sets it back.
  assert.match(source, /const \[, \{ default: i18n \}\] = await Promise\.all\(\[\s*import\(['"]\.\/index\.css['"]\),\s*import\(['"]@\/i18n['"]\)/)
  assert.match(source, /return \(\) => \{[^}]*document\.documentElement\.lang = i18n\.language\s*ReactDOM\.createRoot/)
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

test('concurrent duplicate initialization fails one attempt before App import', async () => {
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
      timeoutMs: 1_000,
      renderFailure: () => { failures += 1 },
      loadApplication: async () => {
        imports += 1
        return () => undefined
      },
    }
    const first = harness.module.startWebApplication(options)
    const second = harness.module.startWebApplication(options)
    gate.resolve(delegate.descriptor)

    assert.equal(await first, false)
    assert.equal(await second, false)
    assert.equal(failures, 1)
    assert.equal(imports, 0)
    assert.deepEqual(events.map(([name]) => name), ['descriptor'])
  } finally {
    harness.cleanup()
  }
})

// #344: running out of time used to end the start for good, so a release that
// was proven a moment late - or code that downloaded slowly - left the failure
// text up over an application that never mounted.
test('a release proven after its budget still mounts and takes the failure text down', async () => {
  const gate = deferred()
  const events = []
  const delegate = baseDelegate(events)
  delegate.loadServedRelease = async () => {
    events.push(['descriptor'])
    return gate.promise
  }
  const harness = await loadBootstrap(delegate)
  try {
    const started = harness.module.startWebApplication({
      webOrigin: 'https://staging.stoaedu.ch',
      timeoutMs: 5,
      renderFailure: () => events.push(['failure']),
      clearFailure: () => events.push(['clear']),
      loadApplication: async () => {
        events.push(['import-app'])
        return () => { events.push(['start-app']) }
      },
    })
    await delay(20)
    assert.deepEqual(events.map(([name]) => name), ['descriptor', 'failure'])
    gate.resolve(delegate.descriptor)

    assert.equal(await started, true)
    assert.deepEqual(events.map(([name]) => name), [
      'descriptor', 'failure', 'project', 'config', 'import-app', 'clear', 'start-app',
    ])
  } finally {
    harness.cleanup()
  }
})

test('loading the application code is not timed by the release budget', async () => {
  const events = []
  const delegate = baseDelegate(events)
  const harness = await loadBootstrap(delegate)
  try {
    const started = await harness.module.startWebApplication({
      webOrigin: 'https://staging.stoaedu.ch',
      timeoutMs: 5,
      applicationTimeoutMs: 1_000,
      renderFailure: () => events.push(['failure']),
      clearFailure: () => events.push(['clear']),
      loadApplication: async () => {
        await delay(30)
        events.push(['import-app'])
        return () => { events.push(['start-app']) }
      },
    })
    assert.equal(started, true)
    assert.deepEqual(events.map(([name]) => name), [
      'descriptor', 'project', 'config', 'import-app', 'start-app',
    ])
  } finally {
    harness.cleanup()
  }
})

test('application code past its own budget shows the failure, then mounts over it', async () => {
  const gate = deferred()
  const events = []
  const delegate = baseDelegate(events)
  const harness = await loadBootstrap(delegate)
  try {
    const started = harness.module.startWebApplication({
      webOrigin: 'https://staging.stoaedu.ch',
      timeoutMs: 1_000,
      applicationTimeoutMs: 5,
      renderFailure: () => events.push(['failure']),
      clearFailure: () => events.push(['clear']),
      loadApplication: async () => {
        await gate.promise
        return () => { events.push(['start-app']) }
      },
    })
    await delay(20)
    assert.equal(events.at(-1)[0], 'failure')
    gate.resolve()
    assert.equal(await started, true)
    assert.deepEqual(events.slice(-3).map(([name]) => name), ['failure', 'clear', 'start-app'])
  } finally {
    harness.cleanup()
  }
})

test('a start that fails outright after running out of time stays failed', async () => {
  const gate = deferred()
  const events = []
  const delegate = baseDelegate(events)
  delegate.loadServedRelease = async () => gate.promise
  const harness = await loadBootstrap(delegate)
  try {
    const started = harness.module.startWebApplication({
      webOrigin: 'https://staging.stoaedu.ch',
      timeoutMs: 5,
      renderFailure: () => events.push(['failure']),
      clearFailure: () => events.push(['clear']),
      loadApplication: async () => {
        events.push(['import-app'])
        return () => undefined
      },
    })
    await delay(20)
    gate.reject(new Error('descriptor refused'))
    assert.equal(await started, false)
    assert.deepEqual(events.map(([name]) => name), ['failure'])
  } finally {
    harness.cleanup()
  }
})

// #344: a descriptor and a config from two releases - what a visitor got
// between two uploads of the old publisher - ask for the descriptor once more.
test('a release mismatch asks for the descriptor once more, and only once', async () => {
  for (const code of ['runtime_config_digest_mismatch', 'runtime_config_release_mismatch']) {
    const events = []
    const delegate = baseDelegate(events)
    let configCalls = 0
    delegate.initializeRuntimeConfig = async () => {
      configCalls += 1
      events.push(['config'])
      if (configCalls === 1) throw Object.assign(new Error(code), { code })
      return { environment: 'staging' }
    }
    const harness = await loadBootstrap(delegate)
    let starts = 0
    try {
      const started = await harness.module.startWebApplication({
        webOrigin: 'https://staging.stoaedu.ch',
        timeoutMs: 1_000,
        renderFailure: () => events.push(['failure']),
        loadApplication: async () => () => { starts += 1 },
      })
      assert.equal(started, true, code)
      assert.equal(starts, 1, code)
      assert.deepEqual(events.map(([name]) => name), [
        'descriptor', 'project', 'config', 'descriptor', 'project', 'config',
      ], code)
    } finally {
      harness.cleanup()
    }
  }

  for (const [label, codes] of [
    ['mismatch twice', ['runtime_config_digest_mismatch', 'runtime_config_digest_mismatch']],
    ['anything else', ['runtime_config_invalid']],
  ]) {
    const events = []
    const delegate = baseDelegate(events)
    let configCalls = 0
    delegate.initializeRuntimeConfig = async () => {
      const code = codes[configCalls]
      configCalls += 1
      events.push(['config'])
      throw Object.assign(new Error(code), { code })
    }
    const harness = await loadBootstrap(delegate)
    let imports = 0
    try {
      const started = await harness.module.startWebApplication({
        webOrigin: 'https://staging.stoaedu.ch',
        timeoutMs: 1_000,
        renderFailure: () => events.push(['failure']),
        loadApplication: async () => {
          imports += 1
          return () => undefined
        },
      })
      assert.equal(started, false, label)
      assert.equal(imports, 0, label)
      assert.equal(events.filter(([name]) => name === 'descriptor').length, codes.length, label)
      assert.equal(events.at(-1)[0], 'failure', label)
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
  // The message used to be one fixed sentence in Chinese, which this platform
  // does not serve: a German family reading it learned nothing. It renders
  // before i18next exists, so it cannot be a key - it is four sentences chosen
  // by browser language instead. What must not change is what each of them
  // says: no address, no identifier, and no word about what failed.
  const delegate = baseDelegate()
  const harness = await loadBootstrap(delegate)
  try {
    for (const language of ['de', 'en', 'fr', 'it']) {
      const target = fakeFailureTarget()
      harness.module.renderStartupFailure(target, language)
      assert.equal(typeof target.textContent, 'string')
      assert.ok(target.textContent.length > 20, `${language} message is too short to be useful`)
      assert.equal(target.attributes.get('role'), 'alert')
      assert.equal(target.attributes.get('aria-live'), 'assertive')
      assert.doesNotMatch(target.textContent, /https?:|[0-9a-f]{32,}|error|digest|credential/i)
    }

    // Four distinct sentences, so a missing translation cannot pass as one.
    const rendered = new Set(
      ['de', 'en', 'fr', 'it'].map((language) => {
        const target = fakeFailureTarget()
        harness.module.renderStartupFailure(target, language)
        return target.textContent
      }),
    )
    assert.equal(rendered.size, 4)

    // A language the platform does not serve still gets a message.
    const unknown = fakeFailureTarget()
    harness.module.renderStartupFailure(unknown, 'ja')
    assert.match(unknown.textContent, /cannot start/i)

    // The page says which language the sentence is in (#344): index.html says
    // `en`, and a screen reader would read German as English.
    for (const [language, expected] of [['de-CH', 'de'], ['fr', 'fr'], ['it-IT', 'it'], ['en-GB', 'en'], ['ja', 'en']]) {
      const target = fakeFailureTarget()
      harness.module.renderStartupFailure(target, language)
      assert.equal(target.ownerDocument.documentElement.lang, expected, language)
    }

    // Taken down again when a late start mounts over it.
    const cleared = fakeFailureTarget()
    harness.module.renderStartupFailure(cleared, 'de')
    harness.module.clearStartupFailure(cleared)
    assert.equal(cleared.textContent, '')
    assert.equal(cleared.attributes.has('role'), false)
    assert.equal(cleared.attributes.has('aria-live'), false)
  } finally {
    harness.cleanup()
  }
})
