/**
 * The API contract gate read only httpClient calls with a literal path, so it
 * skipped fetch() and constant paths, and passed with nothing checked if the
 * way services are written changed (#345). Each blind spot is fed in here.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  KNOWN_GAPS,
  MIN_CHECKED_CALLS,
  collectCalls,
  findMissing,
  loadBackendRoutes,
} from '../../scripts/api-contract.mjs'

const one = (source: string, file = 'src/services/x.ts') => collectCalls([{ file, source }])
const backend = loadBackendRoutes([
  { method: 'post', path: '/auth/logout' },
  { method: 'get', path: '/students/{student_id}' },
])

describe('what the gate reads', () => {
  it.each([
    ['a tagged path', 'httpClient.get<X>(apiPath`/students/${id}`)', 'GET', '/students/${id}'],
    ['a string path over two lines', "httpClient.post(\n  '/auth/logout',\n  body)", 'POST', '/auth/logout'],
    ['a constant path', "const LOGOUT_PATH = '/auth/logout'\nhttpClient.post(\n  LOGOUT_PATH,\n  {})", 'POST', '/auth/logout'],
    ['a string with a query on the end', "httpClient.get('/x' + (query ? `?${query}` : ''))", 'GET', '/x'],
    ['a tagged path holding a quote', "httpClient.get(apiPath`/p/${t ?? 'default'}/path`)", 'GET', "/p/${t ?? 'default'}/path"],
    ['a fetch to a literal path', "fetch(`${apiBaseUrl}/auth/logout`, { method: 'POST' })", 'POST', '/auth/logout'],
    ['a fetch to a tagged path', 'fetch(`${apiBaseUrl}${apiPath`/students/${id}`}`, {})', 'GET', '/students/${id}'],
    ['a fetch to a constant', "const E = '/auth/logout'\nfetch(`${apiBaseUrl}${E}`, {\n  method: 'POST',\n})", 'POST', '/auth/logout'],
  ])('%s', (_form, source, method, path) => {
    expect(one(source)).toEqual({ calls: [{ method, path, file: 'src/services/x.ts' }], unparsed: [] })
  })

  it('resolves a constant exported from another service file', () => {
    const { calls } = collectCalls([
      { file: 'src/services/a.ts', source: "export const LOGOUT_PATH = '/auth/logout'" },
      { file: 'src/services/b.ts', source: 'httpClient.post(LOGOUT_PATH, {})' },
    ])
    expect(calls).toEqual([{ method: 'POST', path: '/auth/logout', file: 'src/services/b.ts' }])
  })
})

describe('what the gate refuses to skip', () => {
  it.each([
    ['a path built at run time', 'httpClient.get(`/students/` + id)'],
    ['a string with more path added', "httpClient.get('/students/' + id + '/summary')"],
    ['a constant it cannot resolve', 'httpClient.post(SOMEWHERE, {})'],
    ['a method it does not know', "httpClient.request({ url: '/x' })"],
    ['a fetch to another origin', "fetch('https://example.com/x')"],
    ['a fetch to a variable', 'fetch(url, init)'],
  ])('%s', (_form, source) => {
    const { calls, unparsed } = one(source)
    expect(calls).toEqual([])
    expect(unparsed).toHaveLength(1)
    expect(unparsed[0]).toMatchObject({ file: 'src/services/x.ts', line: 1 })
  })

  it('skips only the interceptor replay it names', () => {
    const file = 'src/services/api/httpClient.ts'
    expect(one('return httpClient.request(config)', file).unparsed).toEqual([])
    expect(one('return httpClient.request(config)').unparsed).toHaveLength(1)
  })
})

describe('the comparison', () => {
  it('reports a fetch to a route the backend does not have', () => {
    const { calls } = one("fetch(`${apiBaseUrl}/auth/refresh`, { method: 'POST' })")
    expect([...findMissing(backend, calls, []).missing]).toEqual([['src/services/x.ts', ['POST /auth/refresh']]])
  })

  it('excuses a known gap, and fails it once nothing needs it', () => {
    const gap = { file: 'src/services/x.ts', call: 'POST /auth/refresh', reason: 'test' }
    const { calls } = one("fetch(`${apiBaseUrl}/auth/refresh`, { method: 'POST' })")
    expect(findMissing(backend, calls, [gap])).toEqual({ missing: new Map(), staleGaps: [] })
    expect(findMissing(backend, [], [gap]).staleGaps).toEqual([gap])
  })
})

describe('the services as they are', () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((entry) => {
      const full = join(dir, entry)
      return statSync(full).isDirectory() ? walk(full) : /\.tsx?$/.test(full) ? [full] : []
    })
  const { calls, unparsed } = collectCalls(
    walk('src/services').map((file) => ({ file, source: readFileSync(file, 'utf8') })),
  )
  const seen = calls.map((call) => `${call.method} ${call.path}`)

  it('reads every request, and enough of them to mean something', () => {
    expect(unparsed).toEqual([])
    expect(calls.length).toBeGreaterThanOrEqual(MIN_CHECKED_CALLS)
  })

  it.each([
    'POST /conversations/${conversationId}/messages/stream',
    'POST /auth/refresh',
    'POST /auth/logout',
    'POST /analytics/events',
    'POST /monitoring/frontend-errors',
  ])('checks %s', (call) => {
    expect(seen).toContain(call)
  })

  it('keeps a reason on every known gap', () => {
    for (const gap of KNOWN_GAPS) expect(gap.reason).toBeTruthy()
  })
})
