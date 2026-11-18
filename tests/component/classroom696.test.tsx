/**
 * #696: the virtual classroom -- `/classroom/:conversationId`, a shared
 * whiteboard, voice, and the conversation beside them.
 *
 * - The address: a classroom's path is on this site whatever the ids.
 * - The student: asking a teacher in Ask leads into the classroom once it is
 *   known to open, and leaves Ask as it was when it is not set up (503
 *   `classroom_unavailable`). Inside, the bar says where the request stands,
 *   read again while it waits; the board is the address the backend gave.
 * - Graceful: a 503 says the classroom is unavailable, with the way back to
 *   the conversation; a board that never loads says so and offers its own tab.
 * - Voice (a stand-in connector): who is there and speaking, the microphone
 *   switched off, and a microphone the browser refused.
 * - The teacher: "Enter classroom" on the request only while they work on it,
 *   and inside, the student's conversation to read.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { classroomPathFor } from '@/app/router/routeManifest'
import { AskHost } from '@/features/ask/AskHost'
import { AskServerProvider } from '@/features/ask/server/askServer'
import { ClassroomVoiceProvider, type VoiceConnector, type VoiceEvents } from '@/features/classroom/classroomVoice'
import { WHITEBOARD_LOAD_TIMEOUT_MS, Whiteboard } from '@/features/classroom/Whiteboard'
import i18n from '@/i18n'
import { ClassroomPage } from '@/pages/classroom/ClassroomPage'
import { TeacherHelpRequestDetailPage } from '@/pages/teacher/TeacherHelpRequestDetailPage'
import { ApiError } from '@/services/api/httpClient'
import * as classroomApi from '@/services/classroom/classroomApi'
import * as teacherApi from '@/services/teacher/teacherApi'
import { resetAsk } from '@/store/askStore'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { ChatMessage, Conversation } from '@/types/chat'
import type { ClassroomPass } from '@/types/classroom'
import type { TeacherHelpRequestDetail } from '@/types/teacher'
import type { HelpMode, TeacherHelpRequest, TeacherHelpStatus } from '@/types/teacherHelp'
import { createFakeAskServer, type FakeAskServer } from '../fakes/askServer'

vi.mock('@/services/classroom/classroomApi', () => ({
  enterStudentClassroom: vi.fn(),
  enterTeacherClassroom: vi.fn(),
}))
vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('@/services/teacher/teacherApi', async (orig) => ({
  ...(await orig<typeof import('@/services/teacher/teacherApi')>()),
  getTeacherHelpRequestDetail: vi.fn(),
  updateTeacherHelpRequestStatus: vi.fn(),
}))
vi.mock('@/hooks/practice/useCurriculumCatalogQuery', () => ({
  useCurriculumCatalogQuery: () => ({ data: undefined, isLoading: false, isError: false }),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))

const enterStudent = vi.mocked(classroomApi.enterStudentClassroom)
const enterTeacher = vi.mocked(classroomApi.enterTeacherClassroom)
const readDetail = vi.mocked(teacherApi.getTeacherHelpRequestDetail)
const updateStatus = vi.mocked(teacherApi.updateTeacherHelpRequestStatus)

const tr = (key: string, options?: Record<string, unknown>) => i18n.t(`chat:${key}`, options)
const initialLanguage = i18n.language

const PASS: ClassroomPass = {
  whiteboardUrl: 'https://board.example.test/boards/help-c1?token=jwt',
  voice: { roomUrl: 'https://stoa.daily.example.test/stoa-help-c1', token: 'meeting-token' },
  expiresAt: new Date(Date.now() + 3 * 3_600_000).toISOString(),
}

const unavailable = () => new ApiError('The classroom is not configured', { status: 503, code: 'classroom_unavailable' })

let server: FakeAskServer

function message(id: string, role: ChatMessage['role'], content: string): ChatMessage {
  return { id, conversationId: 'c1', role, content, createdAt: '2026-11-16T10:00:00.000Z', status: 'completed' }
}

function conversation(): Conversation {
  return {
    id: 'c1',
    title: 'Fractions',
    subject: 'math',
    grade: '8',
    updatedAt: '2026-11-16T10:00:00.000Z',
    messages: [message('s1', 'student', 'How do I reduce 18/24?'), message('a1', 'assistant', 'Divide both by 6: 3/4.')],
  }
}

// A classroom request (#705): only those have a classroom to enter.
function help(status: TeacherHelpStatus, mode: HelpMode = 'classroom'): TeacherHelpRequest {
  return { requestId: 'r1', conversationId: 'c1', status, mode, teacherName: 'Frau Muster', createdAt: '2026-11-16T10:00:00.000Z' }
}

function detail(status: TeacherHelpStatus, mode: HelpMode = 'classroom'): TeacherHelpRequestDetail {
  return {
    requestId: 'r1',
    conversationId: 'c1',
    student: { id: 's1', name: 'Lina Meier', grade: '8' },
    subject: 'math',
    status,
    mode,
    messages: [
      { id: 's1', conversationId: 'c1', role: 'student', content: 'How do I reduce 18/24?', createdAt: '2026-11-16T10:00:00.000Z' },
      { id: 'a1', conversationId: 'c1', role: 'assistant', content: 'Divide both by 6: 3/4.', createdAt: '2026-11-16T10:00:00.000Z' },
    ],
    notes: [],
  }
}

/** A voice that joins at once and hands the test its events. */
function standInVoice() {
  const joined: { events?: VoiceEvents; room?: { roomUrl: string; token: string } } = {}
  const setMic = vi.fn()
  const leave = vi.fn(async () => {})
  const connect: VoiceConnector = vi.fn(async (room, events) => {
    joined.events = events
    joined.room = room
    return { setMic, leave }
  })
  return { connect, joined, setMic, leave }
}

