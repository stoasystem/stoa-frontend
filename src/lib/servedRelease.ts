export type ServedReleaseEnvironment = 'staging' | 'staging-pilot' | 'production'

export type ServedReleaseErrorCode =
  | 'served_release_fetch_failed'
  | 'served_release_invalid'

export interface ServedReleaseIdentity {
  readonly releaseId: string
  readonly manifestSha256: string
  readonly frontendArtifactSha256: string
  readonly backendArtifactSha256: string
}

export interface ServedObjectIdentity {
  readonly key: string
  readonly versionId: string
  readonly url: string
  readonly sha256: string
}

export interface ServedRelease {
  readonly schema: 'stoa.web.served-release.v1'
  readonly environment: ServedReleaseEnvironment
  readonly release: ServedReleaseIdentity
  readonly runtimeConfig: ServedObjectIdentity
  readonly webEntry: ServedObjectIdentity
}

export interface ServedReleaseValidationOptions {
  readonly expectedWebOrigin: string
}

export interface ServedReleaseLoadOptions {
  readonly webOrigin: string
  readonly fetchImpl?: typeof fetch
}

export interface RuntimeConfigLoadExpectations {
  readonly configUrl: '/runtime-config.json'
  readonly webOrigin: string
  readonly expectedDigest: string
  readonly expectedRelease: ServedReleaseIdentity
  readonly expectedEnvironment: ServedReleaseEnvironment
}

const MAX_DESCRIPTOR_BYTES = 16 * 1024
const SHA256_PATTERN = /^[0-9a-f]{64}$/
const VERSION_ID_PATTERN = /^[A-Za-z0-9._~+/-]{8,1024}$/
const MUTABLE_IDENTITIES = new Set([
  'head',
  'latest',
  'main',
  'master',
  'develop',
  'development',
  'staging',
  'staging-pilot',
  'production',
  'null',
])
const TOP_LEVEL_KEYS = [
  'schema',
  'environment',
  'release',
  'runtimeConfig',
  'webEntry',
] as const
const RELEASE_KEYS = [
  'releaseId',
  'manifestSha256',
  'frontendArtifactSha256',
  'backendArtifactSha256',
] as const
const OBJECT_KEYS = ['key', 'versionId', 'url', 'sha256'] as const
const SECRET_KEY_PATTERN = /(?:secret|password|credential|private|token|api.?key|client.?id|user.?pool|cognito|amplify|auth.?provider|mobile|native|demo)/i
const SECRET_VALUE_PATTERNS = [
  /^(?:Bearer|Basic)\s+\S+/i,
  /^-----BEGIN [A-Z ]*(?:PRIVATE KEY|CERTIFICATE)-----/,
  /^(?:AKIA|ASIA)[A-Z0-9]{16}$/,
  /^sk-[A-Za-z0-9_-]{16,}$/,
  /^[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}$/,
] as const

export class ServedReleaseError extends Error {
  readonly code: ServedReleaseErrorCode

  constructor(code: ServedReleaseErrorCode) {
    super(code)
    this.name = 'ServedReleaseError'
    this.code = code
  }
}

function fail(code: ServedReleaseErrorCode = 'served_release_invalid'): never {
  throw new ServedReleaseError(code)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function requireRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) fail()
  return value
}

function requireExactKeys(value: Record<string, unknown>, expected: readonly string[]): void {
  const actual = Object.keys(value).sort()
  const wanted = [...expected].sort()
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) fail()
}

function requireString(value: unknown): string {
  if (typeof value !== 'string') fail()
  return value
}

function requireSha256(value: unknown): string {
  const text = requireString(value)
  if (!SHA256_PATTERN.test(text)) fail()
  return text
}

function requireVersionId(value: unknown): string {
  const text = requireString(value)
  if (!VERSION_ID_PATTERN.test(text) || MUTABLE_IDENTITIES.has(text.toLowerCase())) fail()
  return text
}

function rejectSecretLikeString(value: string): void {
  if (SECRET_VALUE_PATTERNS.some((pattern) => pattern.test(value))) fail()
  if (/^https?:\/\//i.test(value)) {
    let parsed: URL
    try {
      parsed = new URL(value)
    } catch {
      fail()
    }
    if (parsed.username || parsed.password || parsed.search || parsed.hash) fail()
  }
}

function rejectSecretShapedValues(value: unknown, seen = new Set<object>()): void {
  if (typeof value === 'string') {
    rejectSecretLikeString(value)
    return
  }
  if (value === null || typeof value !== 'object') return
  if (seen.has(value)) fail()
  seen.add(value)
  if (Array.isArray(value)) {
    for (const item of value) rejectSecretShapedValues(item, seen)
    seen.delete(value)
    return
  }
  const record = requireRecord(value)
  for (const [key, item] of Object.entries(record)) {
    if (SECRET_KEY_PATTERN.test(key)) fail()
    rejectSecretShapedValues(item, seen)
  }
  seen.delete(value)
}

