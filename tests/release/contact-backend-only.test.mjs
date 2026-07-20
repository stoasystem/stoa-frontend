import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const contactApiPath = path.join(repoRoot, 'src/services/contact/contactApi.ts')
const browserSourceRoot = path.join(repoRoot, 'src')
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

async function collectBrowserSourceFiles(directory) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...await collectBrowserSourceFiles(entryPath))
    } else if (/\.(?:js|jsx|mjs|ts|tsx)$/u.test(entry.name)) {
      files.push(entryPath)
    }
  }
  return files
}

async function contactHarness({ responseData, postError, viteEnv = {} } = {}) {
  const posts = []
  const browserFetches = []
  const key = `__stoa_contact_test_${moduleSequence}_${Math.random().toString(16).slice(2)}`
  globalThis[key] = {
    viteEnv,
    async post(endpoint, payload) {
      posts.push({ endpoint, payload })
      if (postError !== undefined) throw postError
      return { data: responseData }
    },
    async browserFetch(...args) {
      browserFetches.push(args)
      return { ok: true, status: 200 }
    },
  }

  const envStub = moduleUrl("export const apiMode = 'production'", 'env-stub')
  const httpStub = moduleUrl(`
    const delegate = globalThis[${JSON.stringify(key)}]
    export const httpClient = { post: (...args) => delegate.post(...args) }
  `, 'http-stub')
  const source = await readFile(contactApiPath, 'utf8')
  const testable = source
    .replace(/from ['"]@\/lib\/env['"]/, `from ${JSON.stringify(envStub)}`)
    .replace(
      /from ['"]@\/services\/api\/httpClient['"]/,
      `from ${JSON.stringify(httpStub)}`,
    )
    .replaceAll('import.meta.env', `globalThis[${JSON.stringify(key)}].viteEnv`)
    .replaceAll('fetch(', `globalThis[${JSON.stringify(key)}].browserFetch(`)
  const module = await import(moduleUrl(
    compileTypeScript(testable, contactApiPath),
    'contact-api',
  ))

  return {
    browserFetches,
    cleanup: () => { delete globalThis[key] },
    module,
    posts,
  }
}

const payload = {
  name: 'Ada Student',
  email: 'ada@example.test',
  phone: '+41 00 000 00 00',
  role: 'student',
  topic: 'technical_support',
  message: 'Please help with my account.',
  preferredLanguage: 'en',
}

test('browser source contains no EmailJS or VITE_CONTACT provider policy', async () => {
  const files = await collectBrowserSourceFiles(browserSourceRoot)
  const violations = []
  for (const file of files) {
    const source = await readFile(file, 'utf8')
    if (/emailjs/i.test(source)) violations.push(`${path.relative(repoRoot, file)}:emailjs`)
    if (/VITE_CONTACT_/i.test(source)) violations.push(`${path.relative(repoRoot, file)}:VITE_CONTACT`)
  }

  assert.deepEqual(violations, [])
})

test('contact module contains only the authorized backend submission path', async () => {
  const source = await readFile(contactApiPath, 'utf8')
  const compiled = compileTypeScript(source, contactApiPath)
  const forbidden = [
    ['provider-url', /api\.emailjs\.com/i],
    ['public-key', /oT2sDvEzvUw-khq2T/],
    ['service-id', /service_stoa/],
    ['notification-template-id', /template_g6tviz6/],
    ['auto-reply-template-id', /template_9i4iphq/],
    ['inbox-address', /info@stoaedu\.ch/i],
    ['contact-vite-policy', /VITE_CONTACT_/i],
    ['fallback-helper', /sendContactEmailFallback/],
    ['provider-helper', /sendEmailJsTemplate/],
    ['inbox-config', /contactInboxEmail/],
    ['compile-time-env', /import\.meta\.env/],
    ['browser-fetch', /\bfetch\s*\(/],
    ['browser-request-id', /crypto\.randomUUID/],
    ['synthetic-receipt-id', /contact-request-/],
  ]
  const violations = []
  for (const [label, pattern] of forbidden) {
    if (pattern.test(source)) violations.push(`${label}:source`)
    if (pattern.test(compiled)) violations.push(`${label}:compiled`)
  }

  assert.deepEqual(violations, [])
})

test('successful backend receipt passes through unchanged', async () => {
  const receipt = {
    ok: true,
    requestId: 'server-owned-request-id',
    emailDelivery: {
      enabled: true,
      notificationSent: true,
      autoReplySent: false,
    },
  }
  const harness = await contactHarness({ responseData: receipt })
  try {
    const result = await harness.module.submitContactRequest(payload)
    assert.equal(result, receipt)
    assert.deepEqual(harness.posts, [{ endpoint: '/contact/requests', payload }])
    assert.equal(harness.browserFetches.length, 0)
  } finally {
    harness.cleanup()
  }
})

test('network, backend, validation, and authorization failures remain exact failures', async () => {
  const failures = [
    new Error('Network Error'),
    Object.assign(new Error('Backend unavailable'), { status: 503 }),
    Object.assign(new Error('Validation failed'), { status: 422 }),
    Object.assign(new Error('Forbidden'), { status: 403 }),
  ]

  for (const failure of failures) {
    const harness = await contactHarness({
      postError: failure,
      viteEnv: {
        VITE_CONTACT_EMAILJS_FALLBACK: 'true',
        VITE_CONTACT_EMAILJS_PUBLIC_KEY: 'attacker-controlled',
      },
    })
    try {
      await assert.rejects(
        harness.module.submitContactRequest(payload),
        (error) => error === failure,
      )
      assert.deepEqual(harness.posts, [{ endpoint: '/contact/requests', payload }])
      assert.equal(harness.browserFetches.length, 0)
    } finally {
      harness.cleanup()
    }
  }
})
