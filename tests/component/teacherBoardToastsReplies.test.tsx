/**
 * #271: the teacher board does not pass off a failed read as zeros and keeps
 * its figures current; the teacher flows speak the teacher's language (409 and
 * 422 apart); and a teacher's reply shows once on the request page.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, renderHook, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { toast } from 'sonner'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TeacherStatsCards } from '@/components/teacher/TeacherStatsCards'
import {
  useAcceptAiTeacherDraftMutation,
  useArchiveAiTeacherDraftMutation,
  useCreateAiTeacherExerciseDraftMutation,
  useCreateAiTeacherSummaryDraftMutation,
  useRegenerateAiTeacherDraftMutation,
  useRejectAiTeacherDraftMutation,
} from '@/hooks/teacher/useAiTeacherDraftMutations'
import { useTeacherStatsQuery } from '@/hooks/teacher/useTeacherStatsQuery'
import { useUpdateTeacherWeeklyAvailabilityMutation } from '@/hooks/teacher/useUpdateTeacherWeeklyAvailabilityMutation'
import i18n from '@/i18n'
import de from '@/i18n/locales/de/teacher.json'
import en from '@/i18n/locales/en/teacher.json'
import fr from '@/i18n/locales/fr/teacher.json'
import italian from '@/i18n/locales/it/teacher.json'
import { TeacherDashboardPage } from '@/pages/teacher/TeacherDashboardPage'
import { TeacherHelpRequestDetailPage } from '@/pages/teacher/TeacherHelpRequestDetailPage'
import { ApiError } from '@/services/api/httpClient'
import * as teacherApi from '@/services/teacher/teacherApi'
import * as availabilityApi from '@/services/teacher/teacherAvailabilityApi'
import { teacherQueryKeys } from '@/services/teacher/teacherQueryKeys'
import type { TeacherHelpStatus } from '@/types/teacherHelp'

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('@/services/teacher/teacherApi', async (orig) => ({
  ...(await orig<typeof import('@/services/teacher/teacherApi')>()),
  getTeacherStats: vi.fn(),
  getTeacherHelpRequests: vi.fn(),
  getTeacherHelpRequestDetail: vi.fn(),
  updateTeacherHelpRequestStatus: vi.fn(),
  addTeacherHelpRequestNote: vi.fn(),
  getTeacherAssistanceSummary: vi.fn(() => new Promise(() => {})),
  createAiTeacherSummaryDraft: vi.fn(),
  createAiTeacherExerciseDraft: vi.fn(),
  regenerateAiTeacherDraft: vi.fn(),
  acceptAiTeacherDraft: vi.fn(),
  rejectAiTeacherDraft: vi.fn(),
  archiveAiTeacherDraft: vi.fn(),
}))
vi.mock('@/services/teacher/teacherAvailabilityApi', () => ({
  getTeacherWeeklyAvailability: vi.fn(),
  updateTeacherWeeklyAvailability: vi.fn(),
}))
vi.mock('@/hooks/practice/useCurriculumCatalogQuery', () => ({
  useCurriculumCatalogQuery: () => ({ data: undefined, isLoading: false, isError: false }),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))

const REPLY_LABEL = 'Antwort der Lehrperson'
const SEND = 'Antwort senden'

function client() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
}

function wrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>{children}</MemoryRouter>
        </QueryClientProvider>
      </I18nextProvider>
    )
  }
}

function detail(status: TeacherHelpStatus, extra: Record<string, unknown> = {}) {
  return {
    requestId: 'r1', conversationId: 'c1', student: { id: 's1', name: 'Lea', grade: '8' },
    subject: 'mathematics', status, messages: [], notes: [], ...extra,
  } as never
}

function renderDetail() {
  const queryClient = client()
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/teacher/requests/r1']}>
          <Routes><Route path="/teacher/requests/:requestId" element={<TeacherHelpRequestDetailPage />} /></Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
  return { invalidatedKeys: () => invalidate.mock.calls.map(([filters]) => JSON.stringify(filters?.queryKey)) }
}

const STATS_KEY = JSON.stringify(teacherQueryKeys.stats())

beforeEach(async () => {
  vi.clearAllMocks()
  await i18n.changeLanguage('de')
})

afterEach(() => {
  vi.useRealTimers()
})

describe('stats board', () => {
  it('shows no zeros for figures it does not have', () => {
    render(<TeacherStatsCards stats={undefined} />, { wrapper: wrapper(client()) })
    expect(screen.queryByText('0')).toBeNull()
    expect(screen.getAllByText('—')).toHaveLength(3)
  })

  it('says the figures failed to load on the board, in German', async () => {
    vi.mocked(teacherApi.getTeacherStats).mockRejectedValue(new ApiError('boom', { status: 500 }))
    vi.mocked(teacherApi.getTeacherHelpRequests).mockResolvedValue({ items: [] })
    render(<TeacherDashboardPage />, { wrapper: wrapper(client()) })
    expect(await screen.findByText('Die Kennzahlen konnten nicht geladen werden.')).toBeInTheDocument()
    expect(screen.queryByText('0')).toBeNull()
  })

  it('reads the figures again on the same beat as the request list', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.mocked(teacherApi.getTeacherStats).mockResolvedValue({
      pendingRequests: 2, resolvedToday: 1, averageResponseTimeMinutes: 4,
    })
    renderHook(() => useTeacherStatsQuery(), { wrapper: wrapper(client()) })
    await waitFor(() => expect(teacherApi.getTeacherStats).toHaveBeenCalledTimes(1))
    await vi.advanceTimersByTimeAsync(15_000)
    await waitFor(() => expect(teacherApi.getTeacherStats).toHaveBeenCalledTimes(2))
  })

  it.each([
    ['taking a request', 'pending', 'Prüfung starten'],
    ['resolving a request', 'in_progress', 'Als gelöst markieren'],
  ] as const)('reads the figures again after %s', async (_label, status, button) => {
    vi.mocked(teacherApi.getTeacherHelpRequestDetail).mockResolvedValue(detail(status))
    vi.mocked(teacherApi.updateTeacherHelpRequestStatus).mockResolvedValue({ requestId: 'r1', status: 'resolved' } as never)
    const { invalidatedKeys } = renderDetail()
    if (status === 'in_progress') {
      await userEvent.type(await screen.findByLabelText('Abschlussnotiz'), 'Erledigt')
    }
    await userEvent.click(await screen.findByRole('button', { name: button }))
    await waitFor(() => expect(invalidatedKeys()).toContain(STATS_KEY))
    expect(toast.success).toHaveBeenCalledWith('Status der Anfrage aktualisiert.')
  })

  it('reads the figures again after a reply', async () => {
    vi.mocked(teacherApi.getTeacherHelpRequestDetail).mockResolvedValue(detail('pending'))
    vi.mocked(teacherApi.addTeacherHelpRequestNote).mockResolvedValue({ id: 'n1' } as never)
    const { invalidatedKeys } = renderDetail()
    await userEvent.type(await screen.findByLabelText(REPLY_LABEL), 'Hallo Lea')
    await userEvent.click(screen.getByRole('button', { name: SEND }))
    await waitFor(() => expect(invalidatedKeys()).toContain(STATS_KEY))
    expect(toast.success).toHaveBeenCalledWith('Ihre Antwort wurde gesendet.')
  })
})

describe('reply failures', () => {
  it.each([
    [new ApiError('changed', { status: 409, code: 'help_request_changed' }), 'Ihre Antwort wurde nicht gesendet: Die Anfrage hat inzwischen eine andere Lehrperson übernommen, oder sie hat sich geändert.'],
    [new ApiError('refused', { status: 422 }), 'Ihre Antwort wurde nicht angenommen. Bitte prüfen Sie Inhalt und Format und senden Sie sie erneut.'],
    [new ApiError('boom', { status: 500 }), 'Ihre Antwort konnte nicht gesendet werden. Bitte versuchen Sie es erneut.'],
  ])('says what went wrong in German and keeps the draft (%s)', async (error, message) => {
    vi.mocked(teacherApi.getTeacherHelpRequestDetail).mockResolvedValue(detail('in_progress'))
    vi.mocked(teacherApi.addTeacherHelpRequestNote).mockRejectedValue(error)
    renderDetail()
    await userEvent.type(await screen.findByLabelText(REPLY_LABEL), 'Hallo Lea')
    await userEvent.click(screen.getByRole('button', { name: SEND }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(message))
    expect(screen.getByLabelText(REPLY_LABEL)).toHaveValue('Hallo Lea')
  })
})

describe('other teacher toasts', () => {
  it('confirms saved availability in German', async () => {
    vi.mocked(availabilityApi.updateTeacherWeeklyAvailability).mockResolvedValue({ subjects: [], weeklyAvailability: [] })
    const { result } = renderHook(() => useUpdateTeacherWeeklyAvailabilityMutation(), { wrapper: wrapper(client()) })
    result.current.mutate({ subjects: [], weeklyAvailability: [] })
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Ihre Verfügbarkeit wurde gespeichert.'))
  })

  const draft = { draftId: 'd1', questionId: 'q1', studentId: 's1', previousDraftId: 'd0', status: 'accepted' }

  it.each([
    [useCreateAiTeacherSummaryDraftMutation, teacherApi.createAiTeacherSummaryDraft, 'Zusammenfassungsentwurf erstellt.', 'Der Zusammenfassungsentwurf konnte nicht erstellt werden.'],
    [useCreateAiTeacherExerciseDraftMutation, teacherApi.createAiTeacherExerciseDraft, 'Übungsentwurf erstellt.', 'Der Übungsentwurf konnte nicht erstellt werden.'],
    [useRegenerateAiTeacherDraftMutation, teacherApi.regenerateAiTeacherDraft, 'Entwurf neu erstellt.', 'Der Entwurf konnte nicht neu erstellt werden.'],
    [useAcceptAiTeacherDraftMutation, teacherApi.acceptAiTeacherDraft, 'Entwurf angenommen.', 'Der Entwurf konnte nicht angenommen werden.'],
    [useRejectAiTeacherDraftMutation, teacherApi.rejectAiTeacherDraft, 'Entwurf abgelehnt.', 'Der Entwurf konnte nicht abgelehnt werden.'],
    [useArchiveAiTeacherDraftMutation, teacherApi.archiveAiTeacherDraft, 'Entwurf archiviert.', 'Der Entwurf konnte nicht archiviert werden.'],
  ] as const)('AI draft toast %#: success and failure in German', async (useHook, api, success, failure) => {
    vi.mocked(api).mockResolvedValueOnce(draft as never).mockRejectedValueOnce(new ApiError('boom', { status: 500 }))
    const { result } = renderHook(() => useHook(), { wrapper: wrapper(client()) })
    const mutate = result.current.mutate as (variables: unknown) => void
    mutate({})
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith(success))
    mutate({})
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(failure))
  })

  it('has every toast in all four languages, German in Sie', () => {
    const flatten = (value: unknown, prefix = ''): Record<string, string> =>
      Object.entries(value as Record<string, unknown>).reduce<Record<string, string>>((all, [key, entry]) => (
        typeof entry === 'string' ? { ...all, [prefix + key]: entry } : { ...all, ...flatten(entry, `${prefix}${key}.`) }
      ), {})
    const keys = Object.keys(flatten(en.toasts)).sort()
    for (const bundle of [de, fr, italian]) {
      expect(Object.keys(flatten(bundle.toasts)).sort()).toEqual(keys)
    }
    for (const text of Object.values(flatten(de.toasts))) {
      expect(text).not.toMatch(/\b(du|dein|deine|dich|dir)\b/i)
    }
  })
})

describe('the teacher reply on the request page', () => {
  const reply = 'Schau dir **Schritt 2** noch einmal an.'
  const at = '2026-10-18T09:00:00Z'

  it('shows the reply once, and offers no report button on it', async () => {
    vi.mocked(teacherApi.getTeacherHelpRequestDetail).mockResolvedValue(detail('in_progress', {
      messages: [
        { id: 'm1', conversationId: 'c1', role: 'student', content: 'Wie geht das?', createdAt: '2026-10-18T08:59:00Z' },
        { id: 'm2', conversationId: 'c1', role: 'teacher', content: reply, createdAt: at },
      ],
      notes: [{ id: 'n1', note: reply, createdAt: at, teacher: { id: 't1', name: 'Frau Muster' }, richContent: null }],
    }))
    renderDetail()
    expect(await screen.findByText('Wie geht das?')).toBeInTheDocument()
    expect(screen.getAllByText(reply)).toHaveLength(1)
    // The student's message keeps its own report button; nothing else has one.
    const studentCard = screen.getByText('Wie geht das?').parentElement as HTMLElement
    expect(within(studentCard).getByRole('button', { name: 'Beitrag der lernenden Person melden' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Inhalt melden' })).toBeNull()
  })
})
