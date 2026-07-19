export type RuntimeEnvironment = 'staging' | 'staging-pilot' | 'production'

export type RuntimeConfigErrorCode =
  | 'runtime_config_digest_mismatch'
  | 'runtime_config_fetch_failed'
  | 'runtime_config_invalid'
  | 'runtime_config_uninitialized'

export interface RuntimeConfig {
  readonly schema: 'stoa.web.runtime-config.v1'
  readonly environment: RuntimeEnvironment
  readonly release: {
    readonly releaseId: string
    readonly manifestSha256: string
    readonly frontendArtifactSha256: string
    readonly backendArtifactSha256: string
  }
  readonly web: { readonly origin: string }
  readonly api: { readonly origin: string }
  readonly auth: { readonly mode: 'backend-api' }
  readonly realtime: {
    readonly enabled: boolean
    readonly endpoint: string | null
  }
  readonly features: {
    readonly analytics: boolean
    readonly errorMonitoring: boolean
    readonly feedback: boolean
    readonly parentReports: boolean
    readonly payments: boolean
    readonly publicRegistration: boolean
    readonly realtimeNotifications: boolean
    readonly referrals: boolean
    readonly supportTickets: boolean
    readonly teacherHelp: boolean
  }
}

export interface RuntimeConfigValidationOptions {
  readonly expectedDigest: string
  readonly expectedRelease: RuntimeConfig['release']
  readonly expectedEnvironment: RuntimeEnvironment
  readonly expectedWebOrigin: string
}

export interface RuntimeConfigLoadOptions {
  readonly configUrl?: string
  readonly webOrigin: string
  readonly expectedDigest: string
  readonly expectedRelease: RuntimeConfig['release']
  readonly expectedEnvironment: RuntimeEnvironment
  readonly fetchImpl?: typeof fetch
}

const MAX_CONFIG_BYTES = 16 * 1024
const SHA256_PATTERN = /^[0-9a-f]{64}$/
const TOP_LEVEL_KEYS = [
  'schema',
  'environment',
  'release',
  'web',
  'api',
  'auth',
  'realtime',
  'features',
] as const
const RELEASE_KEYS = [
  'releaseId',
  'manifestSha256',
  'frontendArtifactSha256',
  'backendArtifactSha256',
] as const
const FEATURE_KEYS = [
  'analytics',
  'errorMonitoring',
  'feedback',
  'parentReports',
  'payments',
  'publicRegistration',
  'realtimeNotifications',
  'referrals',
  'supportTickets',
  'teacherHelp',
] as const
const SECRET_KEY_PATTERN = /(?:secret|password|credential|private|token|api.?key|client.?id|user.?pool|cognito|amplify)/i
const SECRET_VALUE_PATTERNS = [
  /^(?:Bearer|Basic)\s+\S+/i,
  /^-----BEGIN [A-Z ]*(?:PRIVATE KEY|CERTIFICATE)-----/,
  /^(?:AKIA|ASIA)[A-Z0-9]{16}$/,
  /^sk-[A-Za-z0-9_-]{16,}$/,
  /^[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}$/,
] as const

export class RuntimeConfigError extends Error {
  readonly code: RuntimeConfigErrorCode

  constructor(code: RuntimeConfigErrorCode) {
    super(code)
    this.name = 'RuntimeConfigError'
    this.code = code
  }
}

