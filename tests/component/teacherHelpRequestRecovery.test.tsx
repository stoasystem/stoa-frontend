/**
 * #269: a teacher's help request that moved on under them (taken by another
 * teacher, offer lapsed) is read again, says so in the teacher's language,
 * and offers only what the server still takes.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import de from '@/i18n/locales/de/teacher.json'
import en from '@/i18n/locales/en/teacher.json'
import fr from '@/i18n/locales/fr/teacher.json'
import italian from '@/i18n/locales/it/teacher.json'
import { TeacherHelpRequestDetailPage } from '@/pages/teacher/TeacherHelpRequestDetailPage'
import { ApiError } from '@/services/api/httpClient'
import * as teacherApi from '@/services/teacher/teacherApi'
import { teacherQueryKeys } from '@/services/teacher/teacherQueryKeys'
import { teacherStatusActions, type TeacherHelpStatus } from '@/types/teacherHelp'

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('@/services/teacher/teacherApi', async (orig) => ({
  ...(await orig<typeof import('@/services/teacher/teacherApi')>()),
  getTeacherHelpRequestDetail: vi.fn(),
  updateTeacherHelpRequestStatus: vi.fn(),
  addTeacherHelpRequestNote: vi.fn(),
  getTeacherAssistanceSummary: vi.fn(() => new Promise(() => {})),
}))
vi.mock('@/hooks/practice/useCurriculumCatalogQuery', () => ({
  useCurriculumCatalogQuery: () => ({ data: undefined, isLoading: false, isError: false }),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))

const CHANGED = 'Diese Anfrage hat inzwischen eine andere Lehrperson übernommen, oder sie hat sich geändert. Die Ansicht wurde neu geladen – bitte prüfen Sie den aktuellen Stand.'
const UPDATE_FAILED = 'Status konnte nicht aktualisiert werden.'
const LOAD_FAILED = 'Anfrage konnte nicht geladen werden.'
const TAKE = 'Prüfung starten'
const RESOLVE = 'Als gelöst markieren'
const REPLY = 'Antwort der Lehrperson'

function detail(status: TeacherHelpStatus) {
  return {
    requestId: 'r1', conversationId: 'c1', student: { id: 's1', name: 'Lea', grade: '8' },
    subject: 'mathematics', status, messages: [], notes: [],
  } as never
}

function renderDetail() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const invalidate = vi.spyOn(client, 'invalidateQueries')
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/teacher/requests/r1']}>
          <Routes><Route path="/teacher/requests/:requestId" element={<TeacherHelpRequestDetailPage />} /></Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
  const invalidatedKeys = () => invalidate.mock.calls.map(([filters]) => JSON.stringify(filters?.queryKey))
  return { invalidatedKeys }
}

const LIST_KEY = JSON.stringify(teacherQueryKeys.helpRequests())
const STATS_KEY = JSON.stringify(teacherQueryKeys.stats())

beforeEach(async () => {
  vi.clearAllMocks()
  await i18n.changeLanguage('de')
})

describe('a request that moved on under the teacher (409)', () => {
  it.each(['help_request_changed', 'help_request_not_held'])(
    'reads it and the list again and says so in German (%s)',
    async (code) => {
      vi.mocked(teacherApi.getTeacherHelpRequestDetail)
        .mockResolvedValueOnce(detail('pending'))
        .mockResolvedValue(detail('expired'))
      vi.mocked(teacherApi.updateTeacherHelpRequestStatus).mockRejectedValue(
        new ApiError('This help request changed.', { status: 409, code }),
      )
      const { invalidatedKeys } = renderDetail()
      await userEvent.click(await screen.findByRole('button', { name: TAKE }))

      expect(await screen.findByText(CHANGED)).toBeInTheDocument()
      expect(screen.queryByText(UPDATE_FAILED)).toBeNull()
      expect(invalidatedKeys()).toContain(LIST_KEY)
      await waitFor(() => expect(teacherApi.getTeacherHelpRequestDetail).toHaveBeenCalledTimes(2))
      // Read again, it has expired: the refused button is gone.
      await waitFor(() => expect(screen.queryByRole('button', { name: TAKE })).toBeNull())
    },
  )

  it('also reads it again when a reply is refused', async () => {
    vi.mocked(teacherApi.getTeacherHelpRequestDetail).mockResolvedValue(detail('pending'))
    vi.mocked(teacherApi.addTeacherHelpRequestNote).mockRejectedValue(
      new ApiError('x', { status: 409, code: 'help_request_changed' }),
    )
    const { invalidatedKeys } = renderDetail()
    await userEvent.type(await screen.findByLabelText(REPLY), 'Hallo Lea')
    await userEvent.click(screen.getByRole('button', { name: 'Antwort senden' }))

    expect(await screen.findByText(CHANGED)).toBeInTheDocument()
    expect(invalidatedKeys()).toContain(LIST_KEY)
    await waitFor(() => expect(teacherApi.getTeacherHelpRequestDetail).toHaveBeenCalledTimes(2))
  })

  it('keeps the generic message, and reads nothing again, for any other failure', async () => {
    vi.mocked(teacherApi.getTeacherHelpRequestDetail).mockResolvedValue(detail('pending'))
    vi.mocked(teacherApi.updateTeacherHelpRequestStatus).mockRejectedValue(new ApiError('boom', { status: 500 }))
    const { invalidatedKeys } = renderDetail()
    await userEvent.click(await screen.findByRole('button', { name: TAKE }))

    expect(await screen.findByText(UPDATE_FAILED)).toBeInTheDocument()
    expect(screen.queryByText(CHANGED)).toBeNull()
    expect(invalidatedKeys()).not.toContain(LIST_KEY)
  })

  it('has the message in all four languages, German in Sie', () => {
    for (const [language, bundle] of Object.entries({ de, en, fr, it: italian })) {
      expect(bundle.detail.changedElsewhere, language).toBeTruthy()
    }
    expect(de.detail.changedElsewhere).toMatch(/\bSie\b/)
    expect(de.detail.changedElsewhere).not.toMatch(/\b(du|dich|dein)\b/i)
    expect(fr.detail.changedElsewhere).toMatch(/\bveuillez\b/)
  })
})

describe('a request that can no longer be read', () => {
  it('stays on screen but offers no status change and no reply', async () => {
    vi.mocked(teacherApi.getTeacherHelpRequestDetail)
      .mockResolvedValueOnce(detail('pending'))
      .mockRejectedValue(new ApiError('gone', { status: 403 }))
    vi.mocked(teacherApi.updateTeacherHelpRequestStatus).mockResolvedValue({ requestId: 'r1', status: 'in_progress' } as never)
    renderDetail()
    await userEvent.click(await screen.findByRole('button', { name: TAKE }))

    expect(await screen.findByText(LOAD_FAILED)).toBeInTheDocument()
    expect(screen.getAllByText('Lea', { exact: false }).length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: TAKE })).toBeNull()
    expect(screen.queryByRole('button', { name: RESOLVE })).toBeNull()
    expect(screen.queryByLabelText(REPLY)).toBeNull()
  })
})

describe('the status changes offered', () => {
  it('match what advance_help_request moves', () => {
    expect(teacherStatusActions('pending')).toEqual(['in_progress', 'resolved'])
    expect(teacherStatusActions('in_progress')).toEqual(['resolved'])
    for (const status of ['assigned', 'resolved', 'cancelled', 'withdrawn', 'expired', undefined] as const) {
      expect(teacherStatusActions(status), String(status)).toEqual([])
    }
  })

  it('offers only finishing on a request already in progress', async () => {
    vi.mocked(teacherApi.getTeacherHelpRequestDetail).mockResolvedValue(detail('in_progress'))
    renderDetail()
    expect(await screen.findByRole('button', { name: RESOLVE })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: TAKE })).toBeNull()
  })

  it('offers no status change on an assigned request', async () => {
    vi.mocked(teacherApi.getTeacherHelpRequestDetail).mockResolvedValue(detail('assigned'))
    renderDetail()
    await screen.findByLabelText(REPLY)
    expect(screen.queryByRole('button', { name: TAKE })).toBeNull()
    expect(screen.queryByRole('button', { name: RESOLVE })).toBeNull()
  })
})

describe('a reply that takes the offer', () => {
  it('refreshes the list and the stats, not only the detail', async () => {
    vi.mocked(teacherApi.getTeacherHelpRequestDetail).mockResolvedValue(detail('pending'))
    vi.mocked(teacherApi.addTeacherHelpRequestNote).mockResolvedValue({ id: 'n1' } as never)
    const { invalidatedKeys } = renderDetail()
    await userEvent.type(await screen.findByLabelText(REPLY), 'Hallo Lea')
    await userEvent.click(screen.getByRole('button', { name: 'Antwort senden' }))

    await waitFor(() => expect(invalidatedKeys()).toContain(LIST_KEY))
    expect(invalidatedKeys()).toContain(STATS_KEY)
  })
})
