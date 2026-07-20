import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import {
  chmod,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  STEP_DEFINITIONS,
  ReleaseVerificationError,
  buildCommandEnvironment,
  invalidateWebGateOutput,
  parseCli,
  publishWebGateReceipt,
  validatePackageManifest,
  validateWebGateReceipt,
  verifyWebRelease,
} from '../../scripts/verify-release.mjs'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const externalOutput = '/tmp/stoa-web-gate-run.json'
const sha = (character) => character.repeat(64)
const clone = (value) => JSON.parse(JSON.stringify(value))

function checkout(overrides = {}) {
  return {
    nodeModules: 'absent',
    dist: 'absent',
    alternateLocks: [],
    nativeRoots: [],
    packageJson: { bytes: 100, sha256: sha('1') },
    packageLock: { bytes: 200, sha256: sha('2') },
    projectNpmrc: 'absent',
    runtimeShims: [],
    sourceTreeSha256: sha('3'),
    ...overrides,
  }
}

function executionCheckouts() {
  return [
    checkout(),
    checkout(),
    checkout(),
    checkout({ nodeModules: 'directory' }),
    checkout({ nodeModules: 'directory' }),
    checkout({ nodeModules: 'directory' }),
    checkout({ nodeModules: 'directory' }),
    checkout({ nodeModules: 'directory' }),
    checkout({ nodeModules: 'directory' }),
    checkout({ nodeModules: 'directory', dist: 'directory' }),
    checkout({ nodeModules: 'directory', dist: 'directory' }),
    checkout({ nodeModules: 'directory', dist: 'directory' }),
    checkout({ nodeModules: 'directory', dist: 'directory' }),
  ]
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
  const commandResults = overrides.commandResults ?? new Map()
  const checkoutStates = [...(
    overrides.checkoutStates
    ?? (overrides.checkout ? [initial] : executionCheckouts())
  )]
  const artifactStates = [...(overrides.artifactStates ?? [overrides.artifact ?? artifact()])]
  const nextState = (states) => states.length > 1 ? states.shift() : states[0]

  const operations = {
    runtimeIdentity: async () => ({
      node: '20.20.2',
      npm: '10.8.2',
      platform: 'darwin',
      arch: 'arm64',
      ...(overrides.runtime ?? {}),
    }),
    inspectCheckout: async () => nextState(checkoutStates),
    runCommand: async (step) => {
      calls.push(clone(step))
      return commandResults.get(step.id) ?? {
        exitCode: 0,
        stdout: Buffer.from(`private stdout from ${step.id}`),
        stderr: Buffer.alloc(0),
      }
    },
    inspectArtifact: async () => nextState(artifactStates),
    invalidateOutput: async () => { invalidations += 1 },
    publishReceipt: async (_output, receipt) => { published.push(clone(receipt)) },
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
    {
      id: 'frontend-locked-install',
      argv: [
        'npm',
        'ci',
        '--ignore-scripts',
        '--no-audit',
        '--no-fund',
        '--include=dev',
        '--package-lock=true',
      ],
    },
    { id: 'frontend-eslint', argv: ['npm', 'run', 'lint'] },
    { id: 'frontend-typecheck', argv: ['npm', 'run', 'typecheck'] },
    { id: 'frontend-build', argv: ['npm', 'run', 'build'] },
    { id: 'web-release-contracts', argv: ['npm', 'run', 'test:release'] },
  ])
  assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema')
  assert.equal(schema.additionalProperties, false)
  assert.equal(schema.properties.schema.const, 'stoa.web.gate-run.v1')
  assert.equal(schema.properties.status.const, 'PASS')
  assert.ok(schema.required.includes('receiptSha256'))
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
  assert.deepEqual(
    schema.properties.steps.prefixItems.map((item) => {
      const argvSchema = item.properties.argv.$ref
        ? schema.$defs[item.properties.argv.$ref.split('/').at(-1)]
        : item.properties.argv
      return argvSchema.prefixItems.map(({ const: value }) => value)
    }),
    STEP_DEFINITIONS.map(({ argv }) => [...argv]),
  )
  assert.equal(schema.properties.steps.items, false)
  assert.equal(schema.properties.production.additionalProperties, false)
  for (const value of Object.values(schema.properties.production.properties)) {
    assert.equal(value.const, 'NOT RUN')
  }
})

