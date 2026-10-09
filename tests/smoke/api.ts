import { expect, type APIRequestContext } from '@playwright/test'
import { smokeAccounts, smokePassword, type SmokeRole } from './accounts'
import { describeApiFailure } from './helpers'
import { spendGeneration } from './run'

/**
 * Direct API calls, for the items #44 has read at the API rather than on a
 * screen. Every call names the status it expects, so a refusal a test asks for
 * (403, 401, 422) is checked on that one request and nowhere else.
 */

export type ServedRelease = {
  schema: string
  environment: string
  release: { releaseId: string; frontendArtifactSha256?: string; backendArtifactSha256?: string }
  runtimeConfig?: { url?: string }
}

export async function servedRelease(request: APIRequestContext, baseURL: string): Promise<ServedRelease> {
  const response = await request.get(new URL('/served-release.json', baseURL).toString(), {
    headers: { 'Cache-Control': 'no-cache' },
  })
  expect(response.status(), 'GET /served-release.json').toBe(200)
  return (await response.json()) as ServedRelease
}

let cachedOrigin: { baseURL: string; origin: string } | null = null

/** The API origin the deployment's own runtime config names, or `STOA_SMOKE_API_ORIGIN`. */
export async function apiOrigin(request: APIRequestContext, baseURL: string): Promise<string> {
  const override = process.env.STOA_SMOKE_API_ORIGIN
  if (override) return override.replace(/\/$/, '')
  if (cachedOrigin?.baseURL === baseURL) return cachedOrigin.origin
  const served = await servedRelease(request, baseURL)
  const configUrl = served.runtimeConfig?.url ?? new URL('/runtime-config.json', baseURL).toString()
  const response = await request.get(configUrl)
  expect(response.status(), `GET ${configUrl}`).toBe(200)
  const config = (await response.json()) as { api?: { origin?: string } }
  const origin = config.api?.origin
  if (!origin) throw new Error(`${configUrl} names no api.origin`)
  cachedOrigin = { baseURL, origin: origin.replace(/\/$/, '') }
  return cachedOrigin.origin
}

export type ApiCall<T = unknown> = { status: number; body: T; ms: number }

type CallOptions = {
  data?: unknown
  headers?: Record<string, string>
  /** The statuses this request may answer with; any 2xx when left out. */
  expect?: number | number[]
  timeout?: number
}

export class SmokeApi {
  constructor(
    private readonly request: APIRequestContext,
    readonly origin: string,
    private readonly token: string | null,
  ) {}

  static async signIn(request: APIRequestContext, baseURL: string, role: SmokeRole): Promise<SmokeApi> {
    const origin = await apiOrigin(request, baseURL)
    const anonymous = new SmokeApi(request, origin, null)
    const login = await anonymous.call<{ accessToken?: string }>('POST', '/auth/login', {
      data: { email: smokeAccounts[role].email, password: smokePassword(role) },
      expect: 200,
    })
    const token = login.body.accessToken
    if (!token) throw new Error(`POST /auth/login for ${role} answered 200 without an access token`)
    return new SmokeApi(request, origin, token)
  }

  /** The same account under a token taken from a signed-in page. */
  static withToken(request: APIRequestContext, origin: string, token: string): SmokeApi {
    return new SmokeApi(request, origin, token)
  }

  async call<T = unknown>(method: string, path: string, options: CallOptions = {}): Promise<ApiCall<T>> {
    const url = `${this.origin}${path}`
    const headers: Record<string, string> = { ...(options.headers ?? {}) }
    if (this.token) headers.Authorization = `Bearer ${this.token}`
    const started = Date.now()
    const response = await this.request.fetch(url, {
      method,
      headers,
      data: options.data as never,
      failOnStatusCode: false,
      timeout: options.timeout ?? 30_000,
    })
    const text = await response.text()
    const ms = Date.now() - started
    let body: unknown = text
    try {
      body = text ? JSON.parse(text) : null
    } catch {
      // Not JSON; the text is what there is.
    }
    const status = response.status()
    const where = `${method} ${path}`
    if (options.expect === undefined) {
      const failure = describeApiFailure({ status, method, url, body })
      expect(failure, `${where}: ${summarise(body)}`).toBeNull()
    } else {
      const allowed = Array.isArray(options.expect) ? options.expect : [options.expect]
      expect(allowed, `${where} answered ${status}: ${summarise(body)}`).toContain(status)
      if (status < 400) {
        const failure = describeApiFailure({ status, method, url, body })
        expect(failure, `${where}: a success that carries an error`).toBeNull()
      }
    }
    return { status, body: body as T, ms }
  }
}

function summarise(body: unknown): string {
  const text = typeof body === 'string' ? body : JSON.stringify(body)
  return (text ?? '').slice(0, 300)
}

