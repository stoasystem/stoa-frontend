/*
 * Keeps the design preview off every backend (#115).
 *
 * The app talks to its API in exactly three ways: the shared axios client
 * (`httpClient`), `fetch` (the Ask answer stream, analytics, the role
 * switcher's session check) and a WebSocket (realtime notifications). This
 * replaces all three, in this page only:
 *
 * - axios: `httpClient` gets an adapter that answers from `handlers.ts`. The
 *   client's own interceptors (token, language, error mapping) still run, so
 *   the screens see exactly the responses and errors they see in production.
 * - fetch: requests to the API origin, to the dev server's `/api` proxy, or to
 *   any other origin are answered here; only the dev server's own files go
 *   through.
 * - WebSocket: anything but the dev server's hot reload gets a socket that
 *   never opens.
 *
 * The API origin itself is `API_ORIGIN`, a reserved `.invalid` name that
 * cannot resolve: a request that slipped past all three would fail at DNS and
 * show up in the network log under that name, not reach a server.
 *
 * A request with no demo answer is answered 404, recorded in
 * `window.__stoaPreview.unanswered`, and not logged: the screen shows its
 * own error state, which is what a design review should see.
 *
 * Nothing here is imported by `src/main.tsx`; tests/component/designPreviewExcluded.test.ts holds that, and
 * that no built bundle carries `PREVIEW_MARKER`.
 */
import { AxiosError, AxiosHeaders, type AxiosAdapter, type AxiosInstance, type AxiosResponse } from 'axios'
import { answer, streamedAnswer, type PreviewReply } from '@/dev/preview/handlers'

export const API_ORIGIN = 'https://api.design-preview.invalid'

/** A string the exclusion test looks for in the built bundles. */
export const PREVIEW_MARKER = 'stoa.design-preview.v1'

type RecordedRequest = { method: string; url: string; status: number }

type PreviewWindow = Window & {
  __stoaPreview?: { marker: string; answered: RecordedRequest[]; unanswered: RecordedRequest[] }
}

function journal() {
  const target = window as PreviewWindow
  target.__stoaPreview ??= { marker: PREVIEW_MARKER, answered: [], unanswered: [] }
  return target.__stoaPreview
}

function parseBody(body: unknown): unknown {
  if (typeof body !== 'string') return body ?? null
  try {
    return JSON.parse(body)
  } catch {
    return body
  }
}

/** The API path of a request: the origin and the dev proxy's `/api` dropped. */
function apiPath(url: URL) {
  return url.pathname.replace(/^\/api(?=\/)/, '')
}

async function reply(method: string, url: URL, body: unknown): Promise<PreviewReply> {
  const found = await answer({ method, path: apiPath(url), query: url.searchParams, body: parseBody(body) })
  const record = { method, url: `${apiPath(url)}${url.search}`, status: found?.status ?? 404 }
  if (found) {
    journal().answered.push(record)
    return found
  }
  journal().unanswered.push(record)
  return { status: 404, data: { detail: 'The design preview has no demo answer for this request.' } }
}

function axiosAdapter(client: AxiosInstance): AxiosAdapter {
  return async (config) => {
    const url = new URL(client.getUri(config), window.location.origin)
    const method = (config.method ?? 'get').toUpperCase()
    const { status, data } = await reply(method, url, config.data)
    const response: AxiosResponse = {
      data,
      status,
      statusText: status < 400 ? 'OK' : 'Not Found',
      headers: new AxiosHeaders({ 'content-type': 'application/json' }),
      config,
      request: null,
    }
    if (status >= 400) {
      throw new AxiosError(`Request failed with status code ${status}`, AxiosError.ERR_BAD_REQUEST, config, null, response)
    }
    return response
  }
}

function isDevServerFile(url: URL) {
  return url.origin === window.location.origin && !url.pathname.startsWith('/api/')
}

function installFetch() {
  const passThrough = window.fetch.bind(window)
  window.fetch = async (input, init) => {
    const request = input instanceof Request ? input : null
    const url = new URL(request?.url ?? String(input), window.location.origin)
    if (isDevServerFile(url)) return passThrough(input, init)

    const method = (init?.method ?? request?.method ?? 'GET').toUpperCase()
    const body = init?.body ?? null
    const stream = /^\/conversations\/([^/]+)\/messages\/stream$/.exec(apiPath(url))
    if (stream && method === 'POST') {
      journal().answered.push({ method, url: apiPath(url), status: 200 })
      const sent = parseBody(body) as { content?: string; idempotencyKey?: string } | null
      const events = await streamedAnswer(decodeURIComponent(stream[1]), sent?.content ?? '', sent?.idempotencyKey ?? `demo-${Date.now()}`)
      return new Response(events, {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      })
    }
    const { status, data } = await reply(method, url, body)
    return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } })
  }
}

/** A socket that stays connecting and never sends or receives. */
class SilentSocket extends EventTarget {
  static readonly CONNECTING = 0
  static readonly OPEN = 1
  static readonly CLOSING = 2
  static readonly CLOSED = 3
  readonly readyState = 0
  readonly url: string
  binaryType: BinaryType = 'blob'
  onopen = null
  onmessage = null
  onerror = null
  onclose = null
  constructor(url: string | URL) {
    super()
    this.url = String(url)
    journal().unanswered.push({ method: 'WS', url: this.url, status: 0 })
  }
  send() {}
  close() {}
}

function installWebSocket() {
  const RealSocket = window.WebSocket
  const Guarded = function (this: unknown, url: string | URL, protocols?: string | string[]) {
    const target = new URL(String(url), window.location.href)
    // The dev server's hot reload is the only socket the preview opens.
    if (target.host === window.location.host && protocols === 'vite-hmr') return new RealSocket(url, protocols)
    return new SilentSocket(url)
  } as unknown as typeof WebSocket
  Object.assign(Guarded, { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 })
  window.WebSocket = Guarded
}

/** Installs all three. Call once, before the application is imported. */
export async function installInterception() {
  journal()
  installFetch()
  installWebSocket()
  const { httpClient } = await import('@/services/api/httpClient')
  httpClient.defaults.adapter = axiosAdapter(httpClient)
}
