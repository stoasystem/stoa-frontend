import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  STEP_DEFINITIONS,
  ReleaseVerificationError,
  parseCli,
  validateWebGateReceipt,
  verifyWebRelease,
} from '../../scripts/verify-release.mjs'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const externalOutput = '/tmp/stoa-web-gate-run.json'
const sha = (character) => character.repeat(64)

function checkout(overrides = {}) {
  return {
    nodeModules: 'absent',
    dist: 'absent',
    alternateLocks: [],
    nativeRoots: [],
    packageJson: { bytes: 100, sha256: sha('1') },
    packageLock: { bytes: 200, sha256: sha('2') },
    sourceTreeSha256: sha('3'),
    ...overrides,
  }
}

function artifact(overrides = {}) {
  return {
    path: 'dist',
    files: 3,
    bytes: 300,
    treeSha256: sha('4'),
    sourceMaps: [],
    forbiddenMatches: [],
    ...overrides,
  }
}

function harness(overrides = {}) {
  const calls = []
  const published = []
  let invalidations = 0
  const initial = overrides.checkout ?? checkout()
  const finalLock = overrides.finalLock ?? initial.packageLock
  const finalSource = overrides.finalSource ?? initial.sourceTreeSha256
  const commandResults = overrides.commandResults ?? new Map()

  const operations = {
    runtimeIdentity: async () => ({
      node: '20.20.2',
      npm: '10.8.2',
      platform: 'darwin',
      arch: 'arm64',
      ...(overrides.runtime ?? {}),
    }),
    inspectCheckout: async () => initial,
    readPackageLockIdentity: async () => finalLock,
    hashSourceTree: async () => finalSource,
    runCommand: async (step) => {
      calls.push(structuredClone(step))
      return commandResults.get(step.id) ?? {
        exitCode: 0,
        stdout: Buffer.from(`private stdout from ${step.id}`),
        stderr: Buffer.alloc(0),
      }
    },
    inspectArtifact: async () => overrides.artifact ?? artifact(),
    invalidateOutput: async () => { invalidations += 1 },
    publishReceipt: async (_output, receipt) => { published.push(structuredClone(receipt)) },
  }

  return {
    calls,
    operations,
    published,
    get invalidations() { return invalidations },
  }
}

async function expectPolicyFailure(promise, code) {
  await assert.rejects(
    promise,
    (error) => error instanceof ReleaseVerificationError && error.code === code,
  )
}

test('package scripts and schema define one closed five-step Web gate', async () => {
  const packageJson = JSON.parse(await readFile(path.join(repoRoot, 'package.json'), 'utf8'))
  const schema = JSON.parse(await readFile(
    path.join(repoRoot, 'schemas/release/web-gate-run-v1.schema.json'),
    'utf8',
  ))

  assert.equal(packageJson.scripts.lint, 'eslint . --max-warnings=0')
  assert.equal(packageJson.scripts.typecheck, 'tsc -b')
  assert.equal(packageJson.scripts['test:release'], [
    'node --test',
    'tests/release/contact-backend-only.test.mjs',
    'tests/release/runtime-config.test.mjs',
    'tests/release/runtime-env-projection.test.mjs',
    'tests/release/runtime-monitoring-flag.test.mjs',
    'tests/release/runtime-startup-barrier.test.mjs',
    'tests/release/served-release.test.mjs',
  ].join(' '))
  assert.equal(packageJson.scripts['verify:release'], 'node ./scripts/verify-release.mjs verify')
  assert.deepEqual(STEP_DEFINITIONS, [
    { id: 'frontend-locked-install', argv: ['npm', 'ci', '--no-audit'] },
    { id: 'frontend-eslint', argv: ['npm', 'run', 'lint'] },
    { id: 'frontend-typecheck', argv: ['npm', 'run', 'typecheck'] },
    { id: 'frontend-build', argv: ['npm', 'run', 'build'] },
    { id: 'web-release-contracts', argv: ['npm', 'run', 'test:release'] },
  ])
  assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema')
  assert.equal(schema.additionalProperties, false)
  assert.equal(schema.properties.schema.const, 'stoa.web.gate-run.v1')
  assert.equal(schema.properties.status.const, 'PASS')
  assert.deepEqual(
    schema.properties.steps.prefixItems.map((item) => item.properties.id.const),
    [
      'frontend-locked-install',
      'frontend-eslint',
      'frontend-typecheck',
      'frontend-build',
      'web-release-contracts',
    ],
  )
  assert.equal(schema.properties.steps.items, false)
  assert.equal(schema.properties.production.additionalProperties, false)
  for (const value of Object.values(schema.properties.production.properties)) {
    assert.equal(value.const, 'NOT RUN')
  }
})

