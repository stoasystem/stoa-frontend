#!/usr/bin/env node
/**
 * Build runtime-config.json and served-release.json from a Vite dist, upload
 * them with real S3 VersionIds, then invalidate CloudFront.
 *
 * The Web client refuses to start unless both documents are valid JSON with
 * matching SHA-256 digests and S3 version identities.
 */
import { createHash } from 'node:crypto'
import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'
import { spawn } from 'node:child_process'

const SCRIPT_PATH = fileURLToPath(import.meta.url)
const DEFAULT_REPO_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..')
const SHA256_PATTERN = /^[0-9a-f]{64}$/
const VERSION_ID_PATTERN = /^[A-Za-z0-9._~+/-]{8,1024}$/
const MUTABLE_IDENTITIES = new Set([
  'head', 'latest', 'main', 'master', 'develop', 'development',
  'staging', 'staging-pilot', 'production', 'null',
])
const SKIP_NAMES = new Set([
  'runtime-config.json',
  'served-release.json',
  'runtime-config.json.template',
  'served-release.json.template',
])

export const PRODUCTION_DEFAULTS = Object.freeze({
  environment: 'production',
  webOrigin: 'https://app.stoaedu.ch',
  apiOrigin: 'https://api.stoaedu.ch',
  bucket: 'stoa-frontend-562923011260',
  distributionId: 'E27CVAMQHDMW80',
  features: Object.freeze({
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
  }),
})

export class PublishWebReleaseError extends Error {
  constructor(code) {
    super(code)
    this.name = 'PublishWebReleaseError'
    this.code = code
  }
}

function fail(code) {
  throw new PublishWebReleaseError(code)
}

export function sha256Hex(value) {
  return createHash('sha256').update(value).digest('hex')
}

export function canonicalize(value) {
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
  fail('CANONICAL_VALUE_INVALID')
}

export function digestCanonical(value) {
  return sha256Hex(canonicalize(value))
}

function posixRelative(root, filePath) {
  return path.relative(root, filePath).split(path.sep).join('/')
}

export async function listDistFiles(distDir) {
  const files = []
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name)
      if (entry.isDirectory()) {
        await walk(full)
        continue
      }
      if (!entry.isFile()) continue
      if (SKIP_NAMES.has(entry.name)) continue
      files.push(full)
    }
  }
  await walk(distDir)
  files.sort((left, right) => posixRelative(distDir, left).localeCompare(posixRelative(distDir, right)))
  return files
}

export function hashFileTree(entries) {
  const digest = createHash('sha256')
  for (const entry of entries) {
    digest.update(`${entry.path}\0${entry.sha256}\n`)
  }
  return digest.digest('hex')
}

export function buildReleaseIdentities({ frontendArtifactSha256, backendArtifactSha256, environment }) {
  if (!SHA256_PATTERN.test(frontendArtifactSha256) || !SHA256_PATTERN.test(backendArtifactSha256)) {
    fail('RELEASE_HASH_INVALID')
  }
  const releaseId = sha256Hex(`${environment}\n${frontendArtifactSha256}\n${backendArtifactSha256}`)
  const manifestSha256 = sha256Hex(canonicalize({
    environment,
    frontendArtifactSha256,
    backendArtifactSha256,
  }))
  return { releaseId, manifestSha256, frontendArtifactSha256, backendArtifactSha256 }
}

export function buildRuntimeConfig({ release, environment, webOrigin, apiOrigin, features }) {
  const realtimeEnabled = features.realtimeNotifications === true
  return {
    schema: 'stoa.web.runtime-config.v1',
    environment,
    release,
    web: { origin: webOrigin },
    api: { origin: apiOrigin },
    auth: { mode: 'backend-api' },
    realtime: {
      enabled: realtimeEnabled,
      endpoint: realtimeEnabled ? `wss://${new URL(apiOrigin).host}/realtime` : null,
    },
    features: { ...features },
  }
}