/** Where a message's command stood when the smoke stopped looking. */
export type CommandOutcome =
  | { kind: 'completed'; commandId: string; assistantMessageId: string; elapsedMs: number }
  | { kind: 'failed'; commandId: string; failureCategory: string | null; retryable: boolean | null; elapsedMs: number }
  | { kind: 'timed_out'; commandId: string | null; lastStatus: string | null; elapsedMs: number }

type GenerationState = {
  commandId?: string | null
  status?: string | null
  assistantMessageId?: string | null
  failureCategory?: string | null
  retryable?: boolean | null
}

/** #27: one observation waits at most 120 s. It is not a server deadline. */
export const ANSWER_WAIT_LIMIT_MS = 120_000

/**
 * Read `/generation` for this message until its command ends or the wait runs
 * out. Every read has to name the command the send was given: an answer bound
 * to some other command is a failure, not a success. Never sends again.
 */
export async function waitForCommand(
  api: SmokeApi,
  conversationId: string,
  idempotencyKey: string,
  { commandId, startedAt, limitMs = ANSWER_WAIT_LIMIT_MS }: { commandId: string | null; startedAt: number; limitMs?: number },
): Promise<CommandOutcome> {
  let lastStatus: string | null = null
  let boundTo = commandId
  const path = `/conversations/${conversationId}/generation?idempotencyKey=${encodeURIComponent(idempotencyKey)}`
  while (Date.now() - startedAt < limitMs) {
    const { body } = await api.call<GenerationState>('GET', path, { expect: 200 })
    if (body.commandId) {
      if (boundTo) {
        expect(body.commandId, 'the command /generation reports is the one the send was given').toBe(boundTo)
      }
      boundTo = body.commandId
    }
    lastStatus = body.status ?? null
    const elapsedMs = Date.now() - startedAt
    if (body.status === 'completed' && boundTo) {
      return { kind: 'completed', commandId: boundTo, assistantMessageId: body.assistantMessageId ?? '', elapsedMs }
    }
    if (body.status === 'failed' && boundTo) {
      return {
        kind: 'failed',
        commandId: boundTo,
        failureCategory: body.failureCategory ?? null,
        retryable: body.retryable ?? null,
        elapsedMs,
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }
  return { kind: 'timed_out', commandId: boundTo, lastStatus, elapsedMs: Date.now() - startedAt }
}

type ConversationDetail = {
  id: string
  grade: string
  messages: Array<{ id: string; role: string; content: string }>
}

export type AskedQuestion = {
  conversationId: string
  idempotencyKey: string
  sendStatus: number
  acceptMs: number
  outcome: CommandOutcome
  answer: string | null
}

/**
 * Open a conversation (no `initialMessage`, so opening it generates nothing),
 * spend one generation request, send the question and wait for its command.
 */
export async function askViaApi(
  api: SmokeApi,
  question: { label: string; subject: string; grade: string; content: string; acceptLanguage: string },
): Promise<AskedQuestion> {
  const headers = { 'Accept-Language': question.acceptLanguage }
  const created = await api.call<ConversationDetail>('POST', '/conversations', {
    data: { subject: question.subject, grade: question.grade },
    headers,
    expect: 201,
  })
  const conversationId = created.body.id
  const idempotencyKey = `smoke-${question.label}-${Date.now()}`.replace(/[^A-Za-z0-9._~-]/g, '-').slice(0, 64)
  spendGeneration(question.label)
  const startedAt = Date.now()
  // 202 is the worker path (E21); 200 is the in-request rollback, which still
  // leaves the command to bind to.
  const sent = await api.call<{ commandId?: string }>('POST', `/conversations/${conversationId}/messages`, {
    data: { content: question.content, idempotencyKey },
    headers,
    expect: [200, 202],
    timeout: 60_000,
  })
  const outcome = await waitForCommand(api, conversationId, idempotencyKey, {
    commandId: sent.status === 202 ? (sent.body.commandId ?? null) : null,
    startedAt,
  })
  const answer = outcome.kind === 'completed'
    ? await readAnswer(api, conversationId, outcome.assistantMessageId)
    : null
  return { conversationId, idempotencyKey, sendStatus: sent.status, acceptMs: sent.ms, outcome, answer }
}

export async function readAnswer(api: SmokeApi, conversationId: string, assistantMessageId: string): Promise<string> {
  const { body } = await api.call<ConversationDetail>('GET', `/conversations/${conversationId}`, { expect: 200 })
  const message = body.messages.find((entry) => entry.id === assistantMessageId)
  if (!message) {
    throw new Error(`conversation ${conversationId} has no message ${assistantMessageId}, which the command named`)
  }
  return message.content
}

/** The words #27 wants on record when the 120 s observation ends first. */
export function timedOutNote(outcome: Extract<CommandOutcome, { kind: 'timed_out' }>): string {
  return `冒烟等待超时，未确认完成 (commandId=${outcome.commandId ?? 'unknown'}, ` +
    `lastStatus=${outcome.lastStatus ?? 'none'}, elapsedMs=${outcome.elapsedMs})`
}