test('CLI accepts only verify with one absolute source-external output', () => {
  assert.deepEqual(parseCli(['verify', '--output', externalOutput], { repoRoot }), {
    command: 'verify',
    outputPath: externalOutput,
  })

  for (const argv of [
    [],
    ['self-test', '--output', externalOutput],
    ['verify'],
    ['verify', '--output', 'relative.json'],
    ['verify', '--output', path.join(repoRoot, '..', path.basename(repoRoot), 'receipt.json')],
    ['verify', '--output', externalOutput, '--root', '/tmp/attacker'],
    ['verify', '--output', externalOutput, '--output', '/tmp/second.json'],
  ]) {
    assert.throws(() => parseCli(argv, { repoRoot }), ReleaseVerificationError, argv.join(' '))
  }
})

test('the verifier runs only the exact ordered local Web commands', async () => {
  const state = harness()
  const receipt = await verifyWebRelease({
    outputPath: externalOutput,
    repoRoot: '/snapshot/stoa-frontend',
    operations: state.operations,
  })

  assert.deepEqual(state.calls, STEP_DEFINITIONS)
  assert.deepEqual(receipt.steps.map(({ id, argv }) => ({ id, argv })), STEP_DEFINITIONS)
  assert.deepEqual(receipt.counts, { total: 5, passed: 5, failed: 0, omitted: 0 })
  assert.deepEqual(receipt.production, {
    infrastructure: 'NOT RUN',
    deploy: 'NOT RUN',
    smoke: 'NOT RUN',
    rollback: 'NOT RUN',
  })
  assert.equal(receipt.status, 'PASS')
  assert.equal(state.invalidations, 1)
  assert.equal(state.published.length, 1)
  assert.deepEqual(state.published[0], receipt)
})

test('receipt stores output hashes and counts without diagnostics or environment values', async () => {
  const secret = 'AWS_SECRET_ACCESS_KEY=must-not-be-serialized'
  const state = harness({
    commandResults: new Map([[
      'frontend-eslint',
      { exitCode: 0, stdout: Buffer.from(secret), stderr: Buffer.from('private stderr') },
    ]]),
  })
  const receipt = await verifyWebRelease({
    outputPath: externalOutput,
    repoRoot: '/snapshot/stoa-frontend',
    operations: state.operations,
  })
  const serialized = JSON.stringify(receipt)

  assert.doesNotMatch(serialized, /must-not-be-serialized|private stderr|private stdout/)
  assert.doesNotMatch(serialized, /environment|process\.env|VITE_/i)
  for (const step of receipt.steps) {
    assert.match(step.stdoutSha256, /^[0-9a-f]{64}$/)
    assert.match(step.stderrSha256, /^[0-9a-f]{64}$/)
    assert.deepEqual(Object.keys(step), [
      'id', 'argv', 'status', 'exitCode', 'counts', 'stdoutSha256', 'stderrSha256',
    ])
  }
  assert.equal(validateWebGateReceipt(receipt), receipt)
})