test('reviewed package scripts cannot be replaced by npx, lifecycle wrappers, or workspaces', async () => {
  const manifest = JSON.parse(await readFile(path.join(repoRoot, 'package.json'), 'utf8'))
  assert.equal(validatePackageManifest(manifest), manifest)

  const mutations = [
    (value) => { value.scripts.lint = 'npx eslint .' },
    (value) => { value.scripts.prebuild = 'node /tmp/attacker.mjs' },
    (value) => { value.scripts['preverify:release'] = 'node /tmp/attacker.mjs' },
    (value) => { value.scripts['postverify:release'] = 'node /tmp/attacker.mjs' },
    (value) => { value.scripts['test:release'] = 'node --test tests/release/*.test.mjs' },
    (value) => { value.packageManager = 'pnpm@10.0.0' },
    (value) => { value.workspaces = ['mobile'] },
  ]
  for (const mutate of mutations) {
    const value = clone(manifest)
    mutate(value)
    assert.throws(() => validatePackageManifest(value), ReleaseVerificationError)
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

test('default CLI rejects a shared output parent before inspecting source', () => {
  const result = spawnSync(process.execPath, [
    path.join(repoRoot, 'scripts/verify-release.mjs'),
    'verify',
    '--output',
    path.join('/tmp', `stoa-web-shared-${randomUUID()}.json`),
  ], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: {
      LANG: 'C',
      LC_ALL: 'C',
      PATH: path.dirname(process.execPath),
      TZ: 'UTC',
    },
  })

  assert.equal(result.status, 2)
  assert.match(result.stderr, /OUTPUT_PARENT_UNSAFE/)
})

test('private output publication replaces stale bytes with one canonical 0600 receipt', async () => {
  const state = harness()
  const receipt = await verifyWebRelease({
    outputPath: externalOutput,
    repoRoot: '/snapshot/stoa-frontend',
    operations: state.operations,
  })
  const parent = await mkdtemp(path.join(os.tmpdir(), 'stoa-web-output-'))
  const output = path.join(parent, 'receipt.json')
  try {
    await writeFile(output, 'stale receipt', { mode: 0o600 })
    await invalidateWebGateOutput(output, repoRoot)
    await publishWebGateReceipt(output, receipt, repoRoot)

    const metadata = await lstat(output)
    const serialized = await readFile(output, 'utf8')
    const parsed = JSON.parse(serialized)
    assert.equal(metadata.isFile(), true)
    assert.equal(metadata.isSymbolicLink(), false)
    assert.equal(metadata.nlink, 1)
    assert.equal(metadata.mode & 0o777, 0o600)
    assert.equal(serialized, `${JSON.stringify(parsed)}\n`)
    assert.equal(validateWebGateReceipt(parsed), parsed)
  } finally {
    await rm(parent, { force: true, recursive: true })
  }
})

test('output publication rejects symlinked or non-private parents', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'stoa-web-parent-'))
  const privateParent = path.join(root, 'private')
  const linkedParent = path.join(root, 'linked')
  try {
    await mkdir(privateParent, { mode: 0o700 })
    await symlink(privateParent, linkedParent, 'dir')
    await expectPolicyFailure(
      invalidateWebGateOutput(path.join(linkedParent, 'receipt.json'), repoRoot),
      'OUTPUT_PARENT_UNSAFE',
    )
    await chmod(privateParent, 0o755)
    await expectPolicyFailure(
      invalidateWebGateOutput(path.join(privateParent, 'receipt.json'), repoRoot),
      'OUTPUT_PARENT_UNSAFE',
    )
  } finally {
    await rm(root, { force: true, recursive: true })
  }
})

test('command environment is deterministic and drops ambient execution and build configuration', () => {
  const environment = buildCommandEnvironment({
    ambient: {
      AWS_SECRET_ACCESS_KEY: 'secret',
      INIT_CWD: '/tmp/attacker-cwd',
      LD_PRELOAD: '/tmp/attacker.so',
      NODE_ENV: 'production',
      NODE_OPTIONS: '--require=/tmp/attacker.cjs',
      NODE_PATH: '/tmp/attacker-modules',
      NPM_CONFIG_USERCONFIG: '/tmp/attacker.npmrc',
      npm_lifecycle_event: 'postinstall',
      npm_config_globalconfig: '/tmp/global-attacker.npmrc',
      VITE_CONTACT_PROVIDER_KEY: 'secret',
      VITE_ENABLE_FRONTEND_MONITORING: 'true',
    },
    nodeBinDirectory: '/node-20/bin',
    repoRoot: '/snapshot/stoa-frontend',
    tempRoot: '/tmp/stoa-web-run',
  })

  assert.deepEqual(environment, {
    CI: 'true',
    HOME: '/tmp/stoa-web-run/home',
    LANG: 'C',
    LC_ALL: 'C',
    NPM_CONFIG_GLOBALCONFIG: '/tmp/stoa-web-run/npm-globalrc',
    NPM_CONFIG_USERCONFIG: '/tmp/stoa-web-run/npm-userrc',
    NO_COLOR: '1',
    PATH: [
      '/node-20/bin',
      '/snapshot/stoa-frontend/node_modules/.bin',
    ].join(path.delimiter),
    TMPDIR: '/tmp/stoa-web-run/tmp',
    TZ: 'UTC',
    npm_config_cache: '/tmp/stoa-web-run/npm-cache',
    npm_config_script_shell: '/bin/sh',
  })
  assert.doesNotMatch(
    JSON.stringify(environment),
    /secret|attacker|VITE_|AWS_|NODE_ENV|NODE_OPTIONS|NODE_PATH|PRELOAD|lifecycle|INIT_CWD/,
  )
  assert.notEqual(
    environment.NPM_CONFIG_GLOBALCONFIG,
    environment.NPM_CONFIG_USERCONFIG,
    'npm rejects loading one path as both the global and user config',
  )
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
  assert.match(receipt.receiptSha256, /^[0-9a-f]{64}$/)
  assert.equal(state.invalidations, 1)
  assert.equal(state.published.length, 1)
  assert.deepEqual(state.published[0], receipt)
})