function fail(code: RuntimeConfigErrorCode = 'runtime_config_invalid'): never {
  throw new RuntimeConfigError(code)
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

function requireBoolean(value: unknown): boolean {
  if (typeof value !== 'boolean') fail()
  return value
}

function requireSha256(value: unknown): string {
  const text = requireString(value)
  if (!SHA256_PATTERN.test(text)) fail()
  return text
}

function rejectSecretLikeString(value: string): void {
  if (SECRET_VALUE_PATTERNS.some((pattern) => pattern.test(value))) fail()
  if (/^(?:https?|wss?):\/\//i.test(value)) {
    let parsed: URL
    try {
      parsed = new URL(value)
    } catch {
      fail()
    }
    if (parsed.username || parsed.password || parsed.search || parsed.hash) fail()
  }
}

function rejectSecretShapedKeys(value: unknown, seen = new Set<object>()): void {
  if (typeof value === 'string') {
    rejectSecretLikeString(value)
    return
  }
  if (value === null || typeof value !== 'object') return
  if (seen.has(value)) fail()
  seen.add(value)
  if (Array.isArray(value)) {
    for (const item of value) rejectSecretShapedKeys(item, seen)
    seen.delete(value)
    return
  }
  const record = requireRecord(value)
  for (const [key, item] of Object.entries(record)) {
    if (SECRET_KEY_PATTERN.test(key)) fail()
    rejectSecretShapedKeys(item, seen)
  }
  seen.delete(value)
}

function parseOrigin(
  value: unknown,
  environment: RuntimeEnvironment,
): URL {
  const text = requireString(value)
  let parsed: URL
  try {
    parsed = new URL(text)
  } catch {
    fail()
  }
  if (parsed.protocol !== 'https:' ||
      parsed.username || parsed.password || parsed.search || parsed.hash ||
      parsed.pathname !== '/' || parsed.origin !== text) fail()
  const localHost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' ||
    parsed.hostname === '[::1]'
  const stagingHost = parsed.hostname.toLowerCase().includes('staging')
  const pilotHost = parsed.hostname.toLowerCase().includes('pilot')
  if ((environment === 'staging' && (!stagingHost || pilotHost)) ||
      (environment === 'staging-pilot' && (!stagingHost || !pilotHost)) ||
      (environment === 'production' && (localHost || stagingHost))) fail()
  return parsed
}

function parseRealtimeEndpoint(
  value: unknown,
  enabled: boolean,
  apiOrigin: URL,
): string | null {
  if (!enabled) {
    if (value !== null) fail()
    return null
  }
  const text = requireString(value)
  let parsed: URL
  try {
    parsed = new URL(text)
  } catch {
    fail()
  }
  const expectedProtocol = 'wss:'
  if (parsed.protocol !== expectedProtocol || parsed.host !== apiOrigin.host ||
      parsed.pathname !== '/realtime' || parsed.username || parsed.password ||
      parsed.search || parsed.hash) fail()
  return text
}

function parseEnvironment(value: unknown): RuntimeEnvironment {
  if (value !== 'staging' && value !== 'staging-pilot' && value !== 'production') fail()
  return value
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

export function canonicalizeRuntimeConfig(value: unknown): string {
  return canonicalValue(value, new Set<object>())
}

export async function digestRuntimeConfig(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalizeRuntimeConfig(value))
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function validateRuntimeConfig(
  value: unknown,
  options: RuntimeConfigValidationOptions,
): Promise<Readonly<RuntimeConfig>> {
  rejectSecretShapedKeys(value)
  const config = requireRecord(value)
  requireExactKeys(config, TOP_LEVEL_KEYS)
  if (config.schema !== 'stoa.web.runtime-config.v1') fail()
  const environment = parseEnvironment(config.environment)
  if (environment !== options.expectedEnvironment) fail()

  const release = requireRecord(config.release)
  requireExactKeys(release, RELEASE_KEYS)
  const expectedRelease = requireRecord(options.expectedRelease)
  requireExactKeys(expectedRelease, RELEASE_KEYS)
  for (const key of RELEASE_KEYS) {
    const actual = requireSha256(release[key])
    const expected = requireSha256(expectedRelease[key])
    if (actual !== expected) fail()
  }

  const web = requireRecord(config.web)
  requireExactKeys(web, ['origin'])
  const webOrigin = parseOrigin(web.origin, environment)
  if (webOrigin.origin !== options.expectedWebOrigin) fail()

  const api = requireRecord(config.api)
  requireExactKeys(api, ['origin'])
  const apiOrigin = parseOrigin(api.origin, environment)

  const auth = requireRecord(config.auth)
  requireExactKeys(auth, ['mode'])
  if (auth.mode !== 'backend-api') fail()

  const realtime = requireRecord(config.realtime)
  requireExactKeys(realtime, ['enabled', 'endpoint'])
  const realtimeEnabled = requireBoolean(realtime.enabled)
  parseRealtimeEndpoint(realtime.endpoint, realtimeEnabled, apiOrigin)

  const features = requireRecord(config.features)
  requireExactKeys(features, FEATURE_KEYS)
  for (const key of FEATURE_KEYS) requireBoolean(features[key])
  if (features.realtimeNotifications !== realtimeEnabled) fail()

  if (!SHA256_PATTERN.test(options.expectedDigest)) fail()
  const actualDigest = await digestRuntimeConfig(config)
  if (actualDigest !== options.expectedDigest) fail('runtime_config_digest_mismatch')
  return deepFreeze(config as unknown as RuntimeConfig)
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

function strictParseJson(text: string): unknown {
  return new StrictJsonParser(text).parse()
}

function requestUrl(configUrl: string, webOrigin: string): URL {
  let origin: URL
  let request: URL
  try {
    origin = new URL(webOrigin)
    request = new URL(configUrl, origin)
  } catch {
    fail()
  }
  if (origin.origin !== webOrigin || origin.pathname !== '/' || origin.search || origin.hash ||
      request.origin !== origin.origin || request.pathname !== '/runtime-config.json' ||
      request.search || request.hash || request.username || request.password) fail()
  return request
}

export async function loadRuntimeConfig(
  options: RuntimeConfigLoadOptions,
): Promise<Readonly<RuntimeConfig>> {
  const request = requestUrl(options.configUrl ?? '/runtime-config.json', options.webOrigin)
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
    fail('runtime_config_fetch_failed')
  }
  if (!response.ok || response.status !== 200 || response.redirected || response.url !== request.href) fail()
  const mediaType = response.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase()
  if (mediaType !== 'application/json') fail()
  const length = response.headers.get('content-length')
  if (length !== null && (!/^(?:0|[1-9]\d*)$/.test(length) || Number(length) > MAX_CONFIG_BYTES)) fail()
  const body = await response.text()
  if (new TextEncoder().encode(body).byteLength > MAX_CONFIG_BYTES) fail()
  const value = strictParseJson(body)
  return validateRuntimeConfig(value, {
    expectedDigest: options.expectedDigest,
    expectedRelease: options.expectedRelease,
    expectedEnvironment: options.expectedEnvironment,
    expectedWebOrigin: options.webOrigin,
  })
}

let registeredRuntimeConfig: Readonly<RuntimeConfig> | undefined

export async function initializeRuntimeConfig(
  options: RuntimeConfigLoadOptions,
): Promise<Readonly<RuntimeConfig>> {
  const candidate = await loadRuntimeConfig(options)
  if (registeredRuntimeConfig === undefined) {
    registeredRuntimeConfig = candidate
    return candidate
  }
  if (canonicalizeRuntimeConfig(registeredRuntimeConfig) !== canonicalizeRuntimeConfig(candidate)) fail()
  return registeredRuntimeConfig
}

export function getRuntimeConfig(): Readonly<RuntimeConfig> {
  if (registeredRuntimeConfig === undefined) fail('runtime_config_uninitialized')
  return registeredRuntimeConfig
}

export function resetRuntimeConfigForTests(): void {
  registeredRuntimeConfig = undefined
}
