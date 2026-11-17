/**
 * #705 (stoa-backend#479): a teacher accepts a help request before replying.
 * Offered and not yet accepted, the request is only read, with one "accept"
 * step; the reply box comes once the teacher holds it. A reply the server
 * still refuses as not accepted (409 `help_request_not_accepted`, action
 * `accept_help_request`) leads the teacher to accept it, the draft kept.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import de from '@/i18n/locales/de/teacher.json'
import en from '@/i18n/locales/en/teacher.json'
import fr from '@/i18n/locales/fr/teacher.json'
import italian from '@/i18n/locales/it/teacher.json'
import { classifyRefusal } from '@/features/teacherReply/replyRules'
import { isHelpRequestConflict, isHelpRequestNotAccepted } from '@/lib/teacherHelpRequestConflict'
import { TeacherHelpRequestDetailPage } from '@/pages/teacher/TeacherHelpRequestDetailPage'
import { ApiError } from '@/services/api/httpClient'
import * as teacherApi from '@/services/teacher/teacherApi'
import { acceptsTeacherReply, awaitsTeacherAcceptance, type TeacherHelpStatus } from '@/types/teacherHelp'

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

const ACCEPT = { name: de.detail.accept.button }
const REPLY = de.detail.replyTitle
const SEND = { name: 'Antwort senden' }
const NOT_ACCEPTED = new ApiError('accept it first', { status: 409, code: 'help_request_not_accepted' })

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
}

beforeEach(async () => {
  vi.clearAllMocks()
  sessionStorage.clear()
  await i18n.changeLanguage('de')
})

describe('an offered request', () => {
  it('offers no reply box, only accepting it', async () => {
    vi.mocked(teacherApi.getTeacherHelpRequestDetail).mockResolvedValue(detail('pending'))
    renderDetail()

    expect(await screen.findByRole('button', ACCEPT)).toBeEnabled()
    expect(screen.getByText(de.detail.accept.body)).toBeInTheDocument()
    expect(screen.queryByLabelText(REPLY)).toBeNull()
    expect(screen.queryByRole('button', SEND)).toBeNull()
    expect(screen.queryByRole('button', { name: de.markResolved })).toBeNull()
  })

  it('once accepted, offers the reply box, and the reply goes', async () => {
    vi.mocked(teacherApi.getTeacherHelpRequestDetail).mockResolvedValue(detail('pending'))
    vi.mocked(teacherApi.updateTeacherHelpRequestStatus).mockImplementation(async () => {
      // The server holds it for this teacher now: the next read says so.
      vi.mocked(teacherApi.getTeacherHelpRequestDetail).mockResolvedValue(detail('in_progress'))
      return { requestId: 'r1', status: 'in_progress' } as never
    })
    vi.mocked(teacherApi.addTeacherHelpRequestNote).mockResolvedValue({ id: 'n1' } as never)
    renderDetail()

    await userEvent.click(await screen.findByRole('button', ACCEPT))
    await waitFor(() => expect(teacherApi.updateTeacherHelpRequestStatus).toHaveBeenCalled())
    expect(vi.mocked(teacherApi.updateTeacherHelpRequestStatus).mock.calls[0][0]).toEqual({ requestId: 'r1', status: 'in_progress' })

    await userEvent.type(await screen.findByLabelText(REPLY), 'Hallo Lea')
    expect(screen.queryByRole('button', ACCEPT)).toBeNull()
    await userEvent.click(screen.getByRole('button', SEND))
    await waitFor(() => expect(teacherApi.addTeacherHelpRequestNote).toHaveBeenCalled())
    expect(vi.mocked(teacherApi.addTeacherHelpRequestNote).mock.calls[0][0]).toMatchObject({
      requestId: 'r1', content: 'Hallo Lea',
    })
  })

  it('says so when another teacher accepted it first', async () => {
    vi.mocked(teacherApi.getTeacherHelpRequestDetail).mockResolvedValue(detail('pending'))
    vi.mocked(teacherApi.updateTeacherHelpRequestStatus).mockRejectedValue(
      new ApiError('taken', { status: 409, code: 'help_request_not_held' }),
    )
    renderDetail()
    await userEvent.click(await screen.findByRole('button', ACCEPT))

    expect(await screen.findByText(de.detail.changedElsewhere)).toBeInTheDocument()
    expect(screen.queryByLabelText(REPLY)).toBeNull()
  })

  it('offers no accepting while the request cannot be read again', async () => {
    vi.mocked(teacherApi.getTeacherHelpRequestDetail)
      .mockResolvedValueOnce(detail('pending'))
      .mockRejectedValue(new ApiError('gone', { status: 404 }))
    vi.mocked(teacherApi.updateTeacherHelpRequestStatus).mockResolvedValue({ requestId: 'r1', status: 'in_progress' } as never)
    renderDetail()
    await userEvent.click(await screen.findByRole('button', ACCEPT))

    await waitFor(() => expect(screen.queryByRole('button', ACCEPT)).toBeNull())
    expect(screen.queryByLabelText(REPLY)).toBeNull()
  })
})

describe('a reply refused as not accepted yet (409 accept_help_request)', () => {
  it('leads the teacher to accept it, keeps the draft, and does not say a generic failure', async () => {
    // The copy on screen said it was held; the server says it is only offered.
    vi.mocked(teacherApi.getTeacherHelpRequestDetail).mockResolvedValue(detail('in_progress'))
    vi.mocked(teacherApi.addTeacherHelpRequestNote).mockRejectedValue(NOT_ACCEPTED)
    vi.mocked(teacherApi.updateTeacherHelpRequestStatus).mockResolvedValue({ requestId: 'r1', status: 'in_progress' } as never)
    renderDetail()

    await userEvent.type(await screen.findByLabelText(REPLY), 'Hallo Lea')
    await userEvent.click(screen.getByRole('button', SEND))

    expect(await screen.findByText(de.detail.accept.replyRefused)).toBeInTheDocument()
    expect(toast.error).toHaveBeenCalledWith(de.toasts.replyNotAccepted)
    expect(toast.error).not.toHaveBeenCalledWith(de.toasts.replyFailed)
    expect(screen.queryByText(de.detail.changedElsewhere)).toBeNull()
    expect(screen.getByLabelText(REPLY)).toHaveValue('Hallo Lea')

    await userEvent.click(screen.getByRole('button', ACCEPT))
    await waitFor(() => expect(teacherApi.updateTeacherHelpRequestStatus).toHaveBeenCalled())
    expect(vi.mocked(teacherApi.updateTeacherHelpRequestStatus).mock.calls[0][0]).toEqual({ requestId: 'r1', status: 'in_progress' })
    await waitFor(() => expect(screen.queryByRole('button', ACCEPT)).toBeNull())
    expect(screen.getByLabelText(REPLY)).toHaveValue('Hallo Lea')
  })

  it('is told apart from a request that moved on', () => {
    expect(isHelpRequestNotAccepted(NOT_ACCEPTED)).toBe(true)
    expect(isHelpRequestConflict(NOT_ACCEPTED)).toBe(false)
    expect(classifyRefusal(NOT_ACCEPTED)).toBe('notAccepted')
    expect(classifyRefusal(new ApiError('x', { status: 409, code: 'help_request_not_held' }))).toBe('conflict')
  })
})

describe('a request that ended before anyone accepted it', () => {
  it.each([
    ['withdrawn', de.detail.ended.withdrawn],
    ['expired', de.detail.ended.expired],
  ] as const)('says it was %s, and offers nothing on it', async (status, line) => {
    vi.mocked(teacherApi.getTeacherHelpRequestDetail).mockResolvedValue(detail(status))
    renderDetail()

    expect(await screen.findByText(line)).toBeInTheDocument()
    expect(screen.queryByRole('button', ACCEPT)).toBeNull()
    expect(screen.queryByLabelText(REPLY)).toBeNull()
  })
})

describe('which statuses take a reply', () => {
  it('is only one the teacher holds; an offer waits for accepting', () => {
    const statuses: TeacherHelpStatus[] = ['pending', 'in_progress', 'resolved', 'withdrawn', 'expired']
    expect(statuses.filter(acceptsTeacherReply)).toEqual(['in_progress', 'resolved'])
    expect(statuses.filter(awaitsTeacherAcceptance)).toEqual(['pending'])
  })
})

describe('the new copy', () => {
  it('is in all four languages, Swiss German without ß, German in Sie', () => {
    for (const [language, bundle] of Object.entries({ de, en, fr, it: italian })) {
      for (const key of ['title', 'body', 'replyRefused', 'button'] as const) {
        expect(bundle.detail.accept[key], `${language} accept.${key}`).toBeTruthy()
      }
      expect(bundle.detail.ended.withdrawn, language).toBeTruthy()
      expect(bundle.detail.ended.expired, language).toBeTruthy()
      expect(bundle.toasts.replyNotAccepted, language).toBeTruthy()
    }
    const german = JSON.stringify({ accept: de.detail.accept, ended: de.detail.ended, toast: de.toasts.replyNotAccepted })
    expect(german).not.toMatch(/ß/)
    expect(german).toMatch(/\bSie\b/)
    expect(german).not.toMatch(/\b(du|dich|dein)\b/i)
  })
})
