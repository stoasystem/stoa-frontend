#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { Buffer } from 'node:buffer'
import { createHash, randomBytes } from 'node:crypto'
import {
  lstat,
  mkdir,
  mkdtemp,
  open,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  unlink,
} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { clearTimeout, setTimeout } from 'node:timers'
import { fileURLToPath } from 'node:url'

const SCRIPT_PATH = fileURLToPath(import.meta.url)
const DEFAULT_REPO_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..')
const SHA256_PATTERN = /^[0-9a-f]{64}$/
const VERSION_PATTERN = /^[0-9]+\.[0-9]+\.[0-9]+$/
const MAX_COMMAND_OUTPUT_BYTES = 16 * 1024 * 1024
const COMMAND_TIMEOUT_MS = 15 * 60 * 1000
const EXCLUDED_SOURCE_ROOTS = new Set(['.git', 'dist', 'node_modules'])
const ALTERNATE_LOCKS = Object.freeze([
  '.npmrc',
  '.pnpmfile.cjs',
  '.yarnrc',
  '.yarnrc.yml',
  'bun.lock',
  'bun.lockb',
  'bunfig.toml',
  'npm-shrinkwrap.json',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'yarn.lock',
])
const NATIVE_ROOTS = Object.freeze([
  'android',
  'ios',
  'mobile',
  'native',
  'src-native',
])
const FORBIDDEN_ARTIFACT_RULES = Object.freeze([
  ['VITE_CONTACT_', /VITE_CONTACT_/i],
  ['VITE_ENABLE_FRONTEND_MONITORING', /VITE_ENABLE_FRONTEND_MONITORING/i],
  ['api.emailjs.com', /api\.emailjs\.com/i],
  ['emailjs-public-key', /oT2sDvEzvUw-khq2T/],
  ['emailjs-service-id', /service_stoa/],
  ['emailjs-notification-template', /template_g6tviz6/],
  ['emailjs-auto-reply-template', /template_9i4iphq/],
])

export const STEP_DEFINITIONS = Object.freeze([
  {
    id: 'frontend-locked-install',
    argv: Object.freeze([
      'npm',
      'ci',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--include=dev',
      '--package-lock=true',
    ]),
  },
  { id: 'frontend-eslint', argv: Object.freeze(['npm', 'run', 'lint']) },
  { id: 'frontend-typecheck', argv: Object.freeze(['npm', 'run', 'typecheck']) },
  { id: 'frontend-build', argv: Object.freeze(['npm', 'run', 'build']) },
  { id: 'web-release-contracts', argv: Object.freeze(['npm', 'run', 'test:release']) },
].map((step) => Object.freeze(step)))

const REQUIRED_PACKAGE_SCRIPTS = Object.freeze({
  build: 'tsc -b && node ./scripts/vite.mjs build',
  lint: 'eslint . --max-warnings=0',
  'test:release': [
    'node --test',
    'tests/release/contact-backend-only.test.mjs',
    'tests/release/runtime-config.test.mjs',
    'tests/release/runtime-env-projection.test.mjs',
    'tests/release/runtime-monitoring-flag.test.mjs',
    'tests/release/runtime-startup-barrier.test.mjs',
    'tests/release/served-release.test.mjs',
  ].join(' '),
  typecheck: 'tsc -b',
  'verify:release': 'node ./scripts/verify-release.mjs verify',
})

export class ReleaseVerificationError extends Error {
  constructor(code) {
    super(code)
    this.name = 'ReleaseVerificationError'
    this.code = code
  }
}

function fail(code) {
  throw new ReleaseVerificationError(code)
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function canonicalize(value) {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') {
    return JSON.stringify(value)
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(',')}]`
  }
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => (
      `${JSON.stringify(key)}:${canonicalize(value[key])}`
    )).join(',')}}`
  }
  fail('RECEIPT_VALUE_INVALID')
}

function isWithin(root, candidate) {
  const relative = path.relative(path.resolve(root), path.resolve(candidate))
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))
}

function assertExternalOutputPath(outputPath, repoRoot) {
  if (typeof outputPath !== 'string' || outputPath.includes('\0') || !path.isAbsolute(outputPath)) {
    fail('OUTPUT_PATH_INVALID')
  }
  if (isWithin(repoRoot, outputPath)) fail('OUTPUT_PATH_INTERNAL')
  return path.normalize(outputPath)
}