function parseEnvironment(value: unknown): ServedReleaseEnvironment {
  if (value !== 'staging' && value !== 'staging-pilot' && value !== 'production') fail()
  return value
}

function parseWebOrigin(value: string): URL {
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    fail()
  }
  if (parsed.protocol !== 'https:' || parsed.origin !== value || parsed.pathname !== '/' ||
      parsed.username || parsed.password || parsed.search || parsed.hash) fail()
  return parsed
}

function requireEnvironmentOrigin(origin: URL, environment: ServedReleaseEnvironment): void {
  const host = origin.hostname.toLowerCase()
  const localHost = host === 'localhost' || host === '127.0.0.1' || host === '[::1]'
  const stagingHost = host.includes('staging')
  const pilotHost = host.includes('pilot')
  if ((environment === 'staging' && (!stagingHost || pilotHost)) ||
      (environment === 'staging-pilot' && (!stagingHost || !pilotHost)) ||
      (environment === 'production' && (localHost || stagingHost || pilotHost))) fail()
}

function parseServedObject(
  value: unknown,
  expectedKey: 'runtime-config.json' | 'index.html',
  origin: URL,
): ServedObjectIdentity {
  const object = requireRecord(value)
  requireExactKeys(object, OBJECT_KEYS)
  const key = requireString(object.key)
  if (key !== expectedKey) fail()
  const versionId = requireVersionId(object.versionId)
  const url = requireString(object.url)
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    fail()
  }
  const expectedUrl = new URL(`/${expectedKey}`, origin).href
  if (parsed.protocol !== 'https:' || parsed.origin !== origin.origin || parsed.href !== expectedUrl ||
      parsed.pathname !== `/${expectedKey}` || parsed.username || parsed.password ||
      parsed.search || parsed.hash) fail()
  return {
    key,
    versionId,
    url,
    sha256: requireSha256(object.sha256),
  }
}

function deepFreeze<T>(value: T, seen = new Set<object>()): Readonly<T> {
  if (value === null || typeof value !== 'object') return value
  if (seen.has(value)) fail()
  seen.add(value)
  for (const item of Object.values(value)) deepFreeze(item, seen)
  Object.freeze(value)
  seen.delete(value)
  return value
}

function canonicalValue(value: unknown, seen: Set<object>): string {
  if (value === null) return 'null'
  if (typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value)
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) fail()
    return JSON.stringify(value)
  }
  if (typeof value !== 'object') fail()
  if (seen.has(value)) fail()
  seen.add(value)
  let encoded: string
  if (Array.isArray(value)) {
    encoded = `[${value.map((item) => canonicalValue(item, seen)).join(',')}]`
  } else {
    const record = requireRecord(value)
    encoded = `{${Object.keys(record).sort().map((key) =>
      `${JSON.stringify(key)}:${canonicalValue(record[key], seen)}`).join(',')}}`
  }
  seen.delete(value)
  return encoded
}

export function canonicalizeServedRelease(value: unknown): string {
  return canonicalValue(value, new Set<object>())
}

export function validateServedRelease(
  value: unknown,
  options: ServedReleaseValidationOptions,
): Readonly<ServedRelease> {
  rejectSecretShapedValues(value)
  const source = requireRecord(value)
  requireExactKeys(source, TOP_LEVEL_KEYS)
  if (source.schema !== 'stoa.web.served-release.v1') fail()
  const environment = parseEnvironment(source.environment)
  const origin = parseWebOrigin(options.expectedWebOrigin)
  requireEnvironmentOrigin(origin, environment)

  const releaseSource = requireRecord(source.release)
  requireExactKeys(releaseSource, RELEASE_KEYS)
  const release: ServedReleaseIdentity = {
    releaseId: requireSha256(releaseSource.releaseId),
    manifestSha256: requireSha256(releaseSource.manifestSha256),
    frontendArtifactSha256: requireSha256(releaseSource.frontendArtifactSha256),
    backendArtifactSha256: requireSha256(releaseSource.backendArtifactSha256),
  }

  const descriptor: ServedRelease = {
    schema: 'stoa.web.served-release.v1',
    environment,
    release,
    runtimeConfig: parseServedObject(source.runtimeConfig, 'runtime-config.json', origin),
    webEntry: parseServedObject(source.webEntry, 'index.html', origin),
  }
  return deepFreeze(descriptor)
}

class StrictJsonParser {
  private index = 0

  constructor(private readonly text: string) {}