export function buildServedRelease({
  release,
  environment,
  webOrigin,
  runtimeConfigSha256,
  runtimeVersionId,
  webEntrySha256,
  webEntryVersionId,
}) {
  assertVersionId(runtimeVersionId)
  assertVersionId(webEntryVersionId)
  return {
    schema: 'stoa.web.served-release.v1',
    environment,
    release,
    runtimeConfig: {
      key: 'runtime-config.json',
      versionId: runtimeVersionId,
      url: `${webOrigin}/runtime-config.json`,
      sha256: runtimeConfigSha256,
    },
    webEntry: {
      key: 'index.html',
      versionId: webEntryVersionId,
      url: `${webOrigin}/index.html`,
      sha256: webEntrySha256,
    },
  }
}

export function assertVersionId(value) {
  if (typeof value !== 'string' || !VERSION_ID_PATTERN.test(value) || MUTABLE_IDENTITIES.has(value.toLowerCase())) {
    fail('VERSION_ID_INVALID')
  }
}

export function contentTypeFor(relativePath) {
  if (relativePath.endsWith('.html')) return 'text/html; charset=utf-8'
  if (relativePath.endsWith('.js') || relativePath.endsWith('.mjs')) return 'text/javascript; charset=utf-8'
  if (relativePath.endsWith('.css')) return 'text/css; charset=utf-8'
  if (relativePath.endsWith('.json')) return 'application/json'
  if (relativePath.endsWith('.svg')) return 'image/svg+xml'
  if (relativePath.endsWith('.woff2')) return 'font/woff2'
  if (relativePath.endsWith('.png')) return 'image/png'
  if (relativePath.endsWith('.ico')) return 'image/x-icon'
  return 'application/octet-stream'
}

export function cacheControlFor(relativePath) {
  if (relativePath === 'index.html' || relativePath.endsWith('.json')) return 'no-store'
  if (relativePath.startsWith('assets/')) return 'public,max-age=31536000,immutable'
  return 'public,max-age=300'
}

function run(argv, { env = process.env } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(argv[0], argv.slice(1), { env, stdio: ['ignore', 'pipe', 'pipe'] })
    const stdout = []
    const stderr = []
    child.stdout.on('data', (chunk) => stdout.push(chunk))
    child.stderr.on('data', (chunk) => stderr.push(chunk))
    child.on('error', reject)
    child.on('close', (code) => {
      const out = Buffer.concat(stdout).toString('utf8').trim()
      const err = Buffer.concat(stderr).toString('utf8').trim()
      if (code !== 0) {
        const error = new PublishWebReleaseError('AWS_COMMAND_FAILED')
        error.detail = err || out
        reject(error)
        return
      }
      resolve(out)
    })
  })
}

export async function putObject({
  bucket, key, body, contentType, cacheControl, runner = run,
}) {
  const out = await runner([
    'aws', 's3api', 'put-object',
    '--bucket', bucket,
    '--key', key,
    '--body', body,
    '--content-type', contentType,
    '--cache-control', cacheControl,
    '--query', 'VersionId',
    '--output', 'text',
  ])
  if (!out || out === 'null' || out === 'None') fail('BUCKET_VERSIONING_REQUIRED')
  assertVersionId(out)
  return out
}

async function requireVersioning(bucket, runner) {
  const raw = await runner([
    'aws', 's3api', 'get-bucket-versioning',
    '--bucket', bucket,
    '--output', 'json',
  ])
  const parsed = JSON.parse(raw || '{}')
  if (parsed.Status !== 'Enabled') fail('BUCKET_VERSIONING_REQUIRED')
}