test('wrong runtime, warm trees, alternate locks, and native roots fail before execution', async () => {
  const cases = [
    ['NODE_MAJOR_UNSUPPORTED', { runtime: { node: '22.1.0' } }],
    ['NODE_MODULES_PRESENT', { checkout: checkout({ nodeModules: 'directory' }) }],
    ['NODE_MODULES_PRESENT', { checkout: checkout({ nodeModules: 'symlink' }) }],
    ['DIST_PRESENT', { checkout: checkout({ dist: 'directory' }) }],
    ['ALTERNATE_LOCK_PRESENT', { checkout: checkout({ alternateLocks: ['pnpm-lock.yaml'] }) }],
    ['NATIVE_SOURCE_PRESENT', { checkout: checkout({ nativeRoots: ['ios'] }) }],
  ]

  for (const [code, options] of cases) {
    const state = harness(options)
    await expectPolicyFailure(verifyWebRelease({
      outputPath: externalOutput,
      repoRoot: '/snapshot/stoa-frontend',
      operations: state.operations,
    }), code)
    assert.deepEqual(state.calls, [], code)
    assert.equal(state.published.length, 0, code)
    assert.equal(state.invalidations, 1, code)
  }
})

test('missing or drifting committed inputs fail closed without publication', async () => {
  const cases = [
    ['PACKAGE_LOCK_MISSING', { checkout: checkout({ packageLock: null }) }],
    ['PACKAGE_LOCK_DRIFT', {
      finalLock: { bytes: 201, sha256: sha('9') },
    }],
    ['SOURCE_TREE_DRIFT', { finalSource: sha('8') }],
  ]

  for (const [code, options] of cases) {
    const state = harness(options)
    await expectPolicyFailure(verifyWebRelease({
      outputPath: externalOutput,
      repoRoot: '/snapshot/stoa-frontend',
      operations: state.operations,
    }), code)
    assert.equal(state.published.length, 0, code)
  }
})

test('a failed or malformed command cannot become a partial PASS', async () => {
  for (const result of [
    { exitCode: 1, stdout: Buffer.alloc(0), stderr: Buffer.from('lint failed') },
    { exitCode: 0, stdout: 'not bytes', stderr: Buffer.alloc(0) },
  ]) {
    const state = harness({
      commandResults: new Map([['frontend-eslint', result]]),
    })
    await expectPolicyFailure(verifyWebRelease({
      outputPath: externalOutput,
      repoRoot: '/snapshot/stoa-frontend',
      operations: state.operations,
    }), result.exitCode === 0 ? 'COMMAND_RESULT_INVALID' : 'COMMAND_FAILED')
    assert.deepEqual(state.calls.map(({ id }) => id), [
      'frontend-locked-install',
      'frontend-eslint',
    ])
    assert.equal(state.published.length, 0)
  }
})

test('source maps and compile-time contact or monitoring configuration fail artifact inspection', async () => {
  for (const [code, badArtifact] of [
    ['SOURCE_MAP_PRESENT', artifact({ sourceMaps: ['assets/app.js.map'] })],
    ['FORBIDDEN_BUILD_CONFIGURATION', artifact({
      forbiddenMatches: [{ path: 'assets/app.js', rule: 'VITE_CONTACT_' }],
    })],
  ]) {
    const state = harness({ artifact: badArtifact })
    await expectPolicyFailure(verifyWebRelease({
      outputPath: externalOutput,
      repoRoot: '/snapshot/stoa-frontend',
      operations: state.operations,
    }), code)
    assert.equal(state.published.length, 0)
  }
})

test('closed receipt validation rejects unknown, omitted, reordered, and synthetic PASS fields', async () => {
  const state = harness()
  const receipt = await verifyWebRelease({
    outputPath: externalOutput,
    repoRoot: '/snapshot/stoa-frontend',
    operations: state.operations,
  })
  const mutations = [
    (value) => { value.extra = true },
    (value) => { value.steps.pop() },
    (value) => { [value.steps[0], value.steps[1]] = [value.steps[1], value.steps[0]] },
    (value) => { value.steps[0].argv = ['npx', 'eslint', '.'] },
    (value) => { value.steps[0].exitCode = 1 },
    (value) => { value.counts.passed = 4 },
    (value) => { value.production.deploy = 'PASS' },
    (value) => { value.environment = { TOKEN: 'secret' } },
  ]

  for (const mutate of mutations) {
    const value = structuredClone(receipt)
    mutate(value)
    assert.throws(() => validateWebGateReceipt(value), ReleaseVerificationError)
  }
})
