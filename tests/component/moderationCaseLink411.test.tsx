/**
 * #411: a moderation notification names its case, and opening it showed the
 * queue with the first case selected. The link dropped the id, and the page
 * picked `cases[0]`; with more than 50 cases, the one the notification was
 * about could not be found at all.
 *
 * The link is now `/admin/moderation?case=<id>`, and the page opens the case
 * the address names, through its own detail request.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { moderationPathFor } from '@/app/router/routeManifest'
import { notificationTargetPath } from '@/components/notifications/notificationTargets'
import i18n from '@/i18n'
import deAdmin from '@/i18n/locales/de/admin.json'
import enAdmin from '@/i18n/locales/en/admin.json'
import enCommon from '@/i18n/locales/en/common.json'
import { AdminModerationPage } from '@/pages/admin/AdminModerationPage'
import { ApiError } from '@/services/api/httpClient'
import type { ModerationCase } from '@/services/admin/adminApi'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { NotificationEvent } from '@/types/notification'

const api = vi.hoisted(() => ({
  getModerationCases: vi.fn(),
  getModerationCase: vi.fn(),
  updateModerationCase: vi.fn(),
  addModerationCaseNote: vi.fn(),
}))
vi.mock('@/services/admin/adminApi', () => api)

const bell = vi.hoisted(() => ({ items: [] as unknown[] }))
vi.mock('@/hooks/notifications/useNotificationsQuery', () => ({
  useNotificationsQuery: () => ({ data: { items: bell.items }, isLoading: false, isError: false }),
  useUnreadNotificationCountQuery: () => ({ data: bell.items.length }),
  useMarkNotificationReadMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useArchiveNotificationMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/hooks/notifications/useRealtimeNotifications', () => ({
  useRealtimeNotifications: () => ({ status: 'disabled' }),
}))

function moderationCase(id: string): ModerationCase {
  return {
    case_id: id,
    status: 'open',
    reason: 'abuse',
    severity: 'high',
    surface: 'question',
    question_id: `q-${id}`,
    reporter_id: 'teacher-1',
    reporter_role: 'teacher',
    report_note: `report ${id}`,
    created_at: '2026-10-01T10:00:00Z',
    updated_at: '2026-10-01T10:00:00Z',
    history: [],
  }
}

// A full queue of 50, and the case the notification is about beyond it.
const QUEUE = Array.from({ length: 50 }, (_, index) => moderationCase(`case-${index}`))
const BEYOND = moderationCase('mod-77')

function notification(caseId: string): NotificationEvent {
  return {
    eventId: 'e-1',
    recipientRole: 'admin',
    eventType: 'moderation_case_update',
    targetType: 'moderation_case',
    targetId: caseId,
    title: 'Case reported',
    summary: 'A teacher reported an answer.',
    status: 'created',
    createdAt: '2026-10-20T10:00:00Z',
    metadata: {},
  }
}

function Where() {
  const { pathname, search } = useLocation()
  return <output data-where>{pathname + search}</output>
}
const where = () => document.querySelector('[data-where]')!.textContent

function renderAt(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/admin/moderation" element={<AdminModerationPage />} />
          </Routes>
          <Where />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

const caseButton = (id: string) => screen.getByRole('button', { name: new RegExp(`^${id}\\b`) })
const caseHeading = (id: string) => screen.findByText(`Case ${id}`)

beforeAll(async () => {
  await i18n.changeLanguage('en')
})
beforeEach(() => {
  vi.clearAllMocks()
  bell.items = []
  api.getModerationCases.mockResolvedValue({ items: QUEUE, count: QUEUE.length, access_pattern: 'scan' })
  api.getModerationCase.mockImplementation(async (id: string) => {
    const found = [...QUEUE, BEYOND].find((item) => item.case_id === id)
    if (!found) throw new ApiError('Not found', { status: 404 })
    return found
  })
  useAuthStore.setState({
    user: { id: 'admin-1', name: 'Ada Admin', email: 'ada@example.com', role: 'admin' } as CurrentUser,
    accessToken: 'token',
    isAuthenticated: true,
  })
})
afterEach(() => useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false }))
afterAll(async () => {
  await i18n.changeLanguage('en')
})

describe('the notification’s link names its case', () => {
  it('opens /admin/moderation?case=<id>', () => {
    expect(notificationTargetPath({ targetType: 'moderation_case', targetId: 'mod-77' }, 'admin')).toBe(
      '/admin/moderation?case=mod-77',
    )
    expect(moderationPathFor(' mod-77 ')).toBe('/admin/moderation?case=mod-77')
  })

  it.each(['', '  ', '..', 'a/b', '../users', 'mod-1&case=mod-2', 'mod-1#x', 'x'.repeat(200), 123, null, undefined])(
    'opens the queue alone for an id that is not one (%j)',
    (targetId) => {
      const event = { targetType: 'moderation_case', targetId } as unknown as NotificationEvent
      expect(notificationTargetPath(event, 'admin')).toBe('/admin/moderation')
    },
  )
})

describe('the moderation page opens the case the address names (#411)', () => {
  it('from the bell, a case beyond the 50 in the queue, while another is open', async () => {
    bell.items = [notification('mod-77')]
    renderAt('/admin/moderation')
    await caseHeading('case-0')

    fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${enCommon.notifications.openLabel}`) }))
    fireEvent.click(await screen.findByRole('button', { name: /^Case reported/ }))

    expect(where()).toBe('/admin/moderation?case=mod-77')
    expect(await caseHeading('mod-77')).toBeInTheDocument()
    expect(api.getModerationCase).toHaveBeenCalledWith('mod-77')
    expect(screen.queryByText('Case case-0')).toBeNull()
    expect(caseButton('case-0')).not.toHaveAttribute('aria-current')
  })

  it('opened straight at /admin/moderation?case=<id>', async () => {
    renderAt('/admin/moderation?case=case-7')

    expect(await caseHeading('case-7')).toBeInTheDocument()
    await waitFor(() => expect(caseButton('case-7')).toHaveAttribute('aria-current', 'true'))
    expect(caseButton('case-0')).not.toHaveAttribute('aria-current')
    expect(api.getModerationCase).not.toHaveBeenCalledWith('case-0')
  })

  it('writes the case the admin opens into the address, in place', async () => {
    renderAt('/admin/moderation?case=mod-77')
    await caseHeading('mod-77')

    fireEvent.click(caseButton('case-3'))

    expect(await caseHeading('case-3')).toBeInTheDocument()
    expect(where()).toBe('/admin/moderation?case=case-3')
  })

  it('still opens the first case when the address names none', async () => {
    renderAt('/admin/moderation')

    expect(await caseHeading('case-0')).toBeInTheDocument()
    expect(where()).toBe('/admin/moderation')
  })

  it('says the named case could not be loaded, not "select a case"', async () => {
    renderAt('/admin/moderation?case=mod-gone')

    expect(await screen.findByRole('alert')).toHaveTextContent(enAdmin.moderation.caseLoadFailed)
    expect(screen.queryByText(enAdmin.moderation.selectCase)).toBeNull()
  })

  it('says so in German too', async () => {
    await i18n.changeLanguage('de')
    renderAt('/admin/moderation?case=mod-gone')

    expect(await screen.findByRole('alert')).toHaveTextContent(deAdmin.moderation.caseLoadFailed)
    await i18n.changeLanguage('en')
  })
})
