/**
 * Card 134-F1: the system health overview and one feature's details.
 *
 * Eight feature cards in a fixed order, each a real link to its details; the
 * status maps to the semantic tones; the time window travels as `?window=`;
 * an empty window and a failed read each say so.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import enAdmin from '@/i18n/locales/en/admin.json'
import { AdminSystemFeaturePage } from '@/pages/admin/AdminSystemFeaturePage'
import { AdminSystemHealthPage } from '@/pages/admin/AdminSystemHealthPage'
import type {
  FeatureHealth,
  SystemFeatureResponse,
  SystemHealthResponse,
} from '@/services/admin/systemHealthApi'
import { mswServer } from '../mswServer'

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

const API = 'https://api.test'
const copy = enAdmin.systemHealth
const ORDER = ['auth', 'practice', 'ask_ai', 'teacher_help', 'voice', 'notifications', 'parent_reports', 'admin'] as const

function feature(key: string, extra: Partial<FeatureHealth> = {}): FeatureHealth {
  return {
    key,
    status: 'ok',
    requests: 3100,
    errorRate: 0.002,
    p95Ms: 900,
    p95LimitMs: 1500,
    spark: Array.from({ length: 12 }, (_, i) => ({ t: `2026-11-25T${String(i).padStart(2, '0')}:00:00Z`, requests: 100, p95Ms: 800 + i * 10 })),
    probe: { ok: true, lastRunAt: '2026-11-25T11:55:00Z', latencyMs: 820 },
    openAlarms: 0,
    ...extra,
  }
}

function health(extra: Partial<SystemHealthResponse> = {}): SystemHealthResponse {
  return {
    generatedAt: '2026-11-25T12:00:00Z',
    window: '24h',
    // Reversed and with `other`: the page orders and filters them itself.
    features: [
      ...[...ORDER].reverse().map((key) =>
        feature(key, {
          status: key === 'practice' ? 'warn' : key === 'voice' ? 'bad' : key === 'admin' ? 'unknown' : 'ok',
        }),
      ),
      feature('other'),
    ],
    alarms: [
      { name: 'stoa-feature-voice-error-rate', feature: 'voice', state: 'ALARM', since: '2026-11-25T10:00:00Z', reason: 'threshold' },
      { name: 'stoa-feature-auth-latency', feature: 'auth', state: 'OK', since: '2026-11-24T10:00:00Z', reason: null },
    ],
    deploys: [{ at: '2026-11-25T09:00:00Z', release: 'fe-abc1234' }],
    frontendErrors: { total: 7 },
    ...extra,
  }
}

function detail(extra: Partial<SystemFeatureResponse> = {}): SystemFeatureResponse {
  return {
    generatedAt: '2026-11-25T12:00:00Z',
    window: '24h',
    feature: feature('practice', { status: 'warn', p95Ms: 1900 }),
    series: Array.from({ length: 6 }, (_, i) => ({
      t: `2026-11-25T${String(i * 4).padStart(2, '0')}:00:00Z`,
      requests: 500,
      errors: i === 2 ? 3 : 0,
      p50Ms: 300,
      p95Ms: 1200 + i * 100,
    })),
    routes: [
      { method: 'GET', route: '/practice/fast', requests: 900, errorRate: 0, p50Ms: 100, p95Ms: 300 },
      { method: 'GET', route: '/practice/knowledge-map/stars', requests: 1200, errorRate: 0.01, p50Ms: 600, p95Ms: 2400 },
    ],
    recentErrors: [{ at: '2026-11-25T08:00:00Z', method: 'GET', route: '/practice/knowledge-map/stars', status: 500, count: 3 }],
    frontendErrors: [
      { messageHash: 'h1', message: 'TypeError: x is undefined', route: '/map', release: 'fe-abc1234', count: 7, lastAt: '2026-11-25T11:00:00Z' },
    ],
    probes: [{ at: '2026-11-25T11:55:00Z', ok: false, latencyMs: 4100, step: 'stars' }],
    alarms: [],
    usage: [{ event: 'page_viewed', count: 42 }],
    ...extra,
  }
}

let healthWindows: string[] = []
let featureCalls: { feature: string; window: string | null }[] = []

function serve(overview: SystemHealthResponse | null, one: SystemFeatureResponse = detail()) {
  mswServer.use(
    http.get(`${API}/admin/system/health`, ({ request }) => {
      healthWindows.push(new URL(request.url).searchParams.get('window') ?? '')
      return overview ? HttpResponse.json(overview) : HttpResponse.json({ detail: 'boom' }, { status: 500 })
    }),
    http.get(`${API}/admin/system/features/:feature`, ({ request, params }) => {
      featureCalls.push({ feature: String(params.feature), window: new URL(request.url).searchParams.get('window') })
      return HttpResponse.json(one)
    }),
  )
}

function renderAt(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/admin/system" element={<AdminSystemHealthPage />} />
          <Route path="/admin/system/:feature" element={<AdminSystemFeaturePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const cards = () => screen.getByRole('region', { name: copy.featureGrid }).querySelectorAll('[data-feature-card]')

beforeAll(async () => {
  mswServer.listen({ onUnhandledRequest: 'bypass' })
  await i18n.changeLanguage('en')
})
afterAll(() => mswServer.close())
beforeEach(() => {
  healthWindows = []
  featureCalls = []
})
afterEach(() => mswServer.resetHandlers())

describe('system health overview', () => {
  it('shows the eight features in their fixed order, each a link to its details', async () => {
    serve(health())
    renderAt('/admin/system')
    await screen.findByRole('link', { name: /Star map and practice/ })
    expect(Array.from(cards()).map((card) => card.getAttribute('data-feature-card'))).toEqual([...ORDER])
    const practice = screen.getByRole('link', { name: /Star map and practice/ })
    expect(practice.tagName).toBe('A')
    expect(practice).toHaveAttribute('href', '/admin/system/practice?window=24h')
    expect(healthWindows).toEqual(['24h'])
  })

  it('maps each status to its badge and tone', async () => {
    serve(health())
    renderAt('/admin/system')
    await screen.findByRole('link', { name: /Star map and practice/ })
    const badge = (name: RegExp) => {
      const card = screen.getByRole('link', { name })
      return card.querySelector('[data-tone]') as HTMLElement
    }
    expect(badge(/Sign-in and accounts/)).toHaveTextContent(copy.status.ok)
    expect(badge(/Sign-in and accounts/)).toHaveAttribute('data-tone', 'green')
    expect(badge(/Star map and practice/)).toHaveTextContent(copy.status.warn)
    expect(badge(/Star map and practice/)).toHaveAttribute('data-tone', 'gold')
    expect(badge(/Voice questions/)).toHaveTextContent(copy.status.bad)
    expect(badge(/Voice questions/)).toHaveAttribute('data-tone', 'danger')
    expect(badge(/Admin console/)).toHaveTextContent(copy.status.unknown)
    expect(badge(/Admin console/)).toHaveAttribute('data-tone', 'neutral')
  })

  it('lists firing alarms in words, the deploys and the frontend error total', async () => {
    serve(health())
    renderAt('/admin/system')
    const alarms = await screen.findByRole('region', { name: copy.alarms.title })
    expect(within(alarms).getByText('Voice questions: too many errors')).toBeInTheDocument()
    expect(within(alarms).queryByText(/Sign-in and accounts/)).not.toBeInTheDocument()
    const deploys = screen.getByRole('region', { name: copy.deploys.title })
    expect(within(deploys).getByText('fe-abc1234')).toBeInTheDocument()
    const frontend = screen.getByRole('region', { name: copy.frontendErrors.title })
    expect(frontend.querySelector('[data-frontend-errors]')).toHaveTextContent('7')
    expect(frontend.querySelector('[data-frontend-error-list]')).toBeNull()
  })

  it('says so when nothing fired and nothing shipped, and a feature without data reads as no data', async () => {
    serve(health({ features: [], alarms: [], deploys: null, frontendErrors: null }))
    renderAt('/admin/system')
    const alarms = await screen.findByRole('region', { name: copy.alarms.title })
    expect(within(alarms).getByText(copy.alarms.empty)).toBeInTheDocument()
    expect(screen.getByText(copy.deploys.empty)).toBeInTheDocument()
    expect(cards()).toHaveLength(8)
    for (const card of Array.from(cards())) {
      expect(card.querySelector('[data-tone]')).toHaveAttribute('data-tone', 'neutral')
    }
  })

  it('shows an error state when the read fails', async () => {
    serve(null)
    renderAt('/admin/system')
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(copy.loadFailed)
    expect(screen.queryByRole('region', { name: copy.featureGrid })).not.toBeInTheDocument()
  })

  it('asks for the chosen window and carries it into the card links', async () => {
    serve(health())
    renderAt('/admin/system')
    await screen.findByRole('link', { name: /Star map and practice/ })
    await userEvent.click(screen.getByRole('button', { name: copy.window['7d'] }))
    await waitFor(() => expect(healthWindows).toContain('7d'))
    await waitFor(() =>
      expect(screen.getByRole('link', { name: /Star map and practice/ })).toHaveAttribute('href', '/admin/system/practice?window=7d'),
    )
    expect(screen.getByRole('button', { name: copy.window['7d'] })).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('134-R3: trends, alarms in words, deploy labels, frontend errors, p50', () => {
  const trendChart = () => screen.getByRole('group', { name: copy.trends.label })

  it('draws one p95 line per feature with data and a dashed vertical only for deploys inside the window', async () => {
    serve(
      health({
        features: ORDER.map((key) => (key === 'admin' ? feature(key, { spark: null }) : feature(key))),
        deploys: [
          { at: '2026-11-25T09:00:00Z', release: 'v481', label: 'a1b2c3d4 Gzip every answer over a kilobyte' },
          { at: '2026-11-25T11:30:00Z', release: 'v482', label: null },
          { at: '2026-11-20T09:00:00Z', release: 'v470', label: 'old one' },
        ],
      }),
    )
    renderAt('/admin/system')
    const section = await screen.findByRole('region', { name: copy.trends.title })
    const chart = trendChart()
    expect(Array.from(chart.querySelectorAll('[data-trend-line]')).map((line) => line.getAttribute('data-trend-line'))).toEqual(
      ORDER.filter((key) => key !== 'admin'),
    )
    expect(section.querySelectorAll('[data-legend]')).toHaveLength(8)
    const markers = Array.from(chart.querySelectorAll('[data-deploy-marker]'))
    expect(markers.map((marker) => marker.getAttribute('data-deploy-marker'))).toEqual(['v481', 'v482'])
    expect(markers[0].querySelector('title')).toHaveTextContent('a1b2c3d4 Gzip every answer over a kilobyte')
    expect(markers[0]).toHaveAttribute('tabindex', '0')
    expect(markers[1].querySelector('title')).toHaveTextContent('v482')
    expect(chart.querySelector('[data-deploy-marker="v470"]')).toBeNull()
  })

  it('shows the designed empty state when no feature has response times', async () => {
    serve(health({ features: ORDER.map((key) => feature(key, { spark: [] })) }))
    renderAt('/admin/system')
    const section = await screen.findByRole('region', { name: copy.trends.title })
    expect(within(section).getByText(copy.trends.empty)).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: copy.trends.label })).not.toBeInTheDocument()
  })

  it('names alarms in words, falls back to the description, then to the raw name', async () => {
    const firing = (name: string, extra: Record<string, unknown> = {}) => ({
      name,
      feature: null,
      state: 'ALARM' as const,
      since: '2026-11-25T10:00:00Z',
      reason: null,
      ...extra,
    })
    serve(
      health({
        alarms: [
          firing('stoa-feature-practice-latency', { feature: 'practice' }),
          firing('stoa-api-p99-latency'),
          firing('stoa-owner-registry-sweep-findings'),
          firing('stoa-voice-dlq-messages'),
          firing('stoa-daily-rollup-errors'),
          firing('stoa-custom-thing', { description: 'practice: p95 latency above 1500 ms for 15 minutes' }),
          firing('stoa-mystery-alarm', { description: null }),
        ],
      }),
    )
    renderAt('/admin/system')
    const alarms = await screen.findByRole('region', { name: copy.alarms.title })
    const texts = within(alarms).getAllByRole('listitem').map((item) => item.querySelector('[title]'))
    expect(texts.map((node) => node?.textContent)).toEqual([
      'Star map and practice: responses too slow',
      copy.alarms.known.apiLatency,
      copy.alarms.known.ownerRegistrySweep,
      'Queue voice: messages could not be processed',
      'Background task daily-rollup failed',
      'practice: p95 latency above 1500 ms for 15 minutes',
      'stoa-mystery-alarm',
    ])
    expect(texts.map((node) => node?.getAttribute('title'))).toEqual([
      'stoa-feature-practice-latency',
      'stoa-api-p99-latency',
      'stoa-owner-registry-sweep-findings',
      'stoa-voice-dlq-messages',
      'stoa-daily-rollup-errors',
      'stoa-custom-thing',
      'stoa-mystery-alarm',
    ])
  })

  it('shows a deploy by its label, else by its release', async () => {
    serve(
      health({
        deploys: [
          { at: '2026-11-25T09:00:00Z', release: 'v481', label: 'a1b2c3d4 Gzip every answer over a kilobyte' },
          { at: '2026-11-25T08:00:00Z', release: 'v480', label: null },
        ],
      }),
    )
    renderAt('/admin/system')
    const deploys = await screen.findByRole('region', { name: copy.deploys.title })
    const shown = Array.from(deploys.querySelectorAll('[data-deploy]'))
    expect(shown.map((node) => node.textContent)).toEqual(['a1b2c3d4 Gzip every answer over a kilobyte', 'v480'])
    expect(shown[0]).toHaveAttribute('title', 'a1b2c3d4 Gzip every answer over a kilobyte')
    expect(shown[0]).toHaveClass('font-mono', 'truncate')
  })

  it('lists frontend errors one by one with the total', async () => {
    serve(
      health({
        frontendErrors: {
          total: 9,
          items: [
            { messageHash: 'h1', message: 'TypeError: x is undefined', route: '/practice/:lessonId', release: 'r1', count: 7, lastAt: '2026-11-25T11:00:00Z' },
            { messageHash: 'h2', message: null, route: null, release: null, count: 1, lastAt: null },
          ],
        },
      }),
    )
    renderAt('/admin/system')
    const frontend = await screen.findByRole('region', { name: copy.frontendErrors.title })
    expect(frontend.querySelector('[data-frontend-errors]')).toHaveTextContent('9')
    const rows = frontend.querySelectorAll('[data-frontend-error]')
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent('TypeError: x is undefined')
    expect(rows[0]).toHaveTextContent('/practice/:lessonId')
    expect(rows[0]).toHaveTextContent('7 times')
    expect(rows[1]).toHaveTextContent(copy.detail.frontendErrors.noMessage)
    expect(rows[1]).toHaveTextContent('1 time')
  })

  it('shows the p50 from the feature on the detail summary', async () => {
    serve(health(), detail({ feature: feature('practice', { status: 'warn', p95Ms: 1900, p50Ms: 120 }) }))
    renderAt('/admin/system/practice')
    const label = await screen.findByText(copy.metric.p50, { selector: 'dt' })
    expect(label.parentElement?.querySelector('dd')).toHaveTextContent('120 ms')
  })
})

describe('feature details', () => {
  it('opens from its card with the same window', async () => {
    serve(health())
    renderAt('/admin/system')
    await userEvent.click(await screen.findByRole('link', { name: /Star map and practice/ }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Star map and practice' })).toBeInTheDocument()
    await waitFor(() => expect(featureCalls).toEqual([{ feature: 'practice', window: '24h' }]))
    expect(screen.getByRole('link', { name: copy.title })).toHaveAttribute('href', '/admin/system?window=24h')
  })

  it('lists the routes slowest first and marks the ones over the limit', async () => {
    serve(health())
    renderAt('/admin/system/practice?window=7d')
    const routes = await screen.findByRole('region', { name: copy.detail.routes.title })
    const rows = within(routes).getAllByRole('row').slice(1)
    expect(rows.map((row) => within(row).getAllByRole('cell')[1].textContent)).toEqual([
      `/practice/knowledge-map/stars${copy.detail.routes.overLimit}`,
      '/practice/fast',
    ])
    expect(featureCalls[0]).toEqual({ feature: 'practice', window: '7d' })
    expect(screen.getByRole('img', { name: copy.detail.chart.label }).querySelector('[data-limit]')).not.toBeNull()
    expect(within(screen.getByRole('region', { name: copy.detail.probes.title })).getByText(copy.detail.probes.failed)).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: copy.detail.alarms.title })).getByText(copy.detail.alarms.empty)).toBeInTheDocument()
  })

  it('says the window held no requests instead of drawing an empty chart', async () => {
    serve(
      health(),
      detail({
        feature: feature('voice', { status: 'unknown', requests: 0 }),
        series: [],
        routes: [],
        recentErrors: null,
        frontendErrors: [],
        probes: [],
        usage: null,
      }),
    )
    renderAt('/admin/system/voice')
    expect(await screen.findByText(copy.detail.chart.empty)).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: copy.detail.chart.label })).not.toBeInTheDocument()
    expect(screen.getByText(copy.detail.routes.empty)).toBeInTheDocument()
    expect(screen.getByText(copy.detail.recentErrors.empty)).toBeInTheDocument()
    expect(screen.getByText(copy.detail.usage.empty)).toBeInTheDocument()
  })

  it('refuses an unknown feature without asking the server', async () => {
    serve(health())
    renderAt('/admin/system/..%2Fusers')
    expect(await screen.findByText(copy.detail.unknownFeatureHint)).toBeInTheDocument()
    expect(featureCalls).toEqual([])
  })
})
