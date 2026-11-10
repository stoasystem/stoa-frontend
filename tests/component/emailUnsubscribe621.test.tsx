/**
 * #621 (stoa-backend#363): every notification email that recurs carries an
 * unsubscribe link to `/unsubscribe?token=…`. The page stops that one kind of
 * email and says which, offers an undo, and answers every link the backend
 * refuses with one sentence. A parent can also switch the weekly report email
 * on /parent/account-operations, and is told the report stays in STOA.
 *
 * Driven through the real API layer against a mocked backend, so what is
 * checked is what reaches the endpoints.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { Suspense } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { pageRoutes } from '@/app/router/routeManifest'
import { ParentNotificationSettingsCard } from '@/components/parent/ParentNotificationSettingsCard'
import i18n from '@/i18n'
import deCommon from '@/i18n/locales/de/common.json'
import deParent from '@/i18n/locales/de/parent.json'
import enCommon from '@/i18n/locales/en/common.json'
import enParent from '@/i18n/locales/en/parent.json'
import frCommon from '@/i18n/locales/fr/common.json'
import frParent from '@/i18n/locales/fr/parent.json'
import itCommon from '@/i18n/locales/it/common.json'
import itParent from '@/i18n/locales/it/parent.json'
import { UnsubscribePage } from '@/pages/email/UnsubscribePage'
import { mswServer } from '../mswServer'

const page = enCommon.unsubscribe
const card = enParent.notifications
const TOKEN = 'eyJjIjoid2Vla2x5X3JlcG9ydCJ9.c2lnbmF0dXJl'
const API = 'https://api.test/notifications'

const INVALID = { detail: { code: 'email_unsubscribe_link_invalid', message: 'This unsubscribe link is not valid.' } }

/** The backend for one token: what it stores, and every call that reached it. */
function backend({ kind = 'weekly_report', valid = true } = {}) {
  const calls: { path: string; token: string | null }[] = []
  let subscribed = true
  const answer = (next: boolean) =>
    async ({ request }: { request: Request }) => {
      const url = new URL(request.url)
      calls.push({ path: url.pathname, token: url.searchParams.get('token') })
      if (!valid || url.searchParams.get('token') !== TOKEN) return HttpResponse.json(INVALID, { status: 400 })
      subscribed = next
      return HttpResponse.json({ kind, subscribed })
    }
  mswServer.use(
    http.post(`${API}/email-unsubscribe`, answer(false)),
    http.post(`${API}/email-resubscribe`, answer(true)),
  )
  return { calls, subscribed: () => subscribed }
}

function client() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
}

function renderPage(search: string) {
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client()}>
        <MemoryRouter initialEntries={[`/unsubscribe${search}`]}>
          <Suspense fallback={null}>
            <UnsubscribePage />
          </Suspense>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

const heading = () => screen.findByRole('heading', { level: 1 })

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }))
beforeEach(async () => {
  await i18n.changeLanguage('en')
})
afterEach(() => mswServer.resetHandlers())
afterAll(() => mswServer.close())

