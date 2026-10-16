/**
 * What the #162 production walkthrough found on the teacher and admin screens
 * (app.stoaedu.ch, release f720d980, 2026-10-16), rendered in German:
 *
 * - a finished help request still offered "Prüfung starten", which the server
 *   refuses for a resolved request;
 * - the request list put "Überfällig" on a finished request, and on a phone
 *   that second pill cut the student's name down to "Te…";
 * - the notification panel told a teacher about "deinen Fragen, Übungen";
 * - the system page's operational notifications were English throughout;
 * - the accounts table printed raw ISO timestamps.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import type { TeacherHelpRequestSummary } from '@/types/teacher'
import { acceptsTeacherReply, isOpenHelpRequest, type TeacherHelpStatus } from '@/types/teacherHelp'

const detail = vi.hoisted(() => ({ status: 'resolved' as string }))
const adminEvents = vi.hoisted(() => ({ items: [] as unknown[] }))

vi.mock('@/layouts/DashboardLayout', () => ({ DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</> }))
vi.mock('@/components/teacher/AiTeacherToolsPanel', () => ({ AiTeacherToolsPanel: () => null }))
vi.mock('@/components/practice/CurriculumRolloutPanel', () => ({ CurriculumRolloutPanel: () => null }))
vi.mock('@/components/teacher/TeacherAssistanceSummaryCard', () => ({ TeacherAssistanceSummaryCard: () => null }))
vi.mock('@/components/teacher/HelpRequestDetailCard', () => ({ HelpRequestDetailCard: () => null }))
vi.mock('@/hooks/practice/useCurriculumCatalogQuery', () => ({ useCurriculumCatalogQuery: () => ({}) }))
vi.mock('@/hooks/teacher/useTeacherAssistanceSummaryQuery', () => ({ useTeacherAssistanceSummaryQuery: () => ({}) }))
vi.mock('@/hooks/teacher/useTeacherHelpRequestDetailQuery', () => ({
  useTeacherHelpRequestDetailQuery: () => ({
    data: {
      requestId: 'r-1',
      conversationId: 'c-1',
      status: detail.status,
      subject: 'math',
      grade: 'Sek1',
      createdAt: '2026-09-24T02:12:00Z',
      student: { id: 's-1', name: 'Test Student' },
      notes: [],
    },
  }),
}))
vi.mock('@/hooks/notifications/useNotificationsQuery', () => ({
  useAdminNotificationsQuery: () => ({ data: adminEvents, isLoading: false, isError: false }),
  useNotificationsQuery: () => ({ data: { items: [] }, isLoading: false, isError: false }),
  useMarkNotificationReadMutation: () => ({ mutate: vi.fn() }),
  useArchiveNotificationMutation: () => ({ mutate: vi.fn() }),
}))
vi.mock('@/hooks/notifications/useRealtimeNotifications', () => ({
  useRealtimeNotifications: () => ({ status: 'live', isLive: true }),
}))

const { HelpRequestList } = await import('@/components/teacher/HelpRequestList')
const { TeacherHelpRequestDetailPage } = await import('@/pages/teacher/TeacherHelpRequestDetailPage')
const { NotificationCenter } = await import('@/components/notifications/NotificationCenter')
const { AdminOperationalNotificationsCard } = await import('@/components/admin/AdminOperationalNotificationsCard')
const { useAuthStore } = await import('@/store/authStore')

function wrap(children: ReactNode, path = '/') {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>
  )
}

beforeEach(async () => {
  await i18n.changeLanguage('de')
  detail.status = 'resolved'
  adminEvents.items = []
})

const request = (status: TeacherHelpRequestSummary['status']): TeacherHelpRequestSummary =>
  ({
    requestId: `r-${status}`,
    conversationId: 'c-1',
    studentName: 'Test Student',
    subject: 'math',
    grade: 'Sek1',
    status,
    requestMessage: 'Bitte hilf mir beim Dividieren.',
    createdAt: '2026-09-24T02:12:00Z',
    sla: { status: 'breached' },
  }) as TeacherHelpRequestSummary

describe('the teacher request list', () => {
  it('marks a missed target only on a request that is still open', () => {
    render(wrap(<HelpRequestList requests={[request('resolved'), request('pending')]} />))
    expect(screen.getAllByText('Überfällig')).toHaveLength(1)
    expect(screen.getByText('Abgeschlossen')).toBeInTheDocument()
  })
})

describe('a help request in the teacher view', () => {
  const page = () =>
    render(wrap(
      <Routes><Route path="/teacher/requests/:requestId" element={<TeacherHelpRequestDetailPage />} /></Routes>,
      '/teacher/requests/r-1',
    ))

  it('offers no status change once it is finished', () => {
    page()
    expect(screen.queryByRole('button', { name: 'Prüfung starten' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Als gelöst markieren' })).toBeNull()
    expect(screen.queryByLabelText('Abschlussnotiz')).toBeNull()
  })

  it('still offers them while it is open', () => {
    detail.status = 'in_progress'
    page()
    expect(screen.getByRole('button', { name: 'Prüfung starten' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Als gelöst markieren' })).toBeInTheDocument()
  })

  // The server takes the holder's reply on a resolved request and refuses one
  // on a request that ended without a teacher (#222, user decision 2026-10-16).
  it.each(['pending', 'assigned', 'in_progress', 'resolved'])('offers the reply box when it is %s', (status) => {
    detail.status = status
    page()
    expect(screen.getAllByText('Antwort der Lehrperson').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Antwort senden' })).toBeInTheDocument()
  })

  it.each(['withdrawn', 'expired'])('offers no reply box once it is %s', (status) => {
    detail.status = status
    page()
    expect(screen.queryAllByText('Antwort der Lehrperson')).toHaveLength(0)
    expect(screen.queryByRole('button', { name: 'Antwort senden' })).toBeNull()
  })
})

describe('which help requests take a teacher reply (#222)', () => {
  it('is every open one and a resolved one, not one that ended without a teacher', () => {
    const statuses: TeacherHelpStatus[] = ['pending', 'assigned', 'in_progress', 'resolved', 'cancelled', 'withdrawn', 'expired']
    expect(statuses.filter(acceptsTeacherReply)).toEqual(['pending', 'assigned', 'in_progress', 'resolved'])
    // Not the open check: that one leaves resolved out, and the reply box with it.
    expect(statuses.filter(isOpenHelpRequest)).not.toContain('resolved')
    expect(acceptsTeacherReply(undefined)).toBe(false)
  })
})

describe('the notification panel', () => {
  for (const [role, line] of [
    ['student', 'Neues zu deinen Fragen, Übungen und Anfragen an Lehrpersonen.'],
    ['teacher', 'Neues zu den Anfragen von Schülerinnen und Schülern.'],
    ['parent', 'Neues zu Ihrem Konto und zum Lernen Ihrer Kinder.'],
    ['admin', 'Betriebsmeldungen und Neues zu Ihrem Konto.'],
  ] as const) {
    it(`describes what arrives for a ${role}`, async () => {
      useAuthStore.setState({ user: { id: 'u', email: 'u@test.stoaedu.ch', name: 'U', role } as never })
      render(wrap(<NotificationCenter />))
      await userEvent.click(screen.getByRole('button', { name: 'Mitteilungen' }))
      expect(screen.getByText(line)).toBeInTheDocument()
    })
  }
})

describe("the system page's operational notifications", () => {
  it('reads in German, the known events included', () => {
    adminEvents.items = [
      {
        eventId: 'e-1',
        eventType: 'teacher_help_expired',
        targetType: 'conversation',
        status: 'created',
        title: 'No teacher was available',
        summary: "Your request for a teacher expired. This week's teacher help was given back.",
        createdAt: '2026-10-11T08:00:00Z',
      },
    ]
    render(wrap(<AdminOperationalNotificationsCard />))
    expect(screen.getByText('Betriebsmeldungen')).toBeInTheDocument()
    expect(screen.getByText('1 Ereignis')).toBeInTheDocument()
    expect(screen.getByText('Keine Lehrperson verfügbar')).toBeInTheDocument()
    expect(screen.getByText('Neu')).toBeInTheDocument()
    expect(screen.getByText('Lehrpersonenhilfe abgelaufen · Gespräch')).toBeInTheDocument()
    expect(screen.queryByText(/No teacher|created|events/)).toBeNull()
  })

  it('says there are none in German', () => {
    render(wrap(<AdminOperationalNotificationsCard />))
    expect(screen.getByText('0 Ereignisse')).toBeInTheDocument()
    expect(screen.getByText('Noch keine Betriebsmeldungen.')).toBeInTheDocument()
  })
})

describe('the new keys exist in all four languages', () => {
  it.each(['de', 'en', 'fr', 'it'])('%s', async (lang) => {
    const common = (await import(`@/i18n/locales/${lang}/common.json`)).default
    const admin = (await import(`@/i18n/locales/${lang}/admin.json`)).default
    expect(Object.keys(common.notifications.subtitleByRole).sort()).toEqual(
      ['admin', 'organization_admin', 'parent', 'school_teacher', 'school_viewer', 'teacher'],
    )
    expect(Object.keys(admin.operationalNotifications).sort()).toEqual([
      'count_one',
      'count_other',
      'empty',
      'eventTypes',
      'loading',
      'targetTypes',
      'title',
      'unavailable',
      'unknownEventType',
      'unknownStatus',
      'unknownTargetType',
    ])
  })
})