export function parseCli(argv, { repoRoot = DEFAULT_REPO_ROOT } = {}) {
  if (
    !Array.isArray(argv)
    || argv.length !== 3
    || argv[0] !== 'verify'
    || argv[1] !== '--output'
  ) {
    fail('CLI_INVALID')
  }
  return {
    command: 'verify',
    outputPath: assertExternalOutputPath(argv[2], repoRoot),
  }
}

export function buildCommandEnvironment({
  ambient = process.env,
  nodeBinDirectory,
  repoRoot,
  tempRoot,
}) {
  void ambient
  return {
    CI: 'true',
    HOME: path.join(tempRoot, 'home'),
    LANG: 'C',
    LC_ALL: 'C',
    NPM_CONFIG_GLOBALCONFIG: path.join(tempRoot, 'npm-globalrc'),
    NPM_CONFIG_USERCONFIG: path.join(tempRoot, 'npm-userrc'),
    NO_COLOR: '1',
    PATH: [path.join(repoRoot, 'node_modules', '.bin'), nodeBinDirectory].join(path.delimiter),
    TMPDIR: path.join(tempRoot, 'tmp'),
    TZ: 'UTC',
    npm_config_cache: path.join(tempRoot, 'npm-cache'),
    npm_config_script_shell: '/bin/sh',
  }
}

export function validatePackageManifest(manifest) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    fail('PACKAGE_JSON_INVALID')
  }
  if (!manifest.scripts || typeof manifest.scripts !== 'object' || Array.isArray(manifest.scripts)) {
    fail('PACKAGE_SCRIPT_DRIFT')
  }
  for (const [name, expected] of Object.entries(REQUIRED_PACKAGE_SCRIPTS)) {
    if (manifest.scripts[name] !== expected) fail('PACKAGE_SCRIPT_DRIFT')
  }
  for (const name of ['lint', 'typecheck', 'build', 'test:release', 'verify:release']) {
    if (`pre${name}` in manifest.scripts || `post${name}` in manifest.scripts) {
      fail('PACKAGE_SCRIPT_DRIFT')
    }
  }
  if ('packageManager' in manifest || 'workspaces' in manifest) fail('ALTERNATE_PACKAGE_MANAGER')
  return manifest
}

async function pathKind(target) {
  try {
    const value = await lstat(target)
    if (value.isSymbolicLink()) return 'symlink'
    if (value.isDirectory()) return 'directory'
    if (value.isFile()) return 'file'
    return 'other'
  } catch (error) {
    if (error?.code === 'ENOENT') return 'absent'
    fail('CHECKOUT_INSPECTION_FAILED')
  }
}

async function readIdentity(target, { missingCode, invalidCode }) {
  let metadata
  try {
    metadata = await lstat(target)
  } catch (error) {
    if (error?.code === 'ENOENT') {
      if (missingCode === null) return null
      fail(missingCode)
    }
    fail(invalidCode)
  }
  if (!metadata.isFile() || metadata.isSymbolicLink()) fail(invalidCode)
  const bytes = await readFile(target)
  if (bytes.length === 0) fail(invalidCode)
  return { bytes: bytes.length, sha256: sha256(bytes) }
}

function compareNames(left, right) {
  return Buffer.compare(Buffer.from(left), Buffer.from(right))
}