describe('/unsubscribe', () => {
  it('is public: someone opening the email need not be signed in', () => {
    const route = pageRoutes.find((entry) => entry.path === '/unsubscribe')
    expect(route?.access).toEqual({ kind: 'public' })
  })

  it('unsubscribes once on opening, and says which email stopped', async () => {
    const server = backend()
    renderPage(`?token=${encodeURIComponent(TOKEN)}`)

    await waitFor(async () => expect(await heading()).toHaveTextContent(page.heading.unsubscribed))
    expect(screen.getByText(page.stopped.weekly_report)).toBeInTheDocument()
    expect(screen.getByText(page.weeklyReportStillInApp)).toBeInTheDocument()
    expect(server.calls).toEqual([{ path: '/notifications/email-unsubscribe', token: TOKEN }])
    expect(server.subscribed()).toBe(false)
  })

  it('undoes it with the same link, and can unsubscribe again', async () => {
    const server = backend()
    renderPage(`?token=${encodeURIComponent(TOKEN)}`)

    await userEvent.click(await screen.findByRole('button', { name: page.undo }))

    await waitFor(async () => expect(await heading()).toHaveTextContent(page.heading.resubscribed))
    expect(screen.getByText(page.restored.weekly_report)).toBeInTheDocument()
    expect(server.subscribed()).toBe(true)
    expect(server.calls.map((call) => call.path)).toEqual([
      '/notifications/email-unsubscribe',
      '/notifications/email-resubscribe',
    ])
    expect(server.calls.every((call) => call.token === TOKEN)).toBe(true)

    await userEvent.click(screen.getByRole('button', { name: page.unsubscribeAgain }))
    await waitFor(async () => expect(await heading()).toHaveTextContent(page.heading.unsubscribed))
    expect(server.subscribed()).toBe(false)
  })

  it.each([
    ['dispatch_reminder', page.stopped.dispatch_reminder],
    ['notification_digest', page.stopped.notification_digest],
    // A kind the backend adds later still reads as a sentence, never as its code.
    ['monthly_report', page.stopped.other],
  ])('names the %s email', async (kind, sentence) => {
    backend({ kind })
    renderPage(`?token=${encodeURIComponent(TOKEN)}`)

    expect(await screen.findByText(sentence)).toBeInTheDocument()
    expect(screen.queryByText(page.weeklyReportStillInApp)).not.toBeInTheDocument()
    expect(document.body).not.toHaveTextContent(kind)
  })

  it.each<[string, string, boolean]>([
    ['an altered token', `?token=${encodeURIComponent(`${TOKEN}x`)}`, true],
    ['a token the backend no longer accepts', `?token=${encodeURIComponent(TOKEN)}`, false],
    ['no token at all', '', true],
    ['an empty token', '?token=', true],
  ])('answers %s with the one sentence for every bad link', async (_, search, valid) => {
    const server = backend({ valid })
    renderPage(search)

    await waitFor(async () => expect(await heading()).toHaveTextContent(page.heading.invalid))
    expect(screen.getByText(page.invalid)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: page.undo })).not.toBeInTheDocument()
    if (!search.includes('token=') || search === '?token=') expect(server.calls).toEqual([])
  })

  it('a token too long for the backend (422) is the same bad link', async () => {
    mswServer.use(
      http.post(`${API}/email-unsubscribe`, () =>
        HttpResponse.json({ detail: [{ loc: ['query', 'token'], msg: 'too long', type: 'string_too_long' }] }, { status: 422 })),
    )
    renderPage(`?token=${'a'.repeat(3000)}`)

    await waitFor(async () => expect(await heading()).toHaveTextContent(page.heading.invalid))
  })

  it('does not call an unreachable backend a bad link, and retries', async () => {
    let fail = true
    mswServer.use(
      http.post(`${API}/email-unsubscribe`, () =>
        fail ? new HttpResponse(null, { status: 503 }) : HttpResponse.json({ kind: 'weekly_report', subscribed: false })),
    )
    renderPage(`?token=${encodeURIComponent(TOKEN)}`)

    await waitFor(async () => expect(await heading()).toHaveTextContent(page.heading.unreachable))
    expect(screen.queryByText(page.invalid)).not.toBeInTheDocument()

    fail = false
    await userEvent.click(screen.getByRole('button', { name: page.retry }))
    await waitFor(async () => expect(await heading()).toHaveTextContent(page.heading.unsubscribed))
  })

  it('keeps saying it is unsubscribed when the undo fails', async () => {
    mswServer.use(
      http.post(`${API}/email-unsubscribe`, () => HttpResponse.json({ kind: 'weekly_report', subscribed: false })),
      http.post(`${API}/email-resubscribe`, () => new HttpResponse(null, { status: 500 })),
    )
    renderPage(`?token=${encodeURIComponent(TOKEN)}`)

    await userEvent.click(await screen.findByRole('button', { name: page.undo }))

    expect(await screen.findByRole('alert')).toHaveTextContent(page.changeFailed)
    expect(await heading()).toHaveTextContent(page.heading.unsubscribed)
  })
})

