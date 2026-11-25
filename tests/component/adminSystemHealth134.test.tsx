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
    expect(deploys.querySelector('[data-frontend-errors]')).toHaveTextContent('7')
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
