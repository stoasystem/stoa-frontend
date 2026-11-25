/**
 * Card 134-F2: the usage statistics page, through the real API layer against
 * a backend mocked to the agreed contract.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import enAdmin from '@/i18n/locales/en/admin.json'
import { AdminAnalyticsPage } from '@/pages/admin/AdminAnalyticsPage'
import type { AnalyticsOverview } from '@/services/admin/analyticsApi'
import { mswServer } from '../mswServer'

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

const OVERVIEW_URL = 'https://api.test/admin/analytics/overview'
const copy = enAdmin.usageAnalytics

function overview(extra: Partial<AnalyticsOverview> = {}): AnalyticsOverview {
  return {
    generatedAt: '2026-11-25T08:00:00Z',
    days: 30,
    role: 'all',
    complete: true,
    kpis: {
      dau: 42,
      wau: 120,
      mau: 310,
      dauChange: 0.12,
      questionsPerDay: 85,
      escalationRate: 0.08,
      aiP50Ms: 2400,
      teacherResponseP50Ms: null,
    },
    activeSeries: [
      { day: '2026-11-23', active: 30 },
      { day: '2026-11-24', active: 38 },
      { day: '2026-11-25', active: 42 },
    ],
    featureRanking: [
      { event: 'chat_message_sent', count: 900, uniqueUsers: 80 },
      { event: 'page_viewed', count: 5000, uniqueUsers: 300 },
      { event: 'mystery_event_x', count: 3, uniqueUsers: 2 },
    ],
    funnel: [
      { step: 'invited', count: 200 },
      { step: 'activated', count: 150 },
      { step: 'first_question', count: 100 },
      { step: 'first_exercise', count: 50 },
      { step: 'week2_active', count: 30 },
    ],
    retention: [
      { cohortWeek: '2026-11-02', size: 40, weeks: [1.0, 0.62, null, null, null] },
    ],
    ...extra,
  }
}

const requests: URLSearchParams[] = []

function serve(body: AnalyticsOverview) {
  mswServer.use(
    http.get(OVERVIEW_URL, ({ request }) => {
      requests.push(new URL(request.url).searchParams)
      return HttpResponse.json(body)
    }),
  )
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/admin/analytics']}>
        <AdminAnalyticsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function kpi(key: string) {
  return document.querySelector(`[data-kpi="${key}"]`) as HTMLElement
}

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }))
beforeEach(async () => {
  requests.length = 0
  await i18n.changeLanguage('en')
})
afterEach(() => mswServer.resetHandlers())
afterAll(() => mswServer.close())

describe('usage statistics page (134-F2)', () => {
  it('shows the KPIs, with a dash and a note where data is missing', async () => {
    serve(overview())
    renderPage()

    await screen.findByText(copy.kpis.dau)
    expect(within(kpi('dau')).getByText('42')).toBeInTheDocument()
    expect(within(kpi('dau')).getByText('+12% vs last week')).toBeInTheDocument()
    expect(within(kpi('questions')).getByText('8% passed to a teacher')).toBeInTheDocument()
    expect(within(kpi('ai')).getByText('2.4 s')).toBeInTheDocument()
    expect(within(kpi('teacher')).getByText('—')).toBeInTheDocument()
    expect(within(kpi('teacher')).getByText(copy.missing)).toBeInTheDocument()
    expect(requests[0].get('days')).toBe('30')
    expect(requests[0].get('role')).toBe('all')
  })

  it('shows each funnel step with its share of the first step', async () => {
    serve(overview())
    renderPage()

    const step = await waitFor(() => {
      const found = document.querySelector('[data-step="first_exercise"]') as HTMLElement
      expect(found).not.toBeNull()
      return found
    })
    expect(within(step).getByText(copy.funnel.steps.first_exercise)).toBeInTheDocument()
    expect(within(step).getByText('50')).toBeInTheDocument()
    expect(step.querySelector('[data-share]')).toHaveTextContent('25%')
    expect(document.querySelector('[data-step="invited"] [data-share]')).toHaveTextContent('100%')
  })

  it('names events in words and shows an unknown event as it came', async () => {
    serve(overview())
    renderPage()

    await screen.findByText(copy.events.page_viewed)
    expect(screen.getByText(copy.events.chat_message_sent)).toBeInTheDocument()
    expect(screen.getByText('mystery_event_x')).toBeInTheDocument()
  })

  it('leaves a retention week not yet reached blank', async () => {
    serve(overview())
    renderPage()

    const row = await waitFor(() => {
      const found = document.querySelector('[data-cohort="2026-11-02"]') as HTMLElement
      expect(found).not.toBeNull()
      return found
    })
    expect(row.querySelector('[data-week="0"]')).toHaveTextContent('100%')
    expect(row.querySelector('[data-week="1"]')).toHaveTextContent('62%')
    const empty = row.querySelector('[data-week="2"]') as HTMLElement
    expect(empty).toHaveTextContent('—')
    expect(empty).toHaveAttribute('title', copy.retention.noValue)
  })

  it('says when the figures are not complete, and only then', async () => {
    serve(overview({ complete: false }))
    const { unmount } = renderPage()
    expect(await screen.findByText(copy.incomplete)).toBeInTheDocument()
    unmount()

    serve(overview())
    renderPage()
    await screen.findByText(copy.kpis.dau)
    expect(screen.queryByText(copy.incomplete)).not.toBeInTheDocument()
  })

  it('asks again with the role and the period chosen', async () => {
    serve(overview())
    renderPage()
    await screen.findByText(copy.kpis.dau)

    await userEvent.click(screen.getByRole('button', { name: copy.roles.teacher }))
    await waitFor(() => expect(requests.at(-1)?.get('role')).toBe('teacher'))
    expect(requests.at(-1)?.get('days')).toBe('30')

    await userEvent.click(screen.getByRole('button', { name: '7 days' }))
    await waitFor(() => expect(requests.at(-1)?.get('days')).toBe('7'))
    expect(requests.at(-1)?.get('role')).toBe('teacher')
  })

  it('shows the empty state when nothing was recorded', async () => {
    serve(
      overview({
        activeSeries: [],
        featureRanking: [],
        funnel: [],
        retention: [],
      }),
    )
    renderPage()
    expect(await screen.findByText(copy.empty.title)).toBeInTheDocument()
  })

  it('says the page failed when the read fails', async () => {
    mswServer.use(http.get(OVERVIEW_URL, () => HttpResponse.json({ detail: 'boom' }, { status: 500 })))
    renderPage()
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})
