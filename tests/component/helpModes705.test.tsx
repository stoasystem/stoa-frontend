/**
 * #705 (stoa-backend#480, #482): how a student asks to be helped, a text
 * answer or the online classroom. The student always chooses; a way this
 * week's allowance does not allow is shown locked, with why (not switched on:
 * it comes with the online classroom option; used up this week). Every request
 * carries its mode; a request without one is a text answer. A classroom is
 * entered once a teacher accepted, after a word about the microphone. The
 * teacher sees the mode, accepts first, then replies here (text) or goes into
 * the classroom (classroom), and finishes with one "Mark resolved".
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
import { blockedKeyOf, requestErrorKey } from '@/features/ask/teacherHelp/useTeacherHelp'
import { askForMicrophone, readMicPermission } from '@/features/classroom/micPermission'
import { notificationText } from '@/lib/notificationCopy'
import { TeacherHelpRequestDetailPage } from '@/pages/teacher/TeacherHelpRequestDetailPage'
import { ApiError, httpClient } from '@/services/api/httpClient'
import * as teacherApi from '@/services/teacher/teacherApi'
import { createTeacherHelpRequest } from '@/services/teacherHelp/teacherHelpApi'
import type { TeacherHelpRequestSummary } from '@/types/teacher'
import {
  helpModeOf,
  type HelpMode,
  type TeacherHelpRequest,
  type TeacherHelpStatus,
  type TeacherSupportModeStanding,
  type TeacherSupportStanding,
} from '@/types/teacherHelp'

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
vi.mock('@/features/classroom/micPermission', () => ({
  readMicPermission: vi.fn(),
  askForMicrophone: vi.fn(),
}))

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
  vi.mocked(readMicPermission).mockResolvedValue('granted')
  vi.mocked(askForMicrophone).mockResolvedValue(true)
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

const way = (
  canRequest: boolean,
  remainingCases: number,
  weeklyCases: number,
  blockedReason: TeacherSupportModeStanding['blockedReason'] = null,
): TeacherSupportModeStanding => ({ canRequest, remainingCases, weeklyCases, blockedReason, resetsAt: null })

/** This week's standing as stoa-backend#482 sends it: the top level is the text answer. */
const standing = (text: TeacherSupportModeStanding, classroom?: TeacherSupportModeStanding): TeacherSupportStanding => ({
  ...text,
  text,
  ...(classroom ? { classroom } : {}),
})

const TEACHER_SUPPORTED = standing(way(true, 2, 2), way(false, 0, 0, 'teacher_support_not_included'))
const ONLINE_CLASSROOM = standing(way(true, 2, 2), way(true, 1, 2))
const CLASSROOM_USED_UP = standing(way(true, 1, 2), way(false, 0, 2, 'teacher_support_allowance_exhausted'))
const TEXT_USED_UP = standing(way(false, 0, 2, 'teacher_support_allowance_exhausted'), way(true, 2, 2))