async function hashRegularTree(root, { excludeSourceRoots = false, inspectArtifact = false } = {}) {
  const rootMetadata = await lstat(root).catch((error) => {
    if (error?.code === 'ENOENT') return null
    fail(inspectArtifact ? 'ARTIFACT_INSPECTION_FAILED' : 'SOURCE_INSPECTION_FAILED')
  })
  if (!rootMetadata) {
    if (inspectArtifact) fail('ARTIFACT_MISSING')
    fail('SOURCE_INSPECTION_FAILED')
  }
  if (!rootMetadata.isDirectory() || rootMetadata.isSymbolicLink()) {
    fail(inspectArtifact ? 'ARTIFACT_INVALID' : 'SOURCE_INSPECTION_FAILED')
  }

  const digest = createHash('sha256')
  const sourceMaps = []
  const forbiddenMatches = []
  let files = 0
  let bytes = 0

  async function visit(directory, prefix) {
    let names
    try {
      names = (await readdir(directory)).sort(compareNames)
    } catch {
      fail(inspectArtifact ? 'ARTIFACT_INSPECTION_FAILED' : 'SOURCE_INSPECTION_FAILED')
    }
    for (const name of names) {
      if (name.includes('\0') || name.includes('/') || name.includes('\\')) {
        fail(inspectArtifact ? 'ARTIFACT_INVALID' : 'SOURCE_INSPECTION_FAILED')
      }
      if (excludeSourceRoots && prefix === '' && EXCLUDED_SOURCE_ROOTS.has(name)) continue
      const relative = prefix === '' ? name : `${prefix}/${name}`
      const absolute = path.join(directory, name)
      let metadata
      try {
        metadata = await lstat(absolute)
      } catch {
        fail(inspectArtifact ? 'ARTIFACT_INSPECTION_FAILED' : 'SOURCE_INSPECTION_FAILED')
      }
      if (metadata.isSymbolicLink()) {
        fail(inspectArtifact ? 'ARTIFACT_INVALID' : 'SOURCE_SYMLINK_PRESENT')
      }
      if (metadata.isDirectory()) {
        digest.update(`directory\0${relative}\0`)
        await visit(absolute, relative)
        continue
      }
      if (!metadata.isFile()) {
        fail(inspectArtifact ? 'ARTIFACT_INVALID' : 'SOURCE_ENTRY_INVALID')
      }
      const content = await readFile(absolute).catch(() => {
        fail(inspectArtifact ? 'ARTIFACT_INSPECTION_FAILED' : 'SOURCE_INSPECTION_FAILED')
      })
      const executable = (metadata.mode & 0o111) === 0 ? '0' : '1'
      digest.update(`file\0${relative}\0${executable}\0${content.length}\0`)
      digest.update(content)
      files += 1
      bytes += content.length

      if (inspectArtifact) {
        if (/\.map$/i.test(relative) || /sourceMappingURL\s*=/i.test(content.toString('latin1'))) {
          sourceMaps.push(relative)
        }
        const searchable = content.toString('latin1')
        for (const [rule, pattern] of FORBIDDEN_ARTIFACT_RULES) {
          if (pattern.test(searchable)) forbiddenMatches.push({ path: relative, rule })
        }
      }
    }
  }

  await visit(root, '')
  return {
    bytes,
    files,
    forbiddenMatches,
    sourceMaps,
    treeSha256: digest.digest('hex'),
  }
}

async function inspectCheckout(repoRoot) {
  const alternateLocks = []
  for (const name of ALTERNATE_LOCKS) {
    if (await pathKind(path.join(repoRoot, name)) !== 'absent') alternateLocks.push(name)
  }
  const nativeRoots = []
  for (const name of NATIVE_ROOTS) {
    if (await pathKind(path.join(repoRoot, name)) !== 'absent') nativeRoots.push(name)
  }
  const packageJson = await readIdentity(path.join(repoRoot, 'package.json'), {
    invalidCode: 'PACKAGE_JSON_INVALID',
    missingCode: 'PACKAGE_JSON_MISSING',
  })
  try {
    validatePackageManifest(JSON.parse(await readFile(path.join(repoRoot, 'package.json'), 'utf8')))
  } catch (error) {
    if (error instanceof ReleaseVerificationError) throw error
    fail('PACKAGE_JSON_INVALID')
  }
  const packageLock = await readIdentity(path.join(repoRoot, 'package-lock.json'), {
    invalidCode: 'PACKAGE_LOCK_INVALID',
    missingCode: null,
  })
  const source = await hashRegularTree(repoRoot, { excludeSourceRoots: true })
  return {
    alternateLocks,
    dist: await pathKind(path.join(repoRoot, 'dist')),
    nativeRoots,
    nodeModules: await pathKind(path.join(repoRoot, 'node_modules')),
    packageJson,
    packageLock,
    sourceTreeSha256: source.treeSha256,
  }
}

async function resolveActiveDistribution() {
  if (!/^20\./.test(process.versions.node)) fail('NODE_MAJOR_UNSUPPORTED')
  let executable
  try {
    executable = await realpath(process.execPath)
  } catch {
    fail('NODE_DISTRIBUTION_INVALID')
  }
  const nodeBinDirectory = path.dirname(executable)
  const prefix = path.dirname(nodeBinDirectory)
  const npmRoot = path.join(prefix, 'lib', 'node_modules', 'npm')
  const npmCliPath = path.join(npmRoot, 'bin', 'npm-cli.js')
  const npmPackagePath = path.join(npmRoot, 'package.json')
  const cliKind = await pathKind(npmCliPath)
  if (cliKind !== 'file') fail('NPM_DISTRIBUTION_INVALID')
  let npmPackage
  try {
    npmPackage = JSON.parse(await readFile(npmPackagePath, 'utf8'))
  } catch {
    fail('NPM_DISTRIBUTION_INVALID')
  }
  if (typeof npmPackage.version !== 'string' || !VERSION_PATTERN.test(npmPackage.version)) {
    fail('NPM_DISTRIBUTION_INVALID')
  }
  return {
    executable: process.execPath,
    nodeBinDirectory,
    npm: npmPackage.version,
    npmCliPath,
  }
}

