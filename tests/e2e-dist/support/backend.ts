import type { Page, Request } from '@playwright/test'
import type { Contract, MatchedOperation } from './contract'
import { API_ORIGIN, WEB_ORIGIN } from './origins'

export type BackendRequest = {
  method: string
  pathname: string
  query: URLSearchParams
  headers: Record<string, string>
  body: unknown
}
export type Reply = { status: number; body?: unknown }
export type Handler = (request: BackendRequest) => Reply | Promise<Reply>
export type Call = BackendRequest & { template: string }

/**
 * The backend the page talks to, answered inside Playwright.
 *
 * Every request goes through the backend's OpenAPI document first. One the
 * document does not have, one no handler answers, a request body or a reply
 * that breaks the contract: each is written down in `problems`, and the test
 * fixture fails the test if there are any. A mock can therefore only describe
 * a backend that exists.
 */
export class MockBackend {
  readonly problems: string[] = []
  readonly calls: Call[] = []
  private readonly handlers = new Map<string, Handler>()
  private readonly contract: Contract

  constructor(contract: Contract) {
    this.contract = contract
  }

  /** Answer `method template`, e.g. `('POST', '/auth/login')`, exactly as the OpenAPI document spells it. */
  on(method: string, template: string, handler: Handler) {
    this.handlers.set(`${method.toLowerCase()} ${template}`, handler)
    return this
  }

  callsTo(method: string, template: string) {
    return this.calls.filter((call) => call.method === method.toLowerCase() && call.template === template)
  }

  async attach(page: Page) {
    await page.route(`${API_ORIGIN}/**`, async (route) => {
      const request = route.request()
      const cors = corsHeaders(request)
      if (request.method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: cors })
        return
      }
      const url = new URL(request.url())
      const where = `${request.method()} ${url.pathname}`
      const op = this.contract.match(request.method(), url.pathname)
      if (!op) {
        this.problems.push(`${where}: not in the backend's OpenAPI document`)
        await route.fulfill({ status: 404, headers: cors, json: { detail: 'Not Found' } })
        return
      }
      const backendRequest: BackendRequest = {
        method: op.method,
        pathname: url.pathname,
        query: url.searchParams,
        headers: request.headers(),
        body: jsonBody(request),
      }
      this.calls.push({ ...backendRequest, template: op.template })
      this.note(where, 'request', this.contract.checkRequest(op, backendRequest.body))

      const handler = this.handlers.get(`${op.method} ${op.template}`)
      if (!handler) {
        this.problems.push(`${where}: no mock answers ${op.method.toUpperCase()} ${op.template}`)
        await route.fulfill({ status: 503, headers: cors, json: { detail: 'not mocked' } })
        return
      }
      const reply = await handler(backendRequest)
      this.checkReply(where, op, reply)
      await route.fulfill({
        status: reply.status,
        headers: cors,
        ...(reply.body === undefined ? {} : { json: reply.body }),
      })
    })
  }

  private checkReply(where: string, op: MatchedOperation, reply: Reply) {
    this.note(where, `reply ${reply.status}`, this.contract.checkResponse(op, reply.status, reply.body))
  }

  private note(where: string, what: string, problem: string | null) {
    if (problem) this.problems.push(`${where}: ${what} breaks the contract: ${problem}`)
  }
}

function jsonBody(request: Request): unknown {
  const raw = request.postData()
  if (raw === null || raw === '') return undefined
  const type = request.headers()['content-type'] ?? ''
  if (!type.includes('application/json')) return raw
  return JSON.parse(raw)
}

/** What the API's CORS answers the app's origin with. */
function corsHeaders(request: Request): Record<string, string> {
  return {
    'access-control-allow-origin': WEB_ORIGIN,
    'access-control-allow-credentials': 'true',
    'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'access-control-allow-headers': request.headers()['access-control-request-headers'] ?? '*',
    vary: 'Origin',
  }
}