function signIn(role: 'student' | 'teacher') {
  useAuthStore.setState({
    user: { id: 'u-1', name: role === 'student' ? 'Lina Meier' : 'Frau Muster', email: 'x@example.com', role } as CurrentUser,
    accessToken: 'token',
    isAuthenticated: true,
  })
}

function Where() {
  const location = useLocation()
  return <p data-testid="where">{location.pathname + location.search}</p>
}

function RoutedAsk() {
  const { id } = useParams()
  return <AskHost route={{ conversationId: id ?? null }} />
}

function open(path: string, voice: VoiceConnector = standInVoice().connect) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[path]}>
          <AskServerProvider value={server}>
            <ClassroomVoiceProvider value={voice}>
              <Where />
              <Routes>
                <Route path="/ask/:id" element={<RoutedAsk />} />
                <Route path="/classroom/:conversationId" element={<ClassroomPage />} />
                <Route path="/teacher/requests/:requestId" element={<TeacherHelpRequestDetailPage />} />
              </Routes>
            </ClassroomVoiceProvider>
          </AskServerProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
  return client
}

const where = () => screen.getByTestId('where').textContent

/** The bar over the classroom. */
async function bar696() {
  await waitFor(() => expect(document.querySelector('[data-classroom-bar]')).not.toBeNull())
  return document.querySelector<HTMLElement>('[data-classroom-bar]')!
}