function runNpmCommand({ distribution, environment, repoRoot, step }) {
  if (!STEP_DEFINITIONS.some((definition) => definition === step)) fail('COMMAND_DEFINITION_INVALID')
  const args = [distribution.npmCliPath, ...step.argv.slice(1)]
  return new Promise((resolve, reject) => {
    const child = spawn(distribution.executable, args, {
      cwd: repoRoot,
      env: environment,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    const stdout = []
    const stderr = []
    let outputBytes = 0
    let timedOut = false
    let overflowed = false
    const timeout = setTimeout(() => {
      timedOut = true
      child.kill('SIGKILL')
    }, COMMAND_TIMEOUT_MS)

    const collect = (chunks) => (chunk) => {
      outputBytes += chunk.length
      if (outputBytes > MAX_COMMAND_OUTPUT_BYTES) {
        overflowed = true
        child.kill('SIGKILL')
        return
      }
      chunks.push(chunk)
    }
    child.stdout.on('data', collect(stdout))
    child.stderr.on('data', collect(stderr))
    child.once('error', () => {
      clearTimeout(timeout)
      reject(new ReleaseVerificationError('COMMAND_START_FAILED'))
    })
    child.once('close', (code, signal) => {
      clearTimeout(timeout)
      if (timedOut) {
        reject(new ReleaseVerificationError('COMMAND_TIMEOUT'))
        return
      }
      if (overflowed) {
        reject(new ReleaseVerificationError('COMMAND_OUTPUT_LIMIT'))
        return
      }
      resolve({
        exitCode: Number.isInteger(code) && signal === null ? code : 1,
        stderr: Buffer.concat(stderr),
        stdout: Buffer.concat(stdout),
      })
    })
  })
}

async function validateExternalOutput(outputPath, repoRoot) {
  const normalized = assertExternalOutputPath(outputPath, repoRoot)
  let realRoot
  let realParent
  try {
    [realRoot, realParent] = await Promise.all([
      realpath(repoRoot),
      realpath(path.dirname(normalized)),
    ])
  } catch {
    fail('OUTPUT_PARENT_INVALID')
  }
  if (isWithin(realRoot, realParent)) fail('OUTPUT_PATH_INTERNAL')
  return normalized
}

async function ensurePrivateEmptyConfig(target) {
  let handle
  try {
    handle = await open(target, 'wx', 0o600)
    await handle.chmod(0o600)
    await handle.sync()
    await handle.close()
    handle = null
  } catch (error) {
    if (handle) await handle.close().catch(() => {})
    if (error?.code !== 'EEXIST') fail('NPM_CONFIG_INVALID')
  }

  let metadata
  try {
    metadata = await lstat(target)
  } catch {
    fail('NPM_CONFIG_INVALID')
  }
  if (
    !metadata.isFile()
    || metadata.isSymbolicLink()
    || metadata.size !== 0
    || (metadata.mode & 0o777) !== 0o600
  ) fail('NPM_CONFIG_INVALID')
}

async function invalidateOutput(outputPath, repoRoot) {
  const normalized = await validateExternalOutput(outputPath, repoRoot)
  const kind = await pathKind(normalized)
  if (kind === 'directory' || kind === 'other') fail('OUTPUT_PATH_INVALID')
  if (kind !== 'absent') {
    try {
      await unlink(normalized)
    } catch {
      fail('OUTPUT_INVALIDATION_FAILED')
    }
  }
}

async function publishReceipt(outputPath, receipt, repoRoot) {
  const normalized = await validateExternalOutput(outputPath, repoRoot)
  const temporary = path.join(
    path.dirname(normalized),
    `.${path.basename(normalized)}.${process.pid}.${randomBytes(12).toString('hex')}.tmp`,
  )
  let handle
  try {
    handle = await open(temporary, 'wx', 0o600)
    await handle.writeFile(`${canonicalize(receipt)}\n`, 'utf8')
    await handle.sync()
    await handle.close()
    handle = null
    await rename(temporary, normalized)
  } catch {
    if (handle) await handle.close().catch(() => {})
    await unlink(temporary).catch(() => {})
    fail('OUTPUT_PUBLICATION_FAILED')
  }
}

function createDefaultOperations(repoRoot) {
  let distributionPromise
  let tempRootPromise
  const distribution = () => {
    distributionPromise ??= resolveActiveDistribution()
    return distributionPromise
  }
  const tempRoot = () => {
    tempRootPromise ??= mkdtemp(path.join(os.tmpdir(), 'stoa-web-verify-'))
    return tempRootPromise
  }
  async function commandContext() {
    const [active, temporary] = await Promise.all([distribution(), tempRoot()])
    await Promise.all([
      mkdir(path.join(temporary, 'home'), { recursive: true, mode: 0o700 }),
      mkdir(path.join(temporary, 'npm-cache'), { recursive: true, mode: 0o700 }),
      mkdir(path.join(temporary, 'tmp'), { recursive: true, mode: 0o700 }),
      ensurePrivateEmptyConfig(path.join(temporary, 'npm-globalrc')),
      ensurePrivateEmptyConfig(path.join(temporary, 'npm-userrc')),
    ])
    return {
      active,
      environment: buildCommandEnvironment({
        nodeBinDirectory: active.nodeBinDirectory,
        repoRoot,
        tempRoot: temporary,
      }),
    }
  }
  return {
    cleanup: async () => {
      if (tempRootPromise) await rm(await tempRootPromise, { force: true, recursive: true })
    },
    hashSourceTree: async () => (
      await hashRegularTree(repoRoot, { excludeSourceRoots: true })
    ).treeSha256,
    inspectArtifact: async () => ({
      path: 'dist',
      ...await hashRegularTree(path.join(repoRoot, 'dist'), { inspectArtifact: true }),
    }),
    inspectCheckout: async () => inspectCheckout(repoRoot),
    invalidateOutput: async (outputPath) => invalidateOutput(outputPath, repoRoot),
    publishReceipt: async (outputPath, receipt) => publishReceipt(outputPath, receipt, repoRoot),
    readPackageLockIdentity: async () => readIdentity(path.join(repoRoot, 'package-lock.json'), {
      invalidCode: 'PACKAGE_LOCK_INVALID',
      missingCode: null,
    }),
    runCommand: async (step) => {
      const { active, environment } = await commandContext()
      return runNpmCommand({ distribution: active, environment, repoRoot, step })
    },
    runtimeIdentity: async () => {
      const active = await distribution()
      return {
        arch: process.arch,
        node: process.versions.node,
        npm: active.npm,
        platform: process.platform,
      }
    },
  }
}

function assertExactKeys(value, expected, code = 'RECEIPT_INVALID') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(code)
  const actual = Object.keys(value).sort()
  const wanted = [...expected].sort()
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) fail(code)
}