test('the locked install cannot add a local node, npm, or npx runtime shim', async () => {
  const states = executionCheckouts()
  states[3] = checkout({ nodeModules: 'directory', runtimeShims: ['node'] })
  const state = harness({ checkoutStates: states })

  await expectPolicyFailure(verifyWebRelease({
    outputPath: externalOutput,
    repoRoot: '/snapshot/stoa-frontend',
    operations: state.operations,
  }), 'RUNTIME_SHIM_PRESENT')

  assert.deepEqual(state.calls.map(({ id }) => id), ['frontend-locked-install'])
  assert.equal(state.published.length, 0)
})

test('the locked install must create an ordinary node_modules directory', async () => {
  const states = executionCheckouts()
  states[3] = checkout()
  const state = harness({ checkoutStates: states })

  await expectPolicyFailure(verifyWebRelease({
    outputPath: externalOutput,
    repoRoot: '/snapshot/stoa-frontend',
    operations: state.operations,
  }), 'NODE_MODULES_INVALID')
  assert.equal(state.published.length, 0)
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

test('whole-receipt digest rejects tampering with otherwise valid bound evidence', async () => {
  const state = harness()
  const receipt = await verifyWebRelease({
    outputPath: externalOutput,
    repoRoot: '/snapshot/stoa-frontend',
    operations: state.operations,
  })
  const tampered = clone(receipt)
  tampered.artifact.treeSha256 = sha('f')

  assert.throws(
    () => validateWebGateReceipt(tampered),
    (error) => error instanceof ReleaseVerificationError
      && error.code === 'RECEIPT_DIGEST_MISMATCH',
  )
})

test('wrong runtime, warm trees, alternate locks, and native roots fail before execution', async () => {
  const cases = [
    ['NODE_MAJOR_UNSUPPORTED', { runtime: { node: '22.1.0' } }],
    ['NODE_MODULES_PRESENT', { checkout: checkout({ nodeModules: 'directory' }) }],
    ['NODE_MODULES_PRESENT', { checkout: checkout({ nodeModules: 'symlink' }) }],
    ['DIST_PRESENT', { checkout: checkout({ dist: 'directory' }) }],
    ['ALTERNATE_LOCK_PRESENT', { checkout: checkout({ alternateLocks: ['pnpm-lock.yaml'] }) }],
    ['NATIVE_SOURCE_PRESENT', { checkout: checkout({ nativeRoots: ['ios'] }) }],
    ['PROJECT_NPMRC_PRESENT', { checkout: checkout({ projectNpmrc: 'file' }) }],
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
      checkoutStates: [
        checkout(),
        checkout(),
        checkout(),
        checkout({
          nodeModules: 'directory',
          packageLock: { bytes: 201, sha256: sha('9') },
        }),
      ],
    }],
    ['SOURCE_TREE_DRIFT', {
      checkoutStates: [
        checkout(),
        checkout(),
        checkout(),
        checkout({ nodeModules: 'directory', sourceTreeSha256: sha('8') }),
      ],
    }],
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

test('initial source capture and final source/artifact brackets reject torn state', async () => {
  const cases = [
    ['CHECKOUT_DRIFT', {
      checkoutStates: [checkout(), checkout({ packageJson: { bytes: 101, sha256: sha('8') } })],
    }],
    ['SOURCE_TREE_DRIFT', {
      checkoutStates: [
        checkout(),
        checkout(),
        checkout(),
        checkout({ nodeModules: 'directory', sourceTreeSha256: sha('8') }),
      ],
    }],
    ['ARTIFACT_DRIFT', {
      artifactStates: [artifact(), artifact({ treeSha256: sha('8') })],
    }],
    ['SOURCE_TREE_DRIFT', (() => {
      const states = executionCheckouts()
      states[12] = checkout({
        nodeModules: 'directory',
        dist: 'directory',
        sourceTreeSha256: sha('8'),
      })
      return { checkoutStates: states }
    })()],
    ['ARTIFACT_DRIFT', {
      artifactStates: [artifact(), artifact(), artifact({ treeSha256: sha('8') })],
    }],
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
    const value = clone(receipt)
    mutate(value)
    assert.throws(() => validateWebGateReceipt(value), ReleaseVerificationError)
  }
})
