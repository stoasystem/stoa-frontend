import { createHash } from 'node:crypto'
import {
  closeSync,
  lstatSync,
  openSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from 'node:fs'
import { basename, dirname, isAbsolute, relative, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'

const MAX_METADATA_BYTES = 64 * 1024
const MAX_ACCEPTANCE_SPEC_BYTES = 512 * 1024
const SCRIPT_PATH = fileURLToPath(import.meta.url)

class PreflightError extends Error {
  constructor(code) {
    super(code)
    this.code = code
  }
}

try {
  runPreflight(process.env)
} catch (error) {
  const code = error instanceof PreflightError ? error.code : 'PREFLIGHT_INTERNAL_ERROR'
  process.stderr.write(`${code}\n`)
  process.exitCode = 1
}

function runPreflight(env) {
  requireExactFlag(env, 'STOA_STRIPE_SANDBOX', 'true')
  requireExactFlag(env, 'VITE_ENABLE_DEMO_API', 'false')
  requireExactFlag(env, 'VITE_ENABLE_MOCK_CHECKOUT', 'false')
  requireExactFlag(env, 'VITE_ENABLE_PAYMENT', 'true')
  requireExactFlag(env, 'VITE_SHOW_DEMO_SURFACES', 'false')
  requireExactFlag(env, 'STOA_PLAYWRIGHT_ROUTE_INTERCEPTION', 'false')
  requireExactFlag(env, 'STOA_ALLOW_PRODUCTION_MUTATION', 'false')
  requireExactFlag(env, 'STOA_PLAYWRIGHT_TRACE', 'off')
  requireExactFlag(env, 'STOA_PLAYWRIGHT_VIDEO', 'off')
  requireExactFlag(env, 'STOA_PLAYWRIGHT_SCREENSHOT', 'off')
  requireExactFlag(env, 'STOA_STRIPE_PROVIDER_ACCESS_VERIFIED', 'true')
  requireExactFlag(env, 'STOA_STRIPE_EVENT_DESTINATION_SIGNED', 'true')

  const environment = requireValue(env, 'STOA_STRIPE_SANDBOX_ENVIRONMENT')
  if (!['sandbox', 'staging', 'test'].includes(environment)) fail('ENVIRONMENT_NOT_SANDBOX')

  const webOrigin = exactApprovedOrigin(
    requireValue(env, 'STOA_STRIPE_SANDBOX_WEB_ORIGIN'),
    requireValue(env, 'STOA_STRIPE_APPROVED_WEB_ORIGIN'),
    'WEB_ORIGIN_INVALID',
  )
  const apiOrigin = exactApprovedOrigin(
    requireValue(env, 'STOA_STRIPE_SANDBOX_API_ORIGIN'),
    requireValue(env, 'STOA_STRIPE_APPROVED_API_ORIGIN'),
    'API_ORIGIN_INVALID',
  )
  rejectProductionHost(webOrigin, 'WEB_ORIGIN_PRODUCTION')
  rejectProductionHost(apiOrigin, 'API_ORIGIN_PRODUCTION')

  const checkoutOrigin = parseExactOrigin(
    requireValue(env, 'STOA_STRIPE_CHECKOUT_ORIGIN'),
    'CHECKOUT_ORIGIN_INVALID',
  )
  if (checkoutOrigin !== 'https://checkout.stripe.com') fail('CHECKOUT_NOT_STRIPE_HOSTED')

  const secretKey = requireValue(env, 'STOA_STRIPE_SECRET_KEY')
  if (secretKey.startsWith('sk_live_')) fail('LIVE_KEY_FORBIDDEN')
  if (!secretKey.startsWith('sk_test_') || secretKey.length < 16) fail('TEST_KEY_REQUIRED')

  const webhookSecret = requireValue(env, 'STOA_STRIPE_WEBHOOK_SECRET')
  if (!webhookSecret.startsWith('whsec_') || webhookSecret.length < 12) {
    fail('SIGNED_WEBHOOK_SECRET_REQUIRED')
  }

  const accountId = requireProviderId(env, 'STOA_STRIPE_ACCOUNT_ID', 'acct_')
  const destinationId = requireProviderId(env, 'STOA_STRIPE_EVENT_DESTINATION_ID', 'we_')
  const prices = {
    student: requireProviderId(env, 'STOA_STRIPE_STUDENT_PRICE_ID', 'price_'),
    teacher_supported: requireProviderId(
      env,
      'STOA_STRIPE_TEACHER_SUPPORTED_PRICE_ID',
      'price_',
    ),
    family: requireProviderId(env, 'STOA_STRIPE_FAMILY_PRICE_ID', 'price_'),
  }
  if (new Set(Object.values(prices)).size !== 3) fail('PRICE_IDS_NOT_UNIQUE')

  const eventDestinationVersion = requireValue(
    env,
    'STOA_STRIPE_EVENT_DESTINATION_API_VERSION',
  )
  if (!/^\d{4}-\d{2}-\d{2}(?:\.[a-z]+)?$/.test(eventDestinationVersion)) {
    fail('EVENT_DESTINATION_VERSION_INVALID')
  }

  const enabledPaymentMethods = closedPaymentMethods(
    requireValue(env, 'STOA_STRIPE_ENABLED_PAYMENT_METHODS'),
  )
  const acceptanceSpecPath = requireAcceptanceSpecPath(
    requireValue(env, 'STOA_STRIPE_ACCEPTANCE_SPEC_PATH'),
  )
  const acceptanceSource = readFileSync(acceptanceSpecPath, 'utf8')
  rejectInterceptionSource(acceptanceSource)

  const metadataPath = requireReadableMetadataPath(
    requireValue(env, 'STOA_STRIPE_SANDBOX_METADATA_PATH'),
  )
  const metadata = readMetadata(metadataPath)
  validateMetadata(metadata, {
    accountId,
    destinationId,
    enabledPaymentMethods,
    environment,
    eventDestinationVersion,
    prices,
  })

  const evidenceDirectory = requireEvidenceDirectory(
    requireValue(env, 'STOA_EVIDENCE_OUTPUT_DIR'),
  )
  const receiptPath = requireReceiptPath(
    requireValue(env, 'STOA_STRIPE_SANDBOX_RECEIPT_PATH'),
    evidenceDirectory,
  )

  const counts = countObjects(metadata.objects)
  const receipt = {
    schema: 'stoa.stripe-sandbox-preflight.v1',
    status: 'PASS',
    environment,
    mockDisabled: true,
    routeInterceptionDisabled: true,
    keyMode: 'test',
    priceModes: {
      student: 'test',
      teacher_supported: 'test',
      family: 'test',
    },
    eventDestinationVersion,
    enabledPaymentMethods,
    objectsVerified: counts,
    webOriginSha256: sha256(webOrigin),
    apiOriginSha256: sha256(apiOrigin),
    accountSha256: sha256(accountId),
    eventDestinationSha256: sha256(destinationId),
    acceptanceSourceSha256: sha256(acceptanceSource),
    sourceSha256: sha256(readFileSync(SCRIPT_PATH)),
  }
  publishReceipt(receiptPath, receipt)
}

function fail(code) {
  throw new PreflightError(code)
}

function requireValue(env, name) {
  const value = env[name]
  if (typeof value !== 'string' || value.length === 0) fail(`${name}_REQUIRED`)
  if (value.includes('\u0000') || value.includes('\n') || value.includes('\r')) {
    fail(`${name}_INVALID`)
  }
  return value
}

function requireExactFlag(env, name, expected) {
  if (requireValue(env, name) !== expected) fail(`${name}_FORBIDDEN`)
}

function requireProviderId(env, name, prefix) {
  const value = requireValue(env, name)
  if (!value.startsWith(prefix) || !/^[A-Za-z0-9_]+$/.test(value)) fail(`${name}_INVALID`)
  return value
}

function parseExactOrigin(value, errorCode) {
  let parsed
  try {
    parsed = new URL(value)
  } catch {
    fail(errorCode)
  }
  if (
    parsed.protocol !== 'https:'
    || parsed.username
    || parsed.password
    || parsed.pathname !== '/'
    || parsed.search
    || parsed.hash
    || !parsed.hostname
  ) {
    fail(errorCode)
  }
  if (isLocalHost(parsed.hostname)) fail(errorCode)
  return parsed.origin
}

function exactApprovedOrigin(candidate, approved, errorCode) {
  const parsedCandidate = parseExactOrigin(candidate, errorCode)
  const parsedApproved = parseExactOrigin(approved, errorCode)
  if (candidate !== approved || parsedCandidate !== parsedApproved) fail(errorCode)
  return parsedCandidate
}

function rejectProductionHost(origin, code) {
  const hostname = new URL(origin).hostname.toLowerCase()
  if (
    hostname === 'stoa.example'
    || hostname === 'app.stoa.example'
    || hostname === 'api.stoa.example'
    || hostname.startsWith('prod.')
    || hostname.startsWith('production.')
  ) {
    fail(code)
  }
}

function isLocalHost(hostname) {
  const normalized = hostname.toLowerCase()
  return (
    normalized === 'localhost'
    || normalized === '127.0.0.1'
    || normalized === '::1'
    || normalized.endsWith('.localhost')
  )
}

function closedPaymentMethods(value) {
  const methods = value.split(',').map((entry) => entry.trim()).filter(Boolean)
  if (
    methods.length !== 1
    || methods[0] !== 'card'
    || new Set(methods).size !== methods.length
  ) {
    fail('PAYMENT_METHODS_NOT_APPROVED')
  }
  return methods
}

function requireAcceptanceSpecPath(value) {
  if (!isAbsolute(value)) fail('ACCEPTANCE_SPEC_PATH_NOT_ABSOLUTE')
  const info = lstatSync(value)
  if (
    !info.isFile()
    || info.isSymbolicLink()
    || info.size < 1
    || info.size > MAX_ACCEPTANCE_SPEC_BYTES
    || basename(value) !== 'billing-paid-access.spec.ts'
  ) {
    fail('ACCEPTANCE_SPEC_INVALID')
  }
  return realpathSync(value)
}

function rejectInterceptionSource(source) {
  const forbidden = [
    /\.\s*route\s*\(/,
    /\.\s*routeFromHAR\s*\(/,
    /\.\s*fulfill\s*\(/,
    /\.\s*setOffline\s*\(/,
    /VITE_ENABLE_MOCK_CHECKOUT/,
    /VITE_ENABLE_DEMO_API/,
    /\/billing\/checkout\/demo/,
    /virtual\s+checkout/i,
  ]
  if (forbidden.some((pattern) => pattern.test(source))) {
    fail('ACCEPTANCE_ROUTE_INTERCEPTION_FORBIDDEN')
  }
}

function requireReadableMetadataPath(value) {
  if (!isAbsolute(value)) fail('METADATA_PATH_NOT_ABSOLUTE')
  const info = lstatSync(value)
  if (!info.isFile() || info.isSymbolicLink() || info.size < 2 || info.size > MAX_METADATA_BYTES) {
    fail('METADATA_FILE_INVALID')
  }
  return realpathSync(value)
}

function readMetadata(metadataPath) {
  let metadata
  try {
    metadata = JSON.parse(readFileSync(metadataPath, 'utf8'))
  } catch {
    fail('METADATA_INVALID_JSON')
  }
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    fail('METADATA_INVALID')
  }
  return metadata
}

function validateMetadata(metadata, expected) {
  if (metadata.providerAccessVerified !== true) fail('PROVIDER_ACCESS_NOT_VERIFIED')
  if (metadata.accountId !== expected.accountId) fail('SANDBOX_ACCOUNT_MISMATCH')
  const readiness = metadata.backendReadiness
  if (
    !readiness
    || typeof readiness !== 'object'
    || Array.isArray(readiness)
    || readiness.reachable !== true
    || readiness.keyMode !== 'test'
    || readiness.environment !== expected.environment
    || readiness.accountId !== expected.accountId
  ) {
    fail('BACKEND_TEST_READINESS_NOT_VERIFIED')
  }
  if (
    !Array.isArray(metadata.enabledPaymentMethods)
    || canonicalize(metadata.enabledPaymentMethods) !== canonicalize(expected.enabledPaymentMethods)
  ) {
    fail('PAYMENT_METHOD_METADATA_MISMATCH')
  }

  const destination = metadata.eventDestination
  if (!destination || typeof destination !== 'object' || Array.isArray(destination)) {
    fail('EVENT_DESTINATION_MISSING')
  }
  if (
    destination.id !== expected.destinationId
    || destination.apiVersion !== expected.eventDestinationVersion
    || destination.enabled !== true
    || destination.signed !== true
  ) {
    fail('EVENT_DESTINATION_MISMATCH')
  }

  if (!Array.isArray(metadata.objects) || metadata.objects.length < 7) {
    fail('SANDBOX_OBJECTS_MISSING')
  }
  for (const object of metadata.objects) {
    if (
      !object
      || typeof object !== 'object'
      || Array.isArray(object)
      || typeof object.id !== 'string'
      || !['checkout.session', 'event', 'invoice', 'price', 'subscription'].includes(object.type)
      || object.livemode !== false
    ) {
      fail('LIVE_OR_INVALID_OBJECT')
    }
  }

  for (const priceId of Object.values(expected.prices)) {
    const matches = metadata.objects.filter(
      (object) => object.type === 'price' && object.id === priceId && object.livemode === false,
    )
    if (matches.length !== 1) fail('TEST_PRICE_MISSING_OR_DUPLICATE')
  }
  for (const type of ['checkout.session', 'invoice', 'subscription', 'event']) {
    if (!metadata.objects.some((object) => object.type === type && object.livemode === false)) {
      fail('SANDBOX_OBJECT_TYPE_MISSING')
    }
  }
}

function requireEvidenceDirectory(value) {
  if (!isAbsolute(value)) fail('EVIDENCE_DIRECTORY_NOT_ABSOLUTE')
  const info = lstatSync(value)
  if (!info.isDirectory() || info.isSymbolicLink()) fail('EVIDENCE_DIRECTORY_INVALID')
  return realpathSync(value)
}

function requireReceiptPath(value, evidenceDirectory) {
  if (!isAbsolute(value)) fail('RECEIPT_PATH_NOT_ABSOLUTE')
  const normalized = resolve(value)
  const normalizedParent = realpathSync(dirname(normalized))
  const canonicalPath = resolve(normalizedParent, basename(normalized))
  const pathFromEvidence = relative(evidenceDirectory, canonicalPath)
  if (
    normalizedParent !== evidenceDirectory
    || pathFromEvidence.startsWith('..')
    || isAbsolute(pathFromEvidence)
    || !canonicalPath.endsWith('.json')
  ) {
    fail('RECEIPT_PATH_OUTSIDE_EVIDENCE_DIRECTORY')
  }
  return canonicalPath
}

function countObjects(objects) {
  const counts = {
    checkoutSession: 0,
    event: 0,
    invoice: 0,
    price: 0,
    subscription: 0,
  }
  for (const object of objects) {
    if (object.type === 'checkout.session') counts.checkoutSession += 1
    if (object.type === 'event') counts.event += 1
    if (object.type === 'invoice') counts.invoice += 1
    if (object.type === 'price') counts.price += 1
    if (object.type === 'subscription') counts.subscription += 1
  }
  return counts
}

function publishReceipt(receiptPath, receipt) {
  const bytes = Buffer.from(`${canonicalize(receipt)}\n`, 'utf8')
  if (bytes.length > 16 * 1024) fail('RECEIPT_TOO_LARGE')

  let descriptor
  try {
    descriptor = openSync(receiptPath, 'wx', 0o600)
    writeFileSync(descriptor, bytes)
  } catch {
    fail('RECEIPT_PUBLICATION_FAILED')
  } finally {
    if (descriptor !== undefined) closeSync(descriptor)
  }
}

function canonicalize(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => (
      `${JSON.stringify(key)}:${canonicalize(value[key])}`
    )).join(',')}}`
  }
  return JSON.stringify(value)
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}