function assertSha(value) {
  if (typeof value !== 'string' || !SHA256_PATTERN.test(value)) fail('RECEIPT_INVALID')
}

function assertIdentity(value) {
  assertExactKeys(value, ['bytes', 'sha256'])
  if (!Number.isInteger(value.bytes) || value.bytes < 1) fail('RECEIPT_INVALID')
  assertSha(value.sha256)
}

function assertPassCounts(value, total) {
  assertExactKeys(value, ['failed', 'omitted', 'passed', 'total'])
  if (
    value.total !== total
    || value.passed !== total
    || value.failed !== 0
    || value.omitted !== 0
  ) fail('RECEIPT_INVALID')
}

export function validateWebGateReceipt(receipt) {
  assertExactKeys(receipt, [
    'artifact',
    'counts',
    'production',
    'receiptSha256',
    'runtime',
    'schema',
    'source',
    'status',
    'steps',
  ])
  if (receipt.schema !== 'stoa.web.gate-run.v1' || receipt.status !== 'PASS') {
    fail('RECEIPT_INVALID')
  }
  assertExactKeys(receipt.runtime, ['arch', 'node', 'npm', 'platform'])
  if (!/^20\.[0-9]+\.[0-9]+$/.test(receipt.runtime.node)) fail('RECEIPT_INVALID')
  if (!VERSION_PATTERN.test(receipt.runtime.npm)) fail('RECEIPT_INVALID')
  for (const field of ['arch', 'platform']) {
    if (typeof receipt.runtime[field] !== 'string' || !/^[a-z0-9_-]{2,32}$/i.test(receipt.runtime[field])) {
      fail('RECEIPT_INVALID')
    }
  }
  assertExactKeys(receipt.source, ['packageJson', 'packageLock', 'treeSha256'])
  assertIdentity(receipt.source.packageJson)
  assertIdentity(receipt.source.packageLock)
  assertSha(receipt.source.treeSha256)
  assertExactKeys(receipt.artifact, ['bytes', 'files', 'path', 'treeSha256'])
  if (
    receipt.artifact.path !== 'dist'
    || !Number.isInteger(receipt.artifact.files)
    || receipt.artifact.files < 1
    || !Number.isInteger(receipt.artifact.bytes)
    || receipt.artifact.bytes < 1
  ) fail('RECEIPT_INVALID')
  assertSha(receipt.artifact.treeSha256)

  if (!Array.isArray(receipt.steps) || receipt.steps.length !== STEP_DEFINITIONS.length) {
    fail('RECEIPT_INVALID')
  }
  for (const [index, step] of receipt.steps.entries()) {
    const definition = STEP_DEFINITIONS[index]
    assertExactKeys(step, [
      'argv',
      'counts',
      'exitCode',
      'id',
      'status',
      'stderrSha256',
      'stdoutSha256',
    ])
    if (
      step.id !== definition.id
      || step.status !== 'PASS'
      || step.exitCode !== 0
      || !Array.isArray(step.argv)
      || step.argv.length !== definition.argv.length
      || step.argv.some((value, position) => value !== definition.argv[position])
    ) fail('RECEIPT_INVALID')
    assertExactKeys(step.counts, ['failed', 'passed', 'total'])
    if (step.counts.total !== 1 || step.counts.passed !== 1 || step.counts.failed !== 0) {
      fail('RECEIPT_INVALID')
    }
    assertSha(step.stdoutSha256)
    assertSha(step.stderrSha256)
  }
  assertPassCounts(receipt.counts, STEP_DEFINITIONS.length)
  assertExactKeys(receipt.production, ['deploy', 'infrastructure', 'rollback', 'smoke'])
  if (Object.values(receipt.production).some((value) => value !== 'NOT RUN')) {
    fail('RECEIPT_INVALID')
  }
  assertSha(receipt.receiptSha256)
  const { receiptSha256, ...body } = receipt
  if (sha256(canonicalize(body)) !== receiptSha256) fail('RECEIPT_DIGEST_MISMATCH')
  return receipt
}

