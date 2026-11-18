/**
 * #705 parts 2 and 3 (stoa-backend#480): how a student asks to be helped, a
 * text answer or the online classroom. The student chooses only where the
 * classroom is offered (off by default); every request carries its mode; a
 * request without one is a text answer. The teacher sees the mode, accepts
 * first, and then replies here (text) or goes into the classroom (classroom).
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import deChat from '@/i18n/locales/de/chat.json'
import enChat from '@/i18n/locales/en/chat.json'
import frChat from '@/i18n/locales/fr/chat.json'
import itChat from '@/i18n/locales/it/chat.json'
import deCommon from '@/i18n/locales/de/common.json'
import enCommon from '@/i18n/locales/en/common.json'
import frCommon from '@/i18n/locales/fr/common.json'
import itCommon from '@/i18n/locales/it/common.json'
import de from '@/i18n/locales/de/teacher.json'
import en from '@/i18n/locales/en/teacher.json'
import fr from '@/i18n/locales/fr/teacher.json'
import italian from '@/i18n/locales/it/teacher.json'
import { HelpRequestList } from '@/components/teacher/HelpRequestList'
import { TeacherHelpAction, TeacherHelpStatusCard } from '@/features/ask/teacherHelp/TeacherHelp'
import { classroomHelpOffered } from '@/lib/classroomHelp'
import { notificationText } from '@/lib/notificationCopy'
import { TeacherHelpRequestDetailPage } from '@/pages/teacher/TeacherHelpRequestDetailPage'
import { httpClient } from '@/services/api/httpClient'
import * as teacherApi from '@/services/teacher/teacherApi'
import { createTeacherHelpRequest } from '@/services/teacherHelp/teacherHelpApi'
import type { TeacherHelpRequestSummary } from '@/types/teacher'
import { helpModeOf, type HelpMode, type TeacherHelpRequest, type TeacherHelpStatus } from '@/types/teacherHelp'

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

function wrap(children: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/teacher/requests/r1']}>
          <Routes>
            <Route path="/teacher/requests/:requestId" element={children} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>
  )
}

beforeEach(async () => {
  vi.clearAllMocks()
  sessionStorage.clear()
  await i18n.changeLanguage('de')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('a request’s mode', () => {
  it('is a text answer unless it says classroom', () => {
    expect(helpModeOf({ mode: 'classroom' })).toBe('classroom')
    expect(helpModeOf({ mode: 'text' })).toBe('text')
    expect(helpModeOf({})).toBe('text')
    expect(helpModeOf({ mode: 'video' })).toBe('text')
    expect(helpModeOf(undefined)).toBe('text')
  })

  it('is sent when the student asks', async () => {
    const post = vi.spyOn(httpClient, 'post').mockResolvedValue({ data: { requestId: 'r1' } } as never)
    await createTeacherHelpRequest({ conversationId: 'c1', mode: 'classroom' })
    expect(post).toHaveBeenCalledWith('/teacher-help/request', { conversationId: 'c1', mode: 'classroom' })
    post.mockRestore()
  })
})

describe('the classroom switch', () => {
  it('is off by default', () => {
    expect(classroomHelpOffered()).toBe(false)
  })

  it('is on with VITE_CLASSROOM_HELP=on', () => {
    vi.stubEnv('VITE_CLASSROOM_HELP', 'on')
    expect(classroomHelpOffered()).toBe(true)
  })
})

describe('"Ask a teacher"', () => {
  const action = (props: { classroomOffered?: boolean; onRequest: (mode: HelpMode) => void }) =>
    render(
      <I18nextProvider i18n={i18n}>
        <TeacherHelpAction requesting={false} teachersOnline support={null} {...props} />
      </I18nextProvider>,
    )

  it('asks for a text answer at once while the classroom is not offered', async () => {
    const onRequest = vi.fn()
    action({ onRequest })
    await userEvent.click(screen.getByRole('button', { name: deChat.ask.help.request }))
    expect(onRequest).toHaveBeenCalledWith('text')
    expect(screen.queryByRole('button', { name: deChat.ask.help.mode.classroom })).toBeNull()
  })

  it('asks how first where the classroom is offered', async () => {
    const onRequest = vi.fn()
    action({ onRequest, classroomOffered: true })
    await userEvent.click(screen.getByRole('button', { name: deChat.ask.help.request }))
    expect(onRequest).not.toHaveBeenCalled()
    expect(screen.getByRole('group', { name: deChat.ask.help.mode.choose })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: deChat.ask.help.mode.text })).toHaveFocus()

    await userEvent.click(screen.getByRole('button', { name: deChat.ask.help.mode.classroom }))
    expect(onRequest).toHaveBeenCalledWith('classroom')
  })

  it('can be called off without asking', async () => {
    const onRequest = vi.fn()
    action({ onRequest, classroomOffered: true })
    await userEvent.click(screen.getByRole('button', { name: deChat.ask.help.request }))
    await userEvent.click(screen.getByRole('button', { name: deChat.ask.help.mode.cancel }))
    expect(onRequest).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: deChat.ask.help.request })).toBeInTheDocument()
  })
})

describe('the student’s card', () => {
  const card = (status: TeacherHelpStatus, mode: HelpMode | undefined, onEnterClassroom = vi.fn()) => {
    const request: TeacherHelpRequest = {
      requestId: 'r1', conversationId: 'c1', status, mode, teacherName: 'Anna', createdAt: '2026-11-17T10:00:00Z',
    }
    render(
      <I18nextProvider i18n={i18n}>
        <TeacherHelpStatusCard request={request} teachersOnline onEnterClassroom={onEnterClassroom} />
      </I18nextProvider>,
    )
    return onEnterClassroom
  }
  const ENTER = { name: deChat.ask.help.classroom.enter }

  it('offers the classroom once a teacher accepted a classroom request', async () => {
    const enter = card('in_progress', 'classroom')
    expect(screen.getByText(deChat.ask.help.classroom.ready)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', ENTER))
    expect(enter).toHaveBeenCalled()
  })

  it('does not offer it before a teacher accepted', () => {
    card('pending', 'classroom')
    expect(screen.getByText(deChat.ask.help.classroom.waiting)).toBeInTheDocument()
    expect(screen.queryByRole('button', ENTER)).toBeNull()
  })

  it.each([['text'], [undefined]] as const)('never offers it on a text request (mode %s)', (mode) => {
    card('in_progress', mode)
    expect(screen.queryByRole('button', ENTER)).toBeNull()
    expect(screen.getByText(deChat.ask.help.body.in_progress)).toBeInTheDocument()
  })
})

describe('the teacher’s list', () => {
  const row = (requestId: string, mode?: HelpMode): TeacherHelpRequestSummary => ({
    requestId, conversationId: `c-${requestId}`, studentName: 'Lea', subject: 'mathematics', grade: '8',
    status: 'pending', createdAt: '2026-11-17T10:00:00Z', mode,
  })

  it('marks each request’s mode, an older one as text', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <HelpRequestList requests={[row('a', 'classroom'), row('b', 'text'), row('c')]} />
        </MemoryRouter>
      </I18nextProvider>,
    )
    const modes = [...document.querySelectorAll('[data-help-mode]')].map((node) => [node.getAttribute('data-help-mode'), node.textContent])
    expect(modes).toEqual([
      ['classroom', de.helpMode.classroom],
      ['text', de.helpMode.text],
      ['text', de.helpMode.text],
    ])
  })
})

describe('the teacher’s request page, by mode', () => {
  function detail(status: TeacherHelpStatus, mode?: HelpMode) {
    return {
      requestId: 'r1', conversationId: 'c1', student: { id: 's1', name: 'Lea', grade: '8' },
      subject: 'mathematics', status, mode, messages: [], notes: [],
    } as never
  }
  const ACCEPT = { name: de.detail.accept.button }
  const ENTER = { name: de.detail.enterClassroom }
  const REPLY = de.detail.replyTitle

  it('offered: one button, accepting, which goes nowhere', async () => {
    vi.mocked(teacherApi.getTeacherHelpRequestDetail).mockResolvedValue(detail('pending', 'classroom'))
    vi.mocked(teacherApi.updateTeacherHelpRequestStatus).mockImplementation(async () => {
      vi.mocked(teacherApi.getTeacherHelpRequestDetail).mockResolvedValue(detail('in_progress', 'classroom'))
      return { requestId: 'r1', status: 'in_progress' } as never
    })
    render(wrap(<TeacherHelpRequestDetailPage />))

    expect(await screen.findAllByRole('button', ACCEPT)).toHaveLength(1)
    expect(screen.getByText(de.detail.accept.bodyClassroom)).toBeInTheDocument()
    expect(screen.queryByRole('link', ENTER)).toBeNull()
    expect(screen.getByText(de.helpMode.classroom)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', ACCEPT))
    // Accepted, a classroom request is answered in the classroom, not here.
    expect(await screen.findByRole('link', ENTER)).toHaveAttribute('href', '/classroom/c1?request=r1')
    expect(screen.queryByLabelText(REPLY)).toBeNull()
  })

  it.each([['text'], [undefined]] as const)('accepted text request (mode %s): the reply box, no classroom', async (mode) => {
    vi.mocked(teacherApi.getTeacherHelpRequestDetail).mockResolvedValue(detail('in_progress', mode))
    render(wrap(<TeacherHelpRequestDetailPage />))

    expect(await screen.findByLabelText(REPLY)).toBeInTheDocument()
    expect(screen.queryByRole('link', ENTER)).toBeNull()
    expect(screen.queryByRole('button', ACCEPT)).toBeNull()
  })

  it('a resolved classroom request still takes its teacher’s follow-up here', async () => {
    vi.mocked(teacherApi.getTeacherHelpRequestDetail).mockResolvedValue(detail('resolved', 'classroom'))
    render(wrap(<TeacherHelpRequestDetailPage />))
    expect(await screen.findByLabelText(REPLY)).toBeInTheDocument()
    expect(screen.queryByRole('link', ENTER)).toBeNull()
  })

  it('a reply refused as not accepted on a stale copy offers accepting once', async () => {
    vi.mocked(teacherApi.getTeacherHelpRequestDetail).mockResolvedValue(detail('in_progress', 'text'))
    const { ApiError } = await import('@/services/api/httpClient')
    vi.mocked(teacherApi.addTeacherHelpRequestNote).mockRejectedValue(
      new ApiError('x', { status: 409, code: 'help_request_not_accepted' }),
    )
    render(wrap(<TeacherHelpRequestDetailPage />))
    await userEvent.type(await screen.findByLabelText(REPLY), 'Hallo')
    await userEvent.click(screen.getByRole('button', { name: 'Antwort senden' }))
    await waitFor(() => expect(screen.getAllByRole('button', ACCEPT)).toHaveLength(1))
  })
})

describe('the student’s notification', () => {
  it('says the classroom one in the reader’s language', () => {
    const event = {
      eventType: 'teacher_takeover', targetType: 'conversation',
      title: 'A teacher joined your conversation', summary: 'A teacher accepted your request. Enter the classroom now.',
    } as const
    expect(notificationText(event, i18n.t)).toEqual(deCommon.notifications.events.takeoverConversationClassroom)
  })
})

describe('the new copy', () => {
  it('is in all four languages; Swiss German without ß; du for students, Sie for teachers', () => {
    const chats = { de: deChat, en: enChat, fr: frChat, it: itChat }
    for (const [language, bundle] of Object.entries(chats)) {
      for (const key of ['choose', 'text', 'classroom', 'cancel', 'hint'] as const) {
        expect(bundle.ask.help.mode[key], `${language} mode.${key}`).toBeTruthy()
      }
      for (const key of ['waiting', 'ready', 'enter', 'biggerScreen'] as const) {
        expect(bundle.ask.help.classroom[key], `${language} classroom.${key}`).toBeTruthy()
      }
    }
    for (const [language, bundle] of Object.entries({ de, en, fr, it: italian })) {
      expect(bundle.helpMode.text, language).toBeTruthy()
      expect(bundle.helpMode.classroom, language).toBeTruthy()
      expect(bundle.detail.accept.bodyClassroom, language).toBeTruthy()
    }
    for (const [language, bundle] of Object.entries({ de: deCommon, en: enCommon, fr: frCommon, it: itCommon })) {
      expect(bundle.notifications.events.takeoverConversationClassroom.summary, language).toBeTruthy()
    }
    const student = JSON.stringify({ mode: deChat.ask.help.mode, classroom: deChat.ask.help.classroom })
    const teacher = JSON.stringify({ mode: de.helpMode, body: de.detail.accept.bodyClassroom })
    expect(student + teacher).not.toMatch(/ß/)
    expect(student).toMatch(/\b(du|dir|dich|deine?)\b/)
    expect(student).not.toMatch(/\bSie\b/)
    expect(teacher).toMatch(/\bSie\b/)
  })
})
