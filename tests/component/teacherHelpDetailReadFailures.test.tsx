/**
 * #331: the teacher's help-request detail page and a failed read.
 *
 * T1 - only a refusal (403/404) takes the actions away; any other failure
 *      keeps the reply composer, and the draft in it, on screen. The draft
 *      also outlives the composer itself.
 * T2 - a refused request is neither polled nor retried.
 * T6 - the AI tools it covered are gone from the page since #704
 *      (teacherPrepSummary704.test.tsx).
 */
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query'
import { act, render, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { queryClient as appQueryClient } from '@/app/query/queryClient'
import { TeacherReplyComposer } from '@/features/teacherReply/TeacherReplyComposer'
import type { TeacherReplyAdapter } from '@/features/teacherReply/teacherReplyAdapter'
import { useTeacherReply } from '@/features/teacherReply/useTeacherReply'
import { useTeacherHelpRequestDetailQuery } from '@/hooks/teacher/useTeacherHelpRequestDetailQuery'
import i18n from '@/i18n'
import de from '@/i18n/locales/de/teacher.json'
import en from '@/i18n/locales/en/teacher.json'
import fr from '@/i18n/locales/fr/teacher.json'
import italian from '@/i18n/locales/it/teacher.json'
import { TeacherHelpRequestDetailPage } from '@/pages/teacher/TeacherHelpRequestDetailPage'
import { ApiError } from '@/services/api/httpClient'
import * as teacherApi from '@/services/teacher/teacherApi'
import { teacherQueryKeys } from '@/services/teacher/teacherQueryKeys'
import type { TeacherHelpRequestNote } from '@/types/teacher'
import type { TeacherHelpStatus } from '@/types/teacherHelp'

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('@/services/teacher/teacherApi', async (orig) => ({
  ...(await orig<typeof import('@/services/teacher/teacherApi')>()),
  getTeacherHelpRequestDetail: vi.fn(),
  updateTeacherHelpRequestStatus: vi.fn(),
  addTeacherHelpRequestNote: vi.fn(),
}))
vi.mock('@/hooks/practice/useCurriculumCatalogQuery', () => ({
  useCurriculumCatalogQuery: () => ({ data: undefined, isLoading: false, isError: false }),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))

const mockedDetail = vi.mocked(teacherApi.getTeacherHelpRequestDetail)

const REPLY = 'Antwort der Lehrperson'
const SEND = 'Antwort senden'
const RESOLVE = 'Als gelöst markieren'
const PAUSED = de.detail.replyPaused
const DETAIL_KEY = teacherQueryKeys.helpRequestDetail('r1')

function detail(status: TeacherHelpStatus) {
  return {
    requestId: 'r1', conversationId: 'c1', student: { id: 's1', name: 'Lea', grade: '8' },
    subject: 'mathematics', status, messages: [], notes: [],
  } as never
}

function renderDetail() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/teacher/requests/r1']}>
          <Routes><Route path="/teacher/requests/:requestId" element={<TeacherHelpRequestDetailPage />} /></Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
  // A poll, without waiting for its interval.
  const poll = () => act(async () => {
    await client.refetchQueries({ queryKey: DETAIL_KEY })
  })
  return { poll }
}

beforeEach(async () => {
  vi.clearAllMocks()
  mockedDetail.mockReset()
  sessionStorage.clear()
  await i18n.changeLanguage('de')
})

describe('T1: a read that fails while the teacher writes a reply', () => {
  it('keeps the composer and the draft on any failure but a refusal, and takes nothing', async () => {
    // Held: only the holder is offered the reply (#705).
    mockedDetail.mockResolvedValueOnce(detail('in_progress'))
    const { poll } = renderDetail()
    await userEvent.type(await screen.findByLabelText(REPLY), 'Hallo Lea, schau dir Schritt 2 an')

    mockedDetail.mockRejectedValue(new ApiError('boom', { status: 500 }))
    await poll()

    await waitFor(() => expect(screen.getByText(PAUSED)).toBeInTheDocument(), { timeout: 4000 })
    const reply = screen.getByLabelText(REPLY)
    expect(reply).toHaveValue('Hallo Lea, schau dir Schritt 2 an')
    expect(reply).toBeDisabled()
    expect(screen.getByRole('button', { name: SEND })).toBeDisabled()
    expect(screen.getByRole('button', { name: RESOLVE })).toBeDisabled()

    // The next read succeeds: everything is offered again, the draft intact.
    mockedDetail.mockResolvedValue(detail('in_progress'))
    await poll()
    await waitFor(() => expect(screen.getByLabelText(REPLY)).toBeEnabled())
    expect(screen.getByLabelText(REPLY)).toHaveValue('Hallo Lea, schau dir Schritt 2 an')
    expect(screen.queryByText(PAUSED)).toBeNull()
    expect(screen.getByRole('button', { name: SEND })).toBeEnabled()
  }, 10_000)

  it('hides the composer on a 403, and gives the draft back once the request is readable again', async () => {
    mockedDetail.mockResolvedValueOnce(detail('in_progress'))
    const { poll } = renderDetail()
    await userEvent.type(await screen.findByLabelText(REPLY), 'Entwurf')

    mockedDetail.mockRejectedValueOnce(new ApiError('taken', { status: 403 }))
    await poll()
    await waitFor(() => expect(screen.queryByLabelText(REPLY)).toBeNull())
    expect(screen.queryByText(PAUSED)).toBeNull()

    mockedDetail.mockResolvedValue(detail('in_progress'))
    await poll()
    expect(await screen.findByLabelText(REPLY)).toHaveValue('Entwurf')
  })
})

describe('T1: the reply draft outlives the composer', () => {
  const server: TeacherReplyAdapter = { addNote: async () => ({ id: 'n1' }) as TeacherHelpRequestNote }

  function ReplyBox({ requestId }: { requestId: string }) {
    return <TeacherReplyComposer reply={useTeacherReply(requestId, { adapter: server })} />
  }

  function Composer({ requestId = 'r1' }: { requestId?: string }) {
    return (
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={new QueryClient()}>
          <ReplyBox requestId={requestId} />
        </QueryClientProvider>
      </I18nextProvider>
    )
  }

  it('comes back after an unmount, queued blocks and mode included', async () => {
    const first = render(<Composer />)
    await userEvent.type(screen.getByLabelText(REPLY), 'Erster Block')
    await userEvent.click(screen.getByRole('button', { name: de.reply.addBlock }))
    await userEvent.click(screen.getByRole('button', { name: de.reply.modes.formula }))
    await userEvent.type(screen.getByLabelText(REPLY), '2x = 4')
    first.unmount()

    render(<Composer />)
    expect(screen.getByLabelText(REPLY)).toHaveValue('2x = 4')
    expect(screen.getByRole('button', { name: de.reply.modes.formula })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(i18n.t('teacher:reply.queued', { count: 1 }))).toBeInTheDocument()
  })

  it('is forgotten once sent', async () => {
    const first = render(<Composer />)
    await userEvent.type(screen.getByLabelText(REPLY), 'Gesendet')
    await userEvent.click(screen.getByRole('button', { name: SEND }))
    await waitFor(() => expect(screen.getByLabelText(REPLY)).toHaveValue(''))
    first.unmount()

    render(<Composer />)
    expect(screen.getByLabelText(REPLY)).toHaveValue('')
    expect(sessionStorage.length).toBe(0)
  })

  it('is kept per request', async () => {
    const first = render(<Composer />)
    await userEvent.type(screen.getByLabelText(REPLY), 'Nur für r1')
    first.unmount()

    render(<Composer requestId="r2" />)
    expect(screen.getByLabelText(REPLY)).toHaveValue('')
  })
})

describe('T2: a request out of reach is not asked for again', () => {
  // The app's own defaults: one retry, window-focus refetching off.
  function wrapper({ children }: { children: ReactNode }) {
    const client = new QueryClient({
      defaultOptions: { queries: { ...appQueryClient.getDefaultOptions().queries, gcTime: 0 } },
    })
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }

  async function advance(ms: number) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ms)
    })
  }

  beforeEach(() => {
    vi.useFakeTimers()
    focusManager.setFocused(true)
  })

  afterEach(() => {
    focusManager.setFocused(undefined)
    vi.useRealTimers()
  })

  it.each([403, 404])('stops polling once the read is refused with %i', async (status) => {
    mockedDetail.mockResolvedValueOnce({ status: 'in_progress' } as never)
    mockedDetail.mockRejectedValue(new ApiError('refused', { status }))
    renderHook(() => useTeacherHelpRequestDetailQuery('r1'), { wrapper })
    await advance(0)
    await advance(5_000)
    expect(mockedDetail).toHaveBeenCalledTimes(2)

    await advance(60_000)
    expect(mockedDetail).toHaveBeenCalledTimes(2)
  })

  it.each([403, 404])('does not retry a %i', async (status) => {
    mockedDetail.mockRejectedValue(new ApiError('refused', { status }))
    renderHook(() => useTeacherHelpRequestDetailQuery('r1'), { wrapper })
    await advance(30_000)
    expect(mockedDetail).toHaveBeenCalledTimes(1)
  })

  it('keeps polling, and retries, through any other failure', async () => {
    mockedDetail.mockResolvedValueOnce({ status: 'in_progress' } as never)
    mockedDetail.mockRejectedValue(new ApiError('boom', { status: 500 }))
    renderHook(() => useTeacherHelpRequestDetailQuery('r1'), { wrapper })
    await advance(0)
    await advance(5_000)
    // The failed poll and its one retry.
    await advance(1_000)
    expect(mockedDetail).toHaveBeenCalledTimes(3)

    mockedDetail.mockResolvedValue({ status: 'in_progress' } as never)
    await advance(10_000)
    expect(mockedDetail.mock.calls.length).toBeGreaterThan(3)
  })
})

describe('the new copy', () => {
  it('is in all four languages, teachers addressed as Sie and vous, Italian informal', () => {
    for (const [language, bundle] of Object.entries({ de, en, fr, it: italian })) {
      expect(bundle.detail.replyPaused, language).toBeTruthy()
    }
    for (const text of [de.detail.replyPaused]) {
      expect(text).toMatch(/\b(Sie|Ihr)\b/)
      expect(text).not.toMatch(/\b(du|dich|dein)\b/i)
      expect(text).not.toContain('ß')
    }
    expect(fr.detail.replyPaused).toMatch(/\bvous\b|\bVotre\b/)
    expect(italian.detail.replyPaused).toMatch(/\btua\b/)
  })
})