function validateRuntime(runtime) {
  assertExactKeys(runtime, ['arch', 'node', 'npm', 'platform'], 'RUNTIME_IDENTITY_INVALID')
  if (!/^20\.[0-9]+\.[0-9]+$/.test(runtime.node)) fail('NODE_MAJOR_UNSUPPORTED')
  if (!VERSION_PATTERN.test(runtime.npm)) fail('NPM_DISTRIBUTION_INVALID')
  for (const field of ['arch', 'platform']) {
    if (typeof runtime[field] !== 'string' || runtime[field].length === 0) {
      fail('RUNTIME_IDENTITY_INVALID')
    }
  }
}

function validateCheckout(checkout) {
  assertExactKeys(checkout, [
    'alternateLocks',
    'dist',
    'nativeRoots',
    'nodeModules',
    'packageJson',
    'packageLock',
    'sourceTreeSha256',
  ], 'CHECKOUT_INVALID')
  if (checkout.nodeModules !== 'absent') fail('NODE_MODULES_PRESENT')
  if (checkout.dist !== 'absent') fail('DIST_PRESENT')
  if (!Array.isArray(checkout.alternateLocks)) fail('CHECKOUT_INVALID')
  if (checkout.alternateLocks.length !== 0) fail('ALTERNATE_LOCK_PRESENT')
  if (!Array.isArray(checkout.nativeRoots)) fail('CHECKOUT_INVALID')
  if (checkout.nativeRoots.length !== 0) fail('NATIVE_SOURCE_PRESENT')
  assertIdentity(checkout.packageJson)
  if (checkout.packageLock === null) fail('PACKAGE_LOCK_MISSING')
  assertIdentity(checkout.packageLock)
  assertSha(checkout.sourceTreeSha256)
}

