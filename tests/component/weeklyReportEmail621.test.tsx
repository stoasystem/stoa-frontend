/**
 * #621 (stoa-backend#363): a parent can stop the weekly report email on their
 * account page, /parent/account-operations. It is `weeklyReportEmail` in
 * `GET/PATCH /notifications/preferences`, on by default. Off stops only the
 * email: the report is still made and still in the app, and the switch says so.
 *
 * Through the real API layer against a mocked backend, so what is checked is
 * what reaches `PATCH /notifications/preferences`.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { Suspense } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { AppRoutes } from '@/app/router/AppRoutes'
import { ParentNotificationSettingsCard } from '@/components/parent/ParentNotificationSettingsCard'
import i18n from '@/i18n'
import deParent from '@/i18n/locales/de/parent.json'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import { mswServer } from '../mswServer'

const API = 'https://api.test'
const de = deParent.notificationSettings
const LANGUAGES = ['de', 'en', 'fr', 'it'] as const

const MATRIX = { weekly_reports: { in_app: true, realtime: true, email_digest: false, push: false } }

function backend({ weeklyReportEmail = true, saveFails = false } = {}) {
  const patches: unknown[] = []
  let stored = weeklyReportEmail
  const body = () => ({
    userId: 'p-1',
    preferences: MATRIX,
    dispatchEmail: true,
    weeklyReportEmail: stored,
    supportedCategories: Object.keys(MATRIX),
    supportedChannels: ['email_digest', 'in_app', 'push', 'realtime'],
    updatedAt: null,
  })
  mswServer.use(
    http.get(`${API}/notifications/preferences`, () => HttpResponse.json(body())),
    http.patch(`${API}/notifications/preferences`, async ({ request }) => {
      const sent = (await request.json()) as { weeklyReportEmail?: boolean }
      patches.push(sent)
      if (saveFails) return new HttpResponse(null, { status: 500 })
      if (typeof sent.weeklyReportEmail === 'boolean') stored = sent.weeklyReportEmail
      return HttpResponse.json(body())
    }),
  )
  return patches
}

function client() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
}

function renderCard(queryClient = client()) {
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <ParentNotificationSettingsCard />
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

const weeklySwitch = () => screen.findByRole('switch', { name: de.weeklyReportEmail.title }, { timeout: 5_000 })

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }))
beforeEach(async () => {
  await i18n.changeLanguage('de')
})
afterEach(() => {
  mswServer.resetHandlers()
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})
afterAll(() => mswServer.close())

describe('the weekly report email switch', () => {
  it('is on /parent/account-operations, even when the account page itself does not load', async () => {
    backend()
    mswServer.use(
      http.get(`${API}/parents/me/account-operations`, () => new HttpResponse(null, { status: 500 })),
      http.get(`${API}/parents/me/usage-period`, () => HttpResponse.json({ items: [] })),
      http.get(`${API}/parents/me/children`, () => HttpResponse.json({ items: [] })),
      http.get(`${API}/notifications`, () => HttpResponse.json({ items: [], count: 0 })),
    )
    useAuthStore.setState({
      user: { id: 'p-1', name: 'Pia Muster', email: 'pia@example.com', role: 'parent' } as CurrentUser,
      accessToken: 'token',
      isAuthenticated: true,
    })
    render(
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={client()}>
          <MemoryRouter initialEntries={['/parent/account-operations']}>
            <Suspense fallback={null}>
              <AppRoutes />
            </Suspense>
          </MemoryRouter>
        </QueryClientProvider>
      </I18nextProvider>,
    )

    expect(await weeklySwitch()).toBeChecked()
  })

  it('reads the stored value: off when the parent turned it off', async () => {
    backend({ weeklyReportEmail: false })
    renderCard()

    expect(await weeklySwitch()).not.toBeChecked()
  })

  it('says the report stays in the app', async () => {
    backend()
    renderCard()

    await weeklySwitch()
    expect(screen.getByText(de.weeklyReportEmail.body)).toBeInTheDocument()
    expect(screen.getAllByRole('switch')).toHaveLength(1)
  })

  it('turns the email off with the switch alone, leaving the rest to the backend', async () => {
    const patches = backend()
    renderCard()

    await userEvent.click(await weeklySwitch())

    await waitFor(() => expect(patches).toEqual([{ weeklyReportEmail: false }]))
    await waitFor(async () => expect(await weeklySwitch()).not.toBeChecked())
  })

  // A reload: a fresh cache reads what the backend kept.
  it('reads off after a reload, once saved', async () => {
    backend()
    const first = renderCard()
    await userEvent.click(await weeklySwitch())
    await waitFor(async () => expect(await weeklySwitch()).not.toBeChecked())
    first.unmount()

    renderCard(client())
    expect(await weeklySwitch()).not.toBeChecked()
  })

  it('turns it back on', async () => {
    const patches = backend({ weeklyReportEmail: false })
    renderCard()

    await userEvent.click(await weeklySwitch())

    await waitFor(() => expect(patches).toEqual([{ weeklyReportEmail: true }]))
    await waitFor(async () => expect(await weeklySwitch()).toBeChecked())
  })

  it('says when the change was not saved, and keeps showing what is stored', async () => {
    backend({ saveFails: true })
    renderCard()

    await userEvent.click(await weeklySwitch())

    expect(await screen.findByRole('alert')).toHaveTextContent(de.saveFailed)
    expect(await weeklySwitch()).toBeChecked()
  })

  it.each(LANGUAGES)('has its copy in %s', async (lng) => {
    const parent = (await import(`@/i18n/locales/${lng}/parent.json`)).default
    const copy = parent.notificationSettings
    for (const text of [
      copy.title,
      copy.weeklyReportEmail.title,
      copy.weeklyReportEmail.body,
      copy.loading,
      copy.unavailable,
      copy.saveFailed,
    ]) {
      expect(typeof text === 'string' && text.length > 0, `${lng}`).toBe(true)
    }
  })

  it('addresses the parent with "Sie" in German, without ß', () => {
    const german = [de.weeklyReportEmail.body, de.saveFailed].join(' ')
    expect(german).toMatch(/\bIhnen\b|\bSie\b|\bIhr\w*\b/)
    expect(german).not.toMatch(/\b(du|dir|dich|dein\w*)\b/i)
    expect(JSON.stringify(de)).not.toContain('ß')
  })
})