  parse(): unknown {
    const value = this.parseValue()
    this.skipWhitespace()
    if (this.index !== this.text.length) fail()
    return value
  }

  private skipWhitespace(): void {
    while (/\s/.test(this.text[this.index] ?? '')) this.index += 1
  }

  private parseValue(): unknown {
    this.skipWhitespace()
    const character = this.text[this.index]
    if (character === '{') return this.parseObject()
    if (character === '[') return this.parseArray()
    if (character === '"') return this.parseString()
    if (character === 't' && this.takeLiteral('true')) return true
    if (character === 'f' && this.takeLiteral('false')) return false
    if (character === 'n' && this.takeLiteral('null')) return null
    return this.parseNumber()
  }

  private takeLiteral(literal: string): boolean {
    if (!this.text.startsWith(literal, this.index)) return false
    this.index += literal.length
    return true
  }

  private parseString(): string {
    const start = this.index
    this.index += 1
    while (this.index < this.text.length) {
      const character = this.text[this.index]
      if (character === '"') {
        this.index += 1
        try {
          const value: unknown = JSON.parse(this.text.slice(start, this.index))
          if (typeof value !== 'string') fail()
          return value
        } catch {
          fail()
        }
      }
      if (character === '\\') this.index += 1
      this.index += 1
    }
    fail()
  }

  private parseNumber(): number {
    const match = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(
      this.text.slice(this.index),
    )
    if (!match) fail()
    this.index += match[0].length
    const value = Number(match[0])
    if (!Number.isFinite(value)) fail()
    return value
  }

  private parseObject(): Record<string, unknown> {
    this.index += 1
    const value: Record<string, unknown> = Object.create(null) as Record<string, unknown>
    const keys = new Set<string>()
    this.skipWhitespace()
    if (this.text[this.index] === '}') {
      this.index += 1
      return value
    }
    while (true) {
      this.skipWhitespace()
      if (this.text[this.index] !== '"') fail()
      const key = this.parseString()
      if (keys.has(key)) fail()
      keys.add(key)
      this.skipWhitespace()
      if (this.text[this.index] !== ':') fail()
      this.index += 1
      value[key] = this.parseValue()
      this.skipWhitespace()
      const delimiter = this.text[this.index]
      this.index += 1
      if (delimiter === '}') return value
      if (delimiter !== ',') fail()
    }
  }

  private parseArray(): unknown[] {
    this.index += 1
    const value: unknown[] = []
    this.skipWhitespace()
    if (this.text[this.index] === ']') {
      this.index += 1
      return value
    }
    while (true) {
      value.push(this.parseValue())
      this.skipWhitespace()
      const delimiter = this.text[this.index]
      this.index += 1
      if (delimiter === ']') return value
      if (delimiter !== ',') fail()
    }
  }
}

function descriptorRequestUrl(webOrigin: string): URL {
  const origin = parseWebOrigin(webOrigin)
  return new URL('/served-release.json', origin)
}

export async function loadServedRelease(
  options: ServedReleaseLoadOptions,
): Promise<Readonly<ServedRelease>> {
  const request = descriptorRequestUrl(options.webOrigin)
  const fetchImpl = options.fetchImpl ?? fetch
  let response: Response
  try {
    response = await fetchImpl(request.href, {
      method: 'GET',
      credentials: 'omit',
      cache: 'no-store',
      redirect: 'error',
      headers: { Accept: 'application/json' },
    })
  } catch {
    fail('served_release_fetch_failed')
  }
  if (!response.ok || response.status !== 200 || response.redirected || response.url !== request.href) fail()
  const mediaType = response.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase()
  if (mediaType !== 'application/json') fail()
  const length = response.headers.get('content-length')
  if (length !== null && (!/^(?:0|[1-9]\d*)$/.test(length) ||
      Number(length) > MAX_DESCRIPTOR_BYTES)) fail()
  let body: string
  try {
    body = await response.text()
  } catch {
    fail('served_release_fetch_failed')
  }
  if (new TextEncoder().encode(body).byteLength > MAX_DESCRIPTOR_BYTES) fail()
  const value = new StrictJsonParser(body).parse()
  return validateServedRelease(value, { expectedWebOrigin: options.webOrigin })
}

export function toRuntimeConfigLoadOptions(
  descriptor: Readonly<ServedRelease>,
  options: ServedReleaseValidationOptions,
): Readonly<RuntimeConfigLoadExpectations> {
  const validated = validateServedRelease(descriptor, options)
  return deepFreeze({
    configUrl: '/runtime-config.json',
    webOrigin: options.expectedWebOrigin,
    expectedDigest: validated.runtimeConfig.sha256,
    expectedRelease: { ...validated.release },
    expectedEnvironment: validated.environment,
  })
}