function sameIdentity(left, right) {
  return Boolean(
    left
    && right
    && left.bytes === right.bytes
    && left.sha256 === right.sha256,
  )
}

function commandReceipt(step, result) {
  if (
    !result
    || !Number.isInteger(result.exitCode)
    || !Buffer.isBuffer(result.stdout)
    || !Buffer.isBuffer(result.stderr)
  ) fail('COMMAND_RESULT_INVALID')
  if (result.exitCode !== 0) fail('COMMAND_FAILED')
  return {
    id: step.id,
    argv: [...step.argv],
    status: 'PASS',
    exitCode: 0,
    counts: { total: 1, passed: 1, failed: 0 },
    stdoutSha256: sha256(result.stdout),
    stderrSha256: sha256(result.stderr),
  }
}

export async function verifyWebRelease({
  operations,
  outputPath,
  repoRoot = DEFAULT_REPO_ROOT,
}) {
  const normalizedRoot = path.resolve(repoRoot)
  const normalizedOutput = assertExternalOutputPath(outputPath, normalizedRoot)
  const activeOperations = operations ?? createDefaultOperations(normalizedRoot)
  let cleaned = false
  try {
    await activeOperations.invalidateOutput(normalizedOutput)
    const runtime = await activeOperations.runtimeIdentity()
    validateRuntime(runtime)
    const checkout = await activeOperations.inspectCheckout()
    validateCheckout(checkout)

    const steps = []
    for (const step of STEP_DEFINITIONS) {
      const result = await activeOperations.runCommand(step)
      steps.push(commandReceipt(step, result))
      const currentLock = await activeOperations.readPackageLockIdentity()
      if (!sameIdentity(checkout.packageLock, currentLock)) fail('PACKAGE_LOCK_DRIFT')
    }

    const finalSource = await activeOperations.hashSourceTree()
    if (finalSource !== checkout.sourceTreeSha256) fail('SOURCE_TREE_DRIFT')
    const inspectedArtifact = await activeOperations.inspectArtifact()
    if (!inspectedArtifact || !Array.isArray(inspectedArtifact.sourceMaps)) {
      fail('ARTIFACT_INVALID')
    }
    if (inspectedArtifact.sourceMaps.length !== 0) fail('SOURCE_MAP_PRESENT')
    if (!Array.isArray(inspectedArtifact.forbiddenMatches)) fail('ARTIFACT_INVALID')
    if (inspectedArtifact.forbiddenMatches.length !== 0) fail('FORBIDDEN_BUILD_CONFIGURATION')

    const body = {
      schema: 'stoa.web.gate-run.v1',
      status: 'PASS',
      runtime: { ...runtime },
      source: {
        packageJson: { ...checkout.packageJson },
        packageLock: { ...checkout.packageLock },
        treeSha256: checkout.sourceTreeSha256,
      },
      artifact: {
        path: 'dist',
        files: inspectedArtifact.files,
        bytes: inspectedArtifact.bytes,
        treeSha256: inspectedArtifact.treeSha256,
      },
      steps,
      counts: {
        total: STEP_DEFINITIONS.length,
        passed: STEP_DEFINITIONS.length,
        failed: 0,
        omitted: 0,
      },
      production: {
        infrastructure: 'NOT RUN',
        deploy: 'NOT RUN',
        smoke: 'NOT RUN',
        rollback: 'NOT RUN',
      },
    }
    const receipt = { ...body, receiptSha256: sha256(canonicalize(body)) }
    validateWebGateReceipt(receipt)
    if (activeOperations.cleanup) {
      await activeOperations.cleanup()
      cleaned = true
    }
    await activeOperations.publishReceipt(normalizedOutput, receipt)
    return receipt
  } catch (error) {
    if (!cleaned && activeOperations.cleanup) {
      await activeOperations.cleanup().catch(() => {})
    }
    if (error instanceof ReleaseVerificationError) throw error
    throw new ReleaseVerificationError('VERIFICATION_FAILED')
  }
}

async function main() {
  try {
    const { outputPath } = parseCli(process.argv.slice(2))
    await verifyWebRelease({ outputPath })
  } catch (error) {
    const code = error instanceof ReleaseVerificationError ? error.code : 'VERIFICATION_FAILED'
    process.stderr.write(`web release verification failed: ${code}\n`)
    process.exitCode = 2
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(SCRIPT_PATH)) {
  await main()
}
