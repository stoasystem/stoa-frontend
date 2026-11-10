/**
 * #621 (stoa-backend#363): the three notification emails -- a parent's weekly
 * report, a teacher's help-request reminder, the notification digest -- end
 * with a link to `/unsubscribe?token=…`. The page is public: the signed token
 * is the credential, names one person and one kind of email, and never
 * expires. Opening it unsubscribes (`POST /notifications/email-unsubscribe`),
 * and the page offers to undo it (`POST /notifications/email-resubscribe`).
 * Any refused link reads the same, whatever the reason the backend had.
 *
 * Through the real `httpClient` against a mocked backend, so what is asserted
 * is what leaves the browser, the absent session header included.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { StrictMode, Suspense } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppRoutes } from '@/app/router/AppRoutes'
import { pageRoutes } from '@/app/router/routeManifest'
import i18n from '@/i18n'
import deCommon from '@/i18n/locales/de/common.json'
import { type CurrentUser, TOKEN_KEY, useAuthStore } from '@/store/authStore'
import { mswServer } from '../mswServer'

const API = 'https://api.test'
const TOKEN = 'eyJjIjoid2Vla2x5X3JlcG9ydCJ9.c2lnbmF0dXJl'
const de = deCommon.emailUnsubscribe
const LANGUAGES = ['de', 'en', 'fr', 'it'] as const
const KINDS = ['weekly_report', 'dispatch_reminder', 'notification_digest'] as const

type Call = { path: string; token: string | null; authorization: string | null }

function backend({
  kind = 'weekly_report',
  refuse,
}: { kind?: string; refuse?: { status: number; body?: unknown } } = {}) {
  const calls: Call[] = []
  const refreshes = vi.fn()
  const answer = (subscribed: boolean) => ({ request }: { request: Request }) => {
    const url = new URL(request.url)
    calls.push({ path: url.pathname, token: url.searchParams.get('token'), authorization: request.headers.get('authorization') })
    if (refuse) return HttpResponse.json(refuse.body ?? null, { status: refuse.status })
    return HttpResponse.json({ kind, subscribed })
  }
  mswServer.use(
    http.post(`${API}/notifications/email-unsubscribe`, answer(false)),
    http.post(`${API}/notifications/email-resubscribe`, answer(true)),
    http.post(`${API}/auth/refresh`, () => {
      refreshes()
      return HttpResponse.json({ detail: 'no' }, { status: 401 })
    }),
  )
  return { calls, refreshes }
}

const INVALID = { status: 400, body: { detail: { code: 'email_unsubscribe_link_invalid', message: 'This link is not valid.', correlationId: 'e2e-correlation' } } }

function renderAt(path: string, { strict = false } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const tree = (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[path]}>
          <Suspense fallback={null}>
            <AppRoutes />
          </Suspense>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>
  )
  render(strict ? <StrictMode>{tree}</StrictMode> : tree)
}

const heading = () => screen.findByRole('heading', { level: 1, name: de.title }, { timeout: 5_000 })

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }))
beforeEach(async () => {
  await i18n.changeLanguage('de')
})
afterEach(() => {
  mswServer.resetHandlers()
  sessionStorage.clear()
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})
afterAll(() => mswServer.close())

describe('the /unsubscribe route', () => {
  it('is public', () => {
    const route = pageRoutes.find((entry) => entry.path === '/unsubscribe')
    expect(route?.access).toEqual({ kind: 'public' })
  })
})

describe('opening an unsubscribe link', () => {
  it('unsubscribes once, with the token from the link, and says which email stops', async () => {
    const { calls } = backend()
    renderAt(`/unsubscribe?token=${encodeURIComponent(TOKEN)}`, { strict: true })

    await heading()
    expect(await screen.findByText(de.unsubscribed.title)).toBeInTheDocument()
    expect(screen.getByText(de.unsubscribed.kinds.weekly_report)).toBeInTheDocument()
    expect(calls).toEqual([{ path: '/notifications/email-unsubscribe', token: TOKEN, authorization: null }])
  })

  it.each(KINDS)('names the %s email', async (kind) => {
    backend({ kind })
    renderAt(`/unsubscribe?token=${TOKEN}`)

    expect(await screen.findByText(de.unsubscribed.kinds[kind])).toBeInTheDocument()
  })

  it('still says it is done for a kind it has no words for', async () => {
    backend({ kind: 'something_new' })
    renderAt(`/unsubscribe?token=${TOKEN}`)

    expect(await screen.findByText(de.unsubscribed.kinds.other)).toBeInTheDocument()
  })

  it('undoes it from the same link, and can unsubscribe again', async () => {
    const { calls } = backend()
    renderAt(`/unsubscribe?token=${TOKEN}`)

    await userEvent.click(await screen.findByRole('button', { name: de.undo }))
    expect(await screen.findByText(de.resubscribed.title)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: de.again }))
    expect(await screen.findByText(de.unsubscribed.title)).toBeInTheDocument()

    expect(calls.map((call) => [call.path, call.token])).toEqual([
      ['/notifications/email-unsubscribe', TOKEN],
      ['/notifications/email-resubscribe', TOKEN],
      ['/notifications/email-unsubscribe', TOKEN],
    ])
  })

  it('sends no session from a signed-in tab, and a refusal signs nobody out', async () => {
    sessionStorage.setItem(TOKEN_KEY, 'token-p')
    const parent = { id: 'u-p', name: 'Pia', email: 'pia@example.com', role: 'parent' } as CurrentUser
    useAuthStore.setState({ user: parent, accessToken: 'token-p', isAuthenticated: true })
    const { calls, refreshes } = backend({ refuse: { status: 401 } })
    renderAt(`/unsubscribe?token=${TOKEN}`)

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(calls.map((call) => call.authorization)).toEqual([null])
    expect(refreshes).not.toHaveBeenCalled()
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })
})

describe('a link that is refused', () => {
  it.each([
    ['refused by the backend', INVALID],
    ['too long to be one', { status: 422, body: { detail: [{ loc: ['query', 'token'], msg: 'too long' }] } }],
  ])('reads as one invalid link when %s, with nothing to undo', async (_, refuse) => {
    backend({ refuse })
    renderAt(`/unsubscribe?token=${TOKEN}`)

    expect(await screen.findByRole('alert')).toHaveTextContent(de.invalid)
    expect(within(screen.getByRole('region', { name: de.title })).queryByRole('button')).not.toBeInTheDocument()
  })

  it('reads the same with no token at all, and asks nothing of the backend', async () => {
    const { calls } = backend()
    renderAt('/unsubscribe')

    expect(await screen.findByRole('alert')).toHaveTextContent(de.invalid)
    expect(calls).toEqual([])
  })

  it('says a failure that is not the link apart, and tries again', async () => {
    let fail = true
    const calls: string[] = []
    mswServer.use(
      http.post(`${API}/notifications/email-unsubscribe`, () => {
        calls.push('unsubscribe')
        if (fail) return new HttpResponse(null, { status: 503 })
        return HttpResponse.json({ kind: 'dispatch_reminder', subscribed: false })
      }),
    )
    renderAt(`/unsubscribe?token=${TOKEN}`)

    expect(await screen.findByRole('alert')).toHaveTextContent(de.failed)
    fail = false
    await userEvent.click(screen.getByRole('button', { name: de.retry }))

    expect(await screen.findByText(de.unsubscribed.kinds.dispatch_reminder)).toBeInTheDocument()
    await waitFor(() => expect(calls).toEqual(['unsubscribe', 'unsubscribe']))
  })

  it('keeps the undo when the undo fails, and says so', async () => {
    backend()
    renderAt(`/unsubscribe?token=${TOKEN}`)
    await userEvent.click(await screen.findByRole('button', { name: de.undo }))
    // The undo was answered; now the next one fails.
    mswServer.use(http.post(`${API}/notifications/email-unsubscribe`, () => new HttpResponse(null, { status: 500 })))
    await userEvent.click(await screen.findByRole('button', { name: de.again }))

    expect(await screen.findByRole('alert')).toHaveTextContent(de.failed)
    expect(screen.getByText(de.resubscribed.title)).toBeInTheDocument()
  })
})

describe('the copy', () => {
  // Read from the files, not through i18n, which would fall back to another
  // language for a missing key.
  it.each(LANGUAGES)('is all there in %s', async (lng) => {
    const common = (await import(`@/i18n/locales/${lng}/common.json`)).default
    const copy = common.emailUnsubscribe
    const texts = [
      common.routes.unsubscribe.title,
      copy.title,
      copy.working,
      copy.unsubscribed.title,
      ...[...KINDS, 'other'].map((kind) => copy.unsubscribed.kinds[kind]),
      copy.resubscribed.title,
      copy.resubscribed.body,
      copy.undo,
      copy.again,
      copy.invalid,
      copy.failed,
      copy.retry,
    ]
    for (const text of texts) expect(typeof text === 'string' && text.length > 0, `${lng}: ${text}`).toBe(true)
  })

  it('writes Swiss German, without ß', () => {
    expect(JSON.stringify(de)).not.toContain('ß')
  })
})