describe('"Ask a teacher"', () => {
  const action = (props: { onRequest: (mode: HelpMode) => void; support?: TeacherSupportStanding | null; suggested?: boolean }) =>
    render(
      <I18nextProvider i18n={i18n}>
        <TeacherHelpAction requesting={false} teachersOnline support={null} {...props} />
      </I18nextProvider>,
    )
  const option = (mode: HelpMode) => document.querySelector<HTMLButtonElement>(`[data-help-mode-option="${mode}"]`)!
  const open = () => userEvent.click(screen.getByRole('button', { name: deChat.ask.help.request }))

  it('always asks how first: both ways, focus on the first', async () => {
    const onRequest = vi.fn()
    action({ onRequest })
    await open()
    expect(onRequest).not.toHaveBeenCalled()
    expect(screen.getByRole('group', { name: deChat.ask.help.mode.choose })).toBeInTheDocument()
    expect(option('text')).toHaveFocus()
    expect(option('classroom')).not.toHaveAttribute('aria-disabled')

    await userEvent.click(option('classroom'))
    expect(onRequest).toHaveBeenCalledWith('classroom')
  })

  it('Teacher supported: the classroom is locked with the upgrade, a text answer is asked', async () => {
    const onRequest = vi.fn()
    action({ onRequest, support: TEACHER_SUPPORTED })
    await open()
    expect(option('classroom')).toHaveAttribute('aria-disabled', 'true')
    expect(option('classroom')).toHaveAccessibleDescription(expect.stringContaining(deChat.ask.help.mode.classroomUpgrade))
    expect(option('text')).toHaveAccessibleDescription(expect.stringContaining('Diese Woche noch 2'))

    await userEvent.click(option('classroom'))
    expect(onRequest).not.toHaveBeenCalled()
    await userEvent.click(option('text'))
    expect(onRequest).toHaveBeenCalledWith('text')
  })

  it('this week’s classrooms used up: said, and locked', async () => {
    action({ onRequest: vi.fn(), support: CLASSROOM_USED_UP })
    await open()
    expect(option('classroom')).toHaveAttribute('aria-disabled', 'true')
    expect(option('classroom')).toHaveAccessibleDescription(expect.stringContaining(deChat.ask.help.mode.usedUp))
    expect(option('classroom')).not.toHaveAccessibleDescription(expect.stringContaining(deChat.ask.help.mode.classroomUpgrade))
  })

  it('text answers used up but a classroom left: the button stays, focus on the classroom', async () => {
    action({ onRequest: vi.fn(), support: TEXT_USED_UP })
    await open()
    expect(option('text')).toHaveAttribute('aria-disabled', 'true')
    expect(option('classroom')).toHaveFocus()
  })

  it('can be called off without asking, focus back on the button', async () => {
    const onRequest = vi.fn()
    action({ onRequest })
    await open()
    await userEvent.click(screen.getByRole('button', { name: deChat.ask.help.mode.cancel }))
    expect(onRequest).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: deChat.ask.help.request })).toHaveFocus()
  })

  it('a suggesting card counts each way on its own, the missing one as an upgrade', () => {
    action({ onRequest: vi.fn(), support: TEACHER_SUPPORTED, suggested: true })
    expect(document.querySelector('[data-help-remaining]')?.textContent).toBe(
      'Diese Woche: Textantwort noch 2 · Online-Klassenzimmer mit der Option Online-Klassenzimmer',
    )
  })

  it('… and both counts with the classroom', async () => {
    await i18n.changeLanguage('en')
    action({ onRequest: vi.fn(), support: ONLINE_CLASSROOM, suggested: true })
    expect(document.querySelector('[data-help-remaining]')?.textContent).toBe('This week: Text answer 2 left · Online classroom 1 left')
  })

  it('an older server without the classroom keeps the one count', () => {
    action({ onRequest: vi.fn(), support: way(true, 2, 3), suggested: true })
    expect(document.querySelector('[data-help-remaining]')?.textContent).toBe('Diese Woche noch 2 Anfragen an eine Lehrperson')
  })
})