describe("the parent's weekly report email switch", () => {
  function preferences({ weeklyReportEmail = true as boolean | undefined, saveFails = false } = {}) {
    const patches: unknown[] = []
    let stored = weeklyReportEmail
    const body = () => ({
      userId: 'p-1',
      preferences: { weekly_reports: { in_app: true, realtime: true, email_digest: false, push: false } },
      dispatchEmail: true,
      ...(stored === undefined ? {} : { weeklyReportEmail: stored }),
      supportedCategories: ['weekly_reports'],
      supportedChannels: ['email_digest', 'in_app', 'push', 'realtime'],
      updatedAt: null,
    })
    mswServer.use(
      http.get(`${API}/preferences`, () => HttpResponse.json(body())),
      http.patch(`${API}/preferences`, async ({ request }) => {
        const sent = (await request.json()) as { weeklyReportEmail?: boolean }
        patches.push(sent)
        if (saveFails) return new HttpResponse(null, { status: 500 })
        if (typeof sent.weeklyReportEmail === 'boolean') stored = sent.weeklyReportEmail
        return HttpResponse.json(body())
      }),
    )
    return patches
  }

  function renderCard() {
    render(
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={client()}>
          <ParentNotificationSettingsCard />
        </QueryClientProvider>
      </I18nextProvider>,
    )
  }

  const weeklySwitch = () => screen.findByRole('switch', { name: card.weeklyReportEmail.title })

  it('reads the stored value, and says the report stays in STOA', async () => {
    preferences({ weeklyReportEmail: false })
    renderCard()

    expect(await weeklySwitch()).not.toBeChecked()
    expect(screen.getByText(card.weeklyReportEmail.body)).toBeInTheDocument()
  })

  it('is on when the backend leaves the field out, its default', async () => {
    preferences({ weeklyReportEmail: undefined })
    renderCard()

    expect(await weeklySwitch()).toBeChecked()
  })

  it('writes the switch alone, and shows what was stored', async () => {
    const patches = preferences()
    renderCard()

    await userEvent.click(await weeklySwitch())
    await waitFor(() => expect(patches).toEqual([{ weeklyReportEmail: false }]))
    await waitFor(async () => expect(await weeklySwitch()).not.toBeChecked())

    await userEvent.click(await weeklySwitch())
    await waitFor(() => expect(patches).toEqual([{ weeklyReportEmail: false }, { weeklyReportEmail: true }]))
    await waitFor(async () => expect(await weeklySwitch()).toBeChecked())
  })

  it('says when the change was not saved', async () => {
    preferences({ saveFails: true })
    renderCard()

    await userEvent.click(await weeklySwitch())

    expect(await screen.findByRole('alert')).toHaveTextContent(card.saveFailed)
    expect(await weeklySwitch()).toBeChecked()
  })
})

describe('the copy', () => {
  const LOCALES = {
    de: { common: deCommon, parent: deParent },
    en: { common: enCommon, parent: enParent },
    fr: { common: frCommon, parent: frParent },
    it: { common: itCommon, parent: itParent },
  }

  // Read from the files, not through i18n, which would fall back to another
  // language for a missing key.
  it.each(Object.keys(LOCALES) as (keyof typeof LOCALES)[])('is complete in %s', (lng) => {
    const { common, parent } = LOCALES[lng]
    const texts = [
      common.routes.unsubscribe.title,
      ...Object.values(common.unsubscribe.heading),
      ...Object.values(common.unsubscribe.stopped),
      ...Object.values(common.unsubscribe.restored),
      common.unsubscribe.invalid,
      common.unsubscribe.weeklyReportStillInApp,
      common.unsubscribe.undo,
      parent.notifications.weeklyReportEmail.title,
      parent.notifications.weeklyReportEmail.body,
    ]
    for (const text of texts) expect(typeof text === 'string' && text.length > 0, lng).toBe(true)
  })

  it('addresses the adult reading the email with "Sie" in German', () => {
    const german = [
      ...Object.values(deCommon.unsubscribe.stopped),
      deCommon.unsubscribe.invalid,
      deCommon.unsubscribe.weeklyReportStillInApp,
      deParent.notifications.weeklyReportEmail.body,
    ].join(' ')
    expect(german).toMatch(/\bSie\b/)
    expect(german).not.toMatch(/\b(du|dir|dich|dein\w*)\b/i)
  })
})