beforeEach(async () => {
  await i18n.changeLanguage('en')
  window.matchMedia = ((query: string) => ({
    matches: !/min-width:\s*(\d+)px/.test(query) || 1280 >= Number(query.match(/min-width:\s*(\d+)px/)?.[1]),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
  signIn('student')
  resetAsk()
  server = createFakeAskServer()
  server.seed({ conversations: [conversation()] })
  server.availability = {
    online: true,
    availableTeachers: 2,
    teacherSupport: { canRequest: true, remainingCases: 2, weeklyCases: 3, blockedReason: null, resetsAt: null },
  }
  enterStudent.mockResolvedValue(PASS)
  enterTeacher.mockResolvedValue(PASS)
})

const originalMatchMedia = window.matchMedia
afterEach(() => {
  vi.clearAllMocks()
  vi.useRealTimers()
  sessionStorage.clear()
  window.matchMedia = originalMatchMedia
})

afterAll(async () => {
  await i18n.changeLanguage(initialLanguage)
})

describe('the classroom address', () => {
  it('is the conversation, and the request for a teacher', () => {
    expect(classroomPathFor('c1')).toBe('/classroom/c1')
    expect(classroomPathFor('c1', 'r1')).toBe('/classroom/c1?request=r1')
  })

  it('stays on this site for ids that are not ids', () => {
    for (const hostile of ['..', '//evil.example', 'javascript:alert(1)', '', undefined, 42, { id: 'c1' }]) {
      expect(classroomPathFor(hostile)).toBe('/')
      expect(classroomPathFor('c1', hostile)).toBe('/classroom/c1')
    }
  })
})

// #705: asking no longer leads into the classroom to wait (#696). The student
// stays in the conversation; a classroom request is entered from the card once
// a teacher has accepted it.
describe('asking a teacher keeps the student in Ask', () => {
  it('stays in the conversation, with no seat asked for', async () => {
    server.teacherHelp.enterStudentClassroom.mockResolvedValue(PASS)
    open('/ask/c1')
    await userEvent.click(await screen.findByRole('button', { name: tr('ask.help.request') }))
    await screen.findByRole('region', { name: tr('ask.help.cardLabel') })
    expect(where()).toBe('/ask/c1')
    expect(server.teacherHelp.enterStudentClassroom).not.toHaveBeenCalled()
  })

  it('goes into the classroom from the card once a teacher accepted a classroom request', async () => {
    server.seed({ helpRequests: [help('in_progress')] })
    open('/ask/c1')
    await userEvent.click(await screen.findByRole('button', { name: tr('ask.help.classroom.enter') }))
    await waitFor(() => expect(where()).toBe('/classroom/c1'))
    expect(await screen.findByTitle(tr('classroom.board.title'))).toHaveAttribute('src', PASS.whiteboardUrl)
  })

  it('offers no classroom for a text request', async () => {
    server.seed({ helpRequests: [help('in_progress', 'text')] })
    open('/ask/c1')
    await screen.findByRole('region', { name: tr('ask.help.cardLabel') })
    expect(screen.queryByRole('button', { name: tr('ask.help.classroom.enter') })).toBeNull()
  })
})

describe('the student in the classroom', () => {
  it('waits for a teacher, then says the teacher joined', async () => {
    server.seed({ helpRequests: [help('pending')] })
    const client = open('/classroom/c1')
    const bar = await bar696()
    await waitFor(() => expect(within(bar).getByText(tr('classroom.status.waiting'))).toBeInTheDocument())
    expect(await screen.findByTitle(tr('classroom.board.title'))).toHaveAttribute('src', PASS.whiteboardUrl)

    server.seed({ helpRequests: [help('in_progress')] })
    await act(async () => {
      await client.refetchQueries()
    })
    await waitFor(() =>
      expect(within(bar).getByText(tr('classroom.status.joined', { name: 'Frau Muster' }))).toBeInTheDocument(),
    )
  })

  it('keeps the conversation with the assistant beside the board', async () => {
    server.seed({ helpRequests: [help('in_progress')] })
    open('/classroom/c1')
    const sidebar = await screen.findByRole('complementary', { name: tr('ask.title') })
    expect(await within(sidebar).findByText('Divide both by 6: 3/4.')).toBeInTheDocument()
    expect(within(sidebar).getByRole('textbox', { name: tr('ask.composerLabel') })).toBeInTheDocument()
    // Held to this conversation: no way to the list from here.
    expect(within(sidebar).queryByRole('button', { name: tr('ask.back') })).toBeNull()
  })

  it('says the classroom is unavailable on a 503, with the way back to the conversation', async () => {
    enterStudent.mockRejectedValue(unavailable())
    open('/classroom/c1')
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(tr('classroom.unavailable.title'))
    expect(within(alert).getByRole('link', { name: tr('classroom.unavailable.back') })).toHaveAttribute('href', '/ask/c1')
  })

  it('says the classroom is closed when the request is no longer one to enter', async () => {
    enterStudent.mockRejectedValue(new ApiError('closed', { status: 409, code: 'teacher_help_request_closed' }))
    open('/classroom/c1')
    expect(await screen.findByRole('alert')).toHaveTextContent(tr('classroom.refused.title'))
  })
})

describe('the voice', () => {
  it('joins the room it was given, says who is there and speaking, and switches the microphone off', async () => {
    server.seed({ helpRequests: [help('in_progress')] })
    const voice = standInVoice()
    open('/classroom/c1', voice.connect)
    await waitFor(() => expect(voice.joined.room).toEqual(PASS.voice))
    act(() => voice.joined.events?.onRemote({ name: 'Frau Muster' }))
    expect(await screen.findByText(tr('classroom.voice.inRoom', { name: 'Frau Muster' }))).toBeInTheDocument()
    act(() => voice.joined.events?.onRemoteSpeaking(true))
    expect(await screen.findByText(tr('classroom.voice.speaking', { name: 'Frau Muster' }))).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: tr('classroom.mic.mute') }))
    expect(voice.setMic).toHaveBeenCalledWith(false)
    expect(screen.getByRole('button', { name: tr('classroom.mic.unmute') })).toHaveAttribute('aria-pressed', 'false')
  })

  it('says when the browser refused the microphone, and offers no switch', async () => {
    const voice = standInVoice()
    open('/classroom/c1', voice.connect)
    await waitFor(() => expect(voice.joined.events).toBeDefined())
    act(() => voice.joined.events?.onMicDenied())
    expect(await screen.findByText(tr('classroom.voice.micDenied'))).toBeInTheDocument()
    expect(screen.getByRole('button', { name: tr('classroom.mic.unmute') })).toBeDisabled()
  })

  it('leaves the room with the page', async () => {
    const voice = standInVoice()
    open('/classroom/c1', voice.connect)
    await waitFor(() => expect(voice.joined.events).toBeDefined())
    await userEvent.click(screen.getByRole('link', { name: tr('classroom.leave') }))
    await waitFor(() => expect(voice.leave).toHaveBeenCalled())
    expect(where()).toBe('/ask/c1')
  })
})

