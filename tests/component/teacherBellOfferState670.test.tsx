/**
 * #670 (stoa-backend#391): a help-request offer in the teacher's bell that has
 * closed - it lapsed, went to another teacher, or the student withdrew it -
 * says so, and no longer opens the request, which answered 404 onto an empty
 * page. The backend writes `metadata.offer_state` when it closes the offer.
 *
 * And the request page itself, reached from a notification sent before that
 * (no `offer_state`) or a saved link: a refused read with nothing on screen
 * says the request is no longer open to this teacher, with the way back.
 * With a copy on screen, #269 stands: the copy stays and offers nothing.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import { helpOfferState, notificationTargetPath } from '@/components/notifications/notificationTargets'
import i18n from '@/i18n'
import deCommon from '@/i18n/locales/de/common.json'
import enCommon from '@/i18n/locales/en/common.json'
import frCommon from '@/i18n/locales/fr/common.json'
import itCommon from '@/i18n/locales/it/common.json'
import deTeacher from '@/i18n/locales/de/teacher.json'
import enTeacher from '@/i18n/locales/en/teacher.json'
import frTeacher from '@/i18n/locales/fr/teacher.json'
import itTeacher from '@/i18n/locales/it/teacher.json'
import { TeacherHelpRequestDetailPage } from '@/pages/teacher/TeacherHelpRequestDetailPage'
import { ApiError } from '@/services/api/httpClient'
import * as teacherApi from '@/services/teacher/teacherApi'
import { teacherQueryKeys } from '@/services/teacher/teacherQueryKeys'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { NotificationEvent } from '@/types/notification'

const { items, markRead } = vi.hoisted(() => ({
  items: { current: [] as unknown[] },
  markRead: vi.fn(),
}))
vi.mock('@/hooks/notifications/useNotificationsQuery', () => ({
  useNotificationsQuery: () => ({ data: { items: items.current }, isLoading: false, isError: false }),
  useUnreadNotificationCountQuery: () => ({ data: 0 }),
  useMarkNotificationReadMutation: () => ({ mutate: markRead, isPending: false }),
  useArchiveNotificationMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/hooks/notifications/useRealtimeNotifications', () => ({
  useRealtimeNotifications: () => ({ status: 'disabled', isLive: false }),
}))
vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('@/services/teacher/teacherApi', async (orig) => ({
  ...(await orig<typeof import('@/services/teacher/teacherApi')>()),
  getTeacherHelpRequestDetail: vi.fn(),
  getTeacherAssistanceSummary: vi.fn(() => new Promise(() => {})),
}))
vi.mock('@/hooks/practice/useCurriculumCatalogQuery', () => ({
  useCurriculumCatalogQuery: () => ({ data: undefined, isLoading: false, isError: false }),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))

const mockedDetail = vi.mocked(teacherApi.getTeacherHelpRequestDetail)
const TAGS = deCommon.notifications.offerState
const GONE = deTeacher.detail.outOfReach
const REPLY = 'Antwort der Lehrperson'

function offer(eventId: string, metadata: Record<string, unknown>, title = `Hilfeanfrage ${eventId}`): NotificationEvent {
  return {
    eventId,
    recipientRole: 'teacher',
    eventType: 'teacher_help_dispatched',
    targetType: 'question',
    targetId: `req-${eventId}`,
    title,
    summary: 'Fach: Mathematik. Bitte nehmen Sie die Anfrage innerhalb von 10 Minuten an.',
    status: 'read',
    createdAt: '2026-11-13T08:00:00Z',
    metadata: { request_id: `req-${eventId}`, dispatch_id: `d-${eventId}`, deadline_at: '2026-11-13T08:10:00Z', ...metadata },
  }
}

let pathname = ''
function LocationProbe() {
  pathname = useLocation().pathname
  return null
}

async function openBell(events: NotificationEvent[]) {
  items.current = events
  useAuthStore.setState({
    user: { id: 't-1', name: 'Tom Brunner', email: 'tom@example.com', role: 'teacher' } as CurrentUser,
    accessToken: 'token',
    isAuthenticated: true,
  })
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/somewhere']}>
          <NotificationCenter />
          <LocationProbe />
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
  await userEvent.click(screen.getByRole('button', { name: new RegExp(`^${deCommon.notifications.openLabel}`) }))
}

function row(eventId: string) {
  return document.querySelector(`[data-notification="${eventId}"]`) as HTMLElement
}

beforeEach(async () => {
  vi.clearAllMocks()
  mockedDetail.mockReset()
  sessionStorage.clear()
  pathname = ''
  await i18n.changeLanguage('de')
})
afterEach(() => useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false }))

describe('a closed offer in the bell', () => {
  it.each([
    ['expired', TAGS.expired],
    ['reassigned', TAGS.reassigned],
    ['withdrawn', TAGS.withdrawn],
  ])('%s: shows its state and opens nothing, only being marked read', async (state, tag) => {
    await openBell([{ ...offer('e1', { offer_state: state, offer_closed_at: '2026-11-13T08:10:00Z' }), status: 'created' }])

    const item = within(row('e1')).getByRole('button', { name: /^Hilfeanfrage e1/ })
    expect(within(item).getByText(tag)).toBeInTheDocument()
    expect(item).not.toHaveAttribute('data-notification-target')

    await userEvent.click(item)
    expect(markRead).toHaveBeenCalledWith('e1')
    expect(pathname).toBe('/somewhere')
    expect(item).toBeInTheDocument()
  })

  it('in a state this app does not know: no tag, and still opens nothing', async () => {
    await openBell([offer('e2', { offer_state: 'archived_by_school' })])

    const item = within(row('e2')).getByRole('button', { name: /^Hilfeanfrage e2/ })
    expect(item.querySelector('[data-offer-state]')).toBeNull()
    expect(item).not.toHaveAttribute('data-notification-target')
    await userEvent.click(item)
    expect(pathname).toBe('/somewhere')
  })
})

describe('an open offer in the bell', () => {
  it('without offer_state opens the request, as before', async () => {
    await openBell([offer('e3', {})])

    const item = within(row('e3')).getByRole('button', { name: /^Hilfeanfrage e3/ })
    expect(item.querySelector('[data-offer-state]')).toBeNull()
    await userEvent.click(item)
    expect(pathname).toBe('/teacher/requests/req-e3')
  })

  it('a standing offer (offered again because nobody else is free) opens the request too', async () => {
    await openBell([offer('e4', { standing: true })])

    const item = within(row('e4')).getByRole('button', { name: /^Hilfeanfrage e4/ })
    expect(item.querySelector('[data-offer-state]')).toBeNull()
    await userEvent.click(item)
    expect(pathname).toBe('/teacher/requests/req-e4')
  })

  it('beside closed ones, each item keeps its own way', async () => {
    await openBell([offer('e5', {}), offer('e6', { offer_state: 'reassigned' })])
    expect(within(row('e5')).getByRole('button', { name: /^Hilfeanfrage e5/ })).toHaveAttribute(
      'data-notification-target',
      '/teacher/requests/req-e5',
    )
    expect(within(row('e6')).getByRole('button', { name: /^Hilfeanfrage e6/ })).not.toHaveAttribute(
      'data-notification-target',
    )
  })
})

describe('the offer state read from an untrusted payload', () => {
  const base = { eventType: 'teacher_help_dispatched', targetType: 'question', targetId: 'r1' } as const

  it.each([
    ['no metadata', undefined],
    ['null metadata', null],
    ['a string for metadata', 'expired'],
    ['an empty offer_state', { offer_state: '' }],
    ['a null offer_state', { offer_state: null }],
  ])('%s is an open offer', (_label, metadata) => {
    const event = { ...base, metadata } as never
    expect(helpOfferState(event)).toBeNull()
    expect(notificationTargetPath(event, 'teacher')).toBe('/teacher/requests/r1')
  })

  it.each([
    ['a number', { offer_state: 3 }],
    ['an object', { offer_state: { state: 'expired' } }],
    ['a prototype key', { offer_state: 'constructor' }],
  ])('an offer_state that is %s is closed, with no name', (_label, metadata) => {
    const event = { ...base, metadata } as never
    expect(helpOfferState(event)).toBe('unknown')
    expect(notificationTargetPath(event, 'teacher')).toBeNull()
  })

  it('only concerns the offer: another event with an offer_state is untouched', () => {
    const event = { eventType: 'teacher_requested', targetType: 'question', targetId: 'q1', metadata: { offer_state: 'expired' } }
    expect(helpOfferState(event as never)).toBeNull()
    expect(notificationTargetPath(event as never, 'teacher')).toBe('/teacher')
  })
})

describe('the request page, refused', () => {
  function detail() {
    return {
      requestId: 'r1', conversationId: 'c1', student: { id: 's1', name: 'Lea', grade: '8' },
      subject: 'mathematics', status: 'pending', messages: [], notes: [],
    } as never
  }

  function renderPage() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={client}>
          <MemoryRouter initialEntries={['/teacher/requests/r1']}>
            <Routes>
              <Route path="/teacher/requests/:requestId" element={<TeacherHelpRequestDetailPage />} />
              <Route path="/teacher" element={<p>queue</p>} />
            </Routes>
            <LocationProbe />
          </MemoryRouter>
        </QueryClientProvider>
      </I18nextProvider>,
    )
    return {
      poll: () => act(async () => {
        await client.refetchQueries({ queryKey: teacherQueryKeys.helpRequestDetail('r1') })
      }),
    }
  }

  it.each([404, 403])('with nothing on screen (%i): says it is no longer open to this teacher, with the way back', async (status) => {
    mockedDetail.mockRejectedValue(new ApiError('refused', { status }))
    renderPage()

    const state = await screen.findByRole('status', { name: GONE.title })
    expect(within(state).getByText(GONE.body)).toBeInTheDocument()
    expect(screen.queryByText(deTeacher.detail.loadFailed)).toBeNull()

    await userEvent.click(within(state).getByRole('link', { name: GONE.back }))
    expect(pathname).toBe('/teacher')
  })

  it('with nothing on screen and any other failure, still says the read failed', async () => {
    mockedDetail.mockRejectedValue(new ApiError('boom', { status: 500 }))
    renderPage()

    // After the hook's one retry.
    expect(await screen.findByText(deTeacher.detail.loadFailed, {}, { timeout: 4000 })).toBeInTheDocument()
    expect(screen.queryByText(GONE.title)).toBeNull()
  })

  it('with a copy on screen, keeps #269: the copy stays and offers nothing', async () => {
    mockedDetail.mockResolvedValueOnce(detail())
    const { poll } = renderPage()
    expect(await screen.findByLabelText(REPLY)).toBeInTheDocument()

    mockedDetail.mockRejectedValue(new ApiError('gone', { status: 404 }))
    await poll()

    await waitFor(() => expect(screen.queryByLabelText(REPLY)).toBeNull())
    expect(screen.getByText(deTeacher.detail.loadFailed)).toBeInTheDocument()
    expect(screen.getAllByText(/Lea/).length).toBeGreaterThan(0)
    expect(screen.queryByText(GONE.title)).toBeNull()
  })
})

describe('the new copy', () => {
  const common = { de: deCommon, en: enCommon, fr: frCommon, it: itCommon }
  const teacher = { de: deTeacher, en: enTeacher, fr: frTeacher, it: itTeacher }

  it('is in all four languages', () => {
    for (const [language, bundle] of Object.entries(common)) {
      for (const state of ['expired', 'reassigned', 'withdrawn'] as const) {
        expect(bundle.notifications.offerState[state], `${language} ${state}`).toBeTruthy()
      }
    }
    for (const [language, bundle] of Object.entries(teacher)) {
      for (const key of ['title', 'body', 'back'] as const) {
        expect(bundle.detail.outOfReach[key], `${language} ${key}`).toBeTruthy()
      }
    }
  })

  it('addresses teachers as Sie and vous, Italian informal, with no ß', () => {
    expect(deTeacher.detail.outOfReach.title).toMatch(/\bSie\b/)
    for (const text of [...Object.values(deTeacher.detail.outOfReach), ...Object.values(TAGS)]) {
      expect(text).not.toMatch(/\b(du|dich|dir|dein)\b/i)
      expect(text).not.toContain('ß')
    }
    expect(frTeacher.detail.outOfReach.title).toMatch(/\bvous\b/)
    expect(itTeacher.detail.outOfReach.title).toMatch(/\bte\b/)
  })
})