export async function publishWebRelease({
  distDir,
  bucket = PRODUCTION_DEFAULTS.bucket,
  distributionId = PRODUCTION_DEFAULTS.distributionId,
  environment = PRODUCTION_DEFAULTS.environment,
  webOrigin = PRODUCTION_DEFAULTS.webOrigin,
  apiOrigin = PRODUCTION_DEFAULTS.apiOrigin,
  features = PRODUCTION_DEFAULTS.features,
  backendArtifactSha256,
  runner = run,
}) {
  const indexPath = path.join(distDir, 'index.html')
  await stat(indexPath)
  const files = await listDistFiles(distDir)
  const hashed = []
  for (const filePath of files) {
    const bytes = await readFile(filePath)
    hashed.push({
      path: posixRelative(distDir, filePath),
      sha256: sha256Hex(bytes),
      filePath,
    })
  }
  const frontendArtifactSha256 = hashFileTree(hashed)
  const release = buildReleaseIdentities({
    frontendArtifactSha256,
    backendArtifactSha256,
    environment,
  })
  const runtimeConfig = buildRuntimeConfig({
    release, environment, webOrigin, apiOrigin, features,
  })
  const runtimeConfigSha256 = digestCanonical(runtimeConfig)
  const runtimeConfigPath = path.join(distDir, 'runtime-config.json')
  await writeFile(runtimeConfigPath, `${canonicalize(runtimeConfig)}\n`, 'utf8')

  await requireVersioning(bucket, runner)

  for (const entry of hashed) {
    if (entry.path === 'index.html') continue
    await putObject({
      bucket,
      key: entry.path,
      body: entry.filePath,
      contentType: contentTypeFor(entry.path),
      cacheControl: cacheControlFor(entry.path),
      runner,
    })
  }

  const webEntrySha256 = hashed.find((entry) => entry.path === 'index.html').sha256
  const webEntryVersionId = await putObject({
    bucket,
    key: 'index.html',
    body: indexPath,
    contentType: contentTypeFor('index.html'),
    cacheControl: cacheControlFor('index.html'),
    runner,
  })
  const runtimeVersionId = await putObject({
    bucket,
    key: 'runtime-config.json',
    body: runtimeConfigPath,
    contentType: 'application/json',
    cacheControl: 'no-store',
    runner,
  })

  const servedRelease = buildServedRelease({
    release,
    environment,
    webOrigin,
    runtimeConfigSha256,
    runtimeVersionId,
    webEntrySha256,
    webEntryVersionId,
  })
  const servedPath = path.join(distDir, 'served-release.json')
  await writeFile(servedPath, `${canonicalize(servedRelease)}\n`, 'utf8')
  await putObject({
    bucket,
    key: 'served-release.json',
    body: servedPath,
    contentType: 'application/json',
    cacheControl: 'no-store',
    runner,
  })

  await runner([
    'aws', 'cloudfront', 'create-invalidation',
    '--distribution-id', distributionId,
    '--paths', '/index.html', '/served-release.json', '/runtime-config.json', '/*',
    '--query', 'Invalidation.Id',
    '--output', 'text',
  ])

  return { release, runtimeConfigSha256, runtimeVersionId, webEntryVersionId }
}

function parseArgs(argv) {
  const options = {}
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (!token.startsWith('--')) fail('CLI_INVALID')
    const key = token.slice(2)
    const value = argv[index + 1]
    if (value === undefined || value.startsWith('--')) fail('CLI_INVALID')
    options[key] = value
    index += 1
  }
  return options
}

export async function main(argv = process.argv.slice(2), { repoRoot = DEFAULT_REPO_ROOT, runner = run } = {}) {
  const options = parseArgs(argv)
  const distDir = path.resolve(options.dist || path.join(repoRoot, 'dist'))
  if (!options['backend-artifact-sha256'] || !SHA256_PATTERN.test(options['backend-artifact-sha256'])) {
    fail('BACKEND_ARTIFACT_HASH_REQUIRED')
  }
  const result = await publishWebRelease({
    distDir,
    backendArtifactSha256: options['backend-artifact-sha256'],
    bucket: options.bucket || PRODUCTION_DEFAULTS.bucket,
    distributionId: options['distribution-id'] || PRODUCTION_DEFAULTS.distributionId,
    environment: options.environment || PRODUCTION_DEFAULTS.environment,
    webOrigin: options['web-origin'] || PRODUCTION_DEFAULTS.webOrigin,
    apiOrigin: options['api-origin'] || PRODUCTION_DEFAULTS.apiOrigin,
    runner,
  })
  process.stdout.write(`${JSON.stringify({
    releaseId: result.release.releaseId,
    runtimeConfigSha256: result.runtimeConfigSha256,
  })}\n`)
  return 0
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.code || error.message}\n`)
    process.exit(1)
  })
}