describe('the whiteboard', () => {
  it('says it did not load, and offers it in a tab of its own and the way back', () => {
    vi.useFakeTimers()
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <Whiteboard url={PASS.whiteboardUrl} backTo="/ask/c1" />
        </MemoryRouter>
      </I18nextProvider>,
    )
    expect(screen.getByRole('status')).toHaveTextContent(tr('classroom.board.loading'))
    act(() => vi.advanceTimersByTime(WHITEBOARD_LOAD_TIMEOUT_MS + 1))
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent(tr('classroom.board.failedTitle'))
    const tab = within(alert).getByRole('link', { name: tr('classroom.board.openInTab') })
    expect(tab).toHaveAttribute('href', PASS.whiteboardUrl)
    expect(tab).toHaveAttribute('target', '_blank')
    expect(within(alert).getByRole('link', { name: tr('classroom.unavailable.back') })).toHaveAttribute('href', '/ask/c1')
  })

  it('counts as loaded once the frame says so', () => {
    vi.useFakeTimers()
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <Whiteboard url={PASS.whiteboardUrl} backTo="/ask/c1" />
        </MemoryRouter>
      </I18nextProvider>,
    )
    fireEvent.load(screen.getByTitle(tr('classroom.board.title')))
    act(() => vi.advanceTimersByTime(WHITEBOARD_LOAD_TIMEOUT_MS + 1))
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

describe('the teacher', () => {
  beforeEach(() => signIn('teacher'))

  it('is offered the classroom only while working on the request', async () => {
    readDetail.mockResolvedValue(detail('assigned'))
    open('/teacher/requests/r1')
    await waitFor(() => expect(readDetail).toHaveBeenCalled())
    expect(screen.queryByRole('link', { name: i18n.t('teacher:detail.enterClassroom') })).toBeNull()
  })

  it('accepts an offered classroom request without leaving, then enters the classroom', async () => {
    readDetail.mockResolvedValue(detail('pending'))
    updateStatus.mockImplementation(async () => {
      // The server has it now: the next read says so.
      readDetail.mockResolvedValue(detail('in_progress'))
      return detail('in_progress') as unknown as Awaited<ReturnType<typeof teacherApi.updateTeacherHelpRequestStatus>>
    })
    open('/teacher/requests/r1')
    expect(screen.queryByRole('link', { name: i18n.t('teacher:detail.enterClassroom') })).toBeNull()
    const accept = await screen.findByRole('button', { name: i18n.t('teacher:detail.accept.button') })
    await userEvent.click(accept)

    await waitFor(() => expect(updateStatus).toHaveBeenCalled())
    expect(updateStatus.mock.calls[0][0]).toEqual({ requestId: 'r1', status: 'in_progress' })
    // Accepting goes nowhere (#705); the way in comes once the server has it.
    const enter = await screen.findByRole('link', { name: i18n.t('teacher:detail.enterClassroom') })
    expect(enterTeacher).not.toHaveBeenCalled()
    await userEvent.click(enter)
    await waitFor(() => expect(enterTeacher).toHaveBeenCalledWith('r1'))
    expect(await bar696()).toBeInTheDocument()
  })

  it('stays on the request and says so when the offer was taken or lapsed meanwhile', async () => {
    readDetail.mockResolvedValue(detail('pending'))
    updateStatus.mockRejectedValue(new ApiError('conflict', { status: 409, code: 'help_request_changed' }))
    open('/teacher/requests/r1')
    await userEvent.click(await screen.findByRole('button', { name: i18n.t('teacher:detail.accept.button') }))

    await waitFor(() => expect(updateStatus).toHaveBeenCalled())
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(enterTeacher).not.toHaveBeenCalled()
    expect(screen.queryByRole('complementary', { name: tr('classroom.teacherSidebar.label') })).toBeNull()
  })

  it('enters with the request it holds and reads the student’s conversation', async () => {
    readDetail.mockResolvedValue(detail('in_progress'))
    open('/teacher/requests/r1')
    const enter = await screen.findByRole('link', { name: i18n.t('teacher:detail.enterClassroom') })
    expect(enter).toHaveAttribute('href', '/classroom/c1?request=r1')
    await userEvent.click(enter)

    await waitFor(() => expect(enterTeacher).toHaveBeenCalledWith('r1'))
    expect(enterStudent).not.toHaveBeenCalled()
    const bar = await bar696()
    await waitFor(() =>
      expect(within(bar).getByText(tr('classroom.status.teaching', { name: 'Lina Meier' }))).toBeInTheDocument(),
    )
    const sidebar = screen.getByRole('complementary', { name: tr('classroom.teacherSidebar.label') })
    expect(within(sidebar).getByText('Divide both by 6: 3/4.')).toBeInTheDocument()
    // Read only: there is nothing to type to the assistant.
    expect(within(sidebar).queryByRole('textbox')).toBeNull()
  })
})