describe('when "Ask a teacher" is greyed', () => {
  it('only when neither way can be asked', () => {
    expect(blockedKeyOf(TEACHER_SUPPORTED, false)).toBeNull()
    expect(blockedKeyOf(TEXT_USED_UP, false)).toBeNull()
    expect(blockedKeyOf(CLASSROOM_USED_UP, false)).toBeNull()
    expect(blockedKeyOf(null, false)).toBeNull()
    // Neither switched on: as before.
    const none = standing(way(false, 0, 0, 'teacher_support_not_included'), way(false, 0, 0, 'teacher_support_not_included'))
    expect(blockedKeyOf(none, false)).toBe('teacher.errors.planDenied')
    // Text used up, no classroom: used up is what comes back.
    const textGone = standing(way(false, 0, 2, 'teacher_support_allowance_exhausted'), way(false, 0, 0, 'teacher_support_not_included'))
    expect(blockedKeyOf(textGone, false)).toBe('teacher.errors.allowanceExhausted')
    // An older server: the text answer alone decides, as before.
    expect(blockedKeyOf(way(false, 0, 2, 'teacher_support_allowance_exhausted'), false)).toBe('teacher.errors.allowanceExhausted')
    expect(blockedKeyOf(ONLINE_CLASSROOM, true)).toBe('ask.help.usagePeriodPaused')
  })

  it('a classroom refused says so of the classroom, not of teacher help', () => {
    const refused = (code: string) => new ApiError('x', { status: 403, code })
    expect(requestErrorKey(refused('teacher_support_not_included'), 'classroom')).toBe('ask.help.classroom.notIncluded')
    expect(requestErrorKey(refused('teacher_support_allowance_exhausted'), 'classroom')).toBe('ask.help.classroom.usedUp')
    expect(requestErrorKey(refused('teacher_support_not_included'), 'text')).toBe('teacher.errors.planDenied')
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

  const MIC = deChat.ask.help.classroom.mic

  it('offers the classroom once a teacher accepted; a microphone allowed before goes straight in', async () => {
    const enter = card('in_progress', 'classroom')
    expect(screen.getByText(deChat.ask.help.classroom.ready)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', ENTER))
    await waitFor(() => expect(enter).toHaveBeenCalled())
    expect(askForMicrophone).not.toHaveBeenCalled()
    expect(screen.queryByText(MIC.title)).toBeNull()
  })

  it('not asked yet: says the browser will ask, asks on "Continue", then goes in', async () => {
    vi.mocked(readMicPermission).mockResolvedValue('prompt')
    const enter = card('in_progress', 'classroom')
    await userEvent.click(screen.getByRole('button', ENTER))
    expect(await screen.findByRole('group', { name: MIC.title })).toBeInTheDocument()
    expect(screen.getByText(MIC.body)).toBeInTheDocument()
    expect(enter).not.toHaveBeenCalled()
    expect(askForMicrophone).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: MIC.continue })).toHaveFocus()

    await userEvent.click(screen.getByRole('button', { name: MIC.continue }))
    await waitFor(() => expect(enter).toHaveBeenCalled())
    expect(askForMicrophone).toHaveBeenCalledTimes(1)
  })

  it('goes in even when the browser then refuses: the classroom says so again', async () => {
    vi.mocked(readMicPermission).mockResolvedValue('prompt')
    vi.mocked(askForMicrophone).mockResolvedValue(false)
    const enter = card('in_progress', 'classroom')
    await userEvent.click(screen.getByRole('button', ENTER))
    await userEvent.click(await screen.findByRole('button', { name: MIC.continue }))
    await waitFor(() => expect(enter).toHaveBeenCalled())
  })

  it('refused already: says where to turn it on, and goes in without it', async () => {
    vi.mocked(readMicPermission).mockResolvedValue('denied')
    const enter = card('in_progress', 'classroom')
    await userEvent.click(screen.getByRole('button', ENTER))
    expect(await screen.findByRole('group', { name: MIC.deniedTitle })).toBeInTheDocument()
    expect(screen.getByText(MIC.deniedBody)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: MIC.withoutMic }))
    expect(enter).toHaveBeenCalled()
    expect(askForMicrophone).not.toHaveBeenCalled()
  })

  it('"Not now" puts the word away, focus back on the way in', async () => {
    vi.mocked(readMicPermission).mockResolvedValue('prompt')
    const enter = card('in_progress', 'classroom')
    await userEvent.click(screen.getByRole('button', ENTER))
    await userEvent.click(await screen.findByRole('button', { name: MIC.cancel }))
    expect(screen.getByRole('button', ENTER)).toHaveFocus()
    expect(enter).not.toHaveBeenCalled()
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
  const RESOLVE = { name: de.markResolved }

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

    // Before accepting: read only, nothing to finish yet.
    expect(screen.queryByRole('button', RESOLVE)).toBeNull()

    await userEvent.click(screen.getByRole('button', ACCEPT))
    // Accepted, a classroom request is answered in the classroom, not here.
    expect(await screen.findByRole('link', ENTER)).toHaveAttribute('href', '/classroom/c1?request=r1')
    expect(screen.queryByLabelText(REPLY)).toBeNull()
    expect(vi.mocked(teacherApi.updateTeacherHelpRequestStatus).mock.calls[0]?.[0]).toEqual({ requestId: 'r1', status: 'in_progress' })
    // Finished from the classroom section, with one button and no note.
    const section = document.querySelector('[data-classroom-help]')!
    expect(section).toHaveTextContent(de.detail.classroomHelp.body)
    expect(screen.getAllByRole('button', RESOLVE)).toHaveLength(1)
    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it('accepted: no "Start review", no closing note, one "Mark resolved" that sends only the status', async () => {
    vi.mocked(teacherApi.getTeacherHelpRequestDetail).mockResolvedValue(detail('in_progress', 'text'))
    vi.mocked(teacherApi.updateTeacherHelpRequestStatus).mockResolvedValue({ requestId: 'r1', status: 'resolved' } as never)
    render(wrap(<TeacherHelpRequestDetailPage />))
    await screen.findByLabelText(REPLY)
    expect(screen.queryByRole('button', { name: /Start review|Prüfung starten/i })).toBeNull()
    expect(screen.queryByLabelText(/Abschlussnotiz|Resolution note/i)).toBeNull()
    expect(screen.getAllByRole('button', RESOLVE)).toHaveLength(1)
    await userEvent.click(screen.getByRole('button', RESOLVE))
    await waitFor(() =>
      expect(vi.mocked(teacherApi.updateTeacherHelpRequestStatus).mock.calls[0]?.[0]).toEqual({ requestId: 'r1', status: 'resolved' }),
    )
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
      for (const key of ['choose', 'text', 'classroom', 'cancel', 'usedUp', 'classroomUpgrade', 'notIncluded', 'left_one', 'left_other'] as const) {
        expect(bundle.ask.help.mode[key], `${language} mode.${key}`).toBeTruthy()
      }
      expect(bundle.ask.help.mode.about.text, language).toBeTruthy()
      expect(bundle.ask.help.mode.about.classroom, language).toBeTruthy()
      for (const key of ['waiting', 'ready', 'enter', 'biggerScreen', 'notIncluded', 'usedUp'] as const) {
        expect(bundle.ask.help.classroom[key], `${language} classroom.${key}`).toBeTruthy()
      }
      for (const key of ['title', 'body', 'deniedTitle', 'deniedBody', 'continue', 'withoutMic', 'cancel'] as const) {
        expect(bundle.ask.help.classroom.mic[key], `${language} classroom.mic.${key}`).toBeTruthy()
      }
    }
    for (const [language, bundle] of Object.entries({ de, en, fr, it: italian })) {
      expect(bundle.helpMode.text, language).toBeTruthy()
      expect(bundle.helpMode.classroom, language).toBeTruthy()
      expect(bundle.detail.accept.bodyClassroom, language).toBeTruthy()
      expect(bundle.detail.classroomHelp.title, language).toBeTruthy()
      expect(bundle.detail.classroomHelp.body, language).toBeTruthy()
      expect(bundle.detail.resolveHint, language).toBeTruthy()
    }
    for (const [language, bundle] of Object.entries({ de: deCommon, en: enCommon, fr: frCommon, it: itCommon })) {
      expect(bundle.notifications.events.takeoverConversationClassroom.summary, language).toBeTruthy()
    }
    const student = JSON.stringify({ mode: deChat.ask.help.mode, classroom: deChat.ask.help.classroom })
    const teacher = JSON.stringify({ mode: de.helpMode, body: de.detail.accept.bodyClassroom, classroom: de.detail.classroomHelp, hint: de.detail.resolveHint })
    expect(student + teacher).not.toMatch(/ß/)
    expect(student).toMatch(/\b(du|dir|dich|deine?)\b/)
    expect(student).not.toMatch(/\bSie\b/)
    expect(teacher).toMatch(/\bSie\b/)
  })
})
