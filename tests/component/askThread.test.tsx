/**
 * Ask's conversation (#49; #12 point 2), driven through the real panel with
 * only the API answered here: a message is sent asynchronously (202, then the
 * command read at `/generation` until it ends), survives a reload, and can be
 * sent again after it failed; a teacher's help shows exactly what the server
 * says, and a teacher's reply reaches the thread while that help is open.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AskHost } from '@/features/ask/AskHost'
import i18n from '@/i18n'
import { ApiError } from '@/services/api/httpClient'
import { resetAsk, useAskStore } from '@/store/askStore'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { ChatMessage, Conversation } from '@/types/chat'
import type { TeacherHelpRequest } from '@/types/teacherHelp'

vi.mock('@/services/analytics/analyticsClient', () => ({ trackEvent: vi.fn() }))
vi.mock('@/services/chat/commandMessageIds', () => ({
  commandMessageIds: vi.fn(async (conversationId: string, key: string) => ({
    studentMessageId: `student:${conversationId}:${key}`,
    assistantMessageId: `assistant:${conversationId}:${key}`,
  })),
}))
vi.mock('@/services/chat/chatApi', () => ({
  getConversations: vi.fn(),
  getConversation: vi.fn(),
  createConversation: vi.fn(),
}))
vi.mock('@/services/chat/chatStreamApi', () => ({
  streamConversationMessage: vi.fn(),
  getGenerationProgress: vi.fn(),
}))
vi.mock('@/services/teacherHelp/teacherHelpApi', () => ({
  getTeacherAvailability: vi.fn(),
  getTeacherHelpRequest: vi.fn(),
  createTeacherHelpRequest: vi.fn(),
}))
vi.mock('@/services/student/studentApi', () => ({
  getStudentProfile: vi.fn(async () => ({ grade: '8', primarySubjects: ['math'] })),
}))
vi.mock('@/services/learning/memoryApi', () => ({
  getMyMemorySummary: vi.fn(async () => ({ recommendations: [], weakTopics: [] })),
}))

import { getConversation, getConversations } from '@/services/chat/chatApi'
import { getGenerationProgress, streamConversationMessage } from '@/services/chat/chatStreamApi'
import {
  createTeacherHelpRequest,
  getTeacherAvailability,
  getTeacherHelpRequest,
} from '@/services/teacherHelp/teacherHelpApi'

const getConversationMock = vi.mocked(getConversation)
const streamMock = vi.mocked(streamConversationMessage)
const progressMock = vi.mocked(getGenerationProgress)
const helpStatusMock = vi.mocked(getTeacherHelpRequest)
const requestHelpMock = vi.mocked(createTeacherHelpRequest)

const NEVER_ESCALATED = new ApiError('This conversation was never escalated to a teacher', { status: 404 })

function message(id: string, role: ChatMessage['role'], content: string): ChatMessage {
  return { id, conversationId: 'c1', role, content, createdAt: '2026-09-28T10:00:00.000Z', status: 'completed' }
}

function conversation(messages: ChatMessage[]): Conversation {
  return {
    id: 'c1',
    title: 'Linear equations',
    subject: 'math',
    grade: '8',
    updatedAt: '2026-09-28T10:00:00.000Z',
    messages,
  }
}

function help(status: TeacherHelpRequest['status'], teacherName?: string): TeacherHelpRequest {
  return { requestId: 'r1', conversationId: 'c1', status, teacherName, createdAt: '2026-09-28T10:00:00.000Z' }
}

function emulateWidth(width: number) {
  window.matchMedia = ((query: string) => {
    const min = query.match(/min-width:\s*(\d+)px/)
    return {
      matches: !min || width >= Number(min[1]),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }
  }) as typeof window.matchMedia
}

function openAsk() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/ask/c1']}>
          <AskHost route={{ conversationId: 'c1' }} />
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
  return within(screen.getByRole('complementary', { name: 'Ask' }))
}

/** The messages themselves, without the live region that reads replies out. */
function thread(ask: ReturnType<typeof openAsk>) {
  return within(ask.getByRole('log', { name: 'Messages' }))
}

function announcer() {
  return document.querySelector('[data-ask-announcer]') as HTMLElement
}

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

const originalMatchMedia = window.matchMedia

beforeEach(async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  await i18n.changeLanguage('en')
  emulateWidth(1280)
  useAuthStore.setState({
    user: { id: 'u-1', name: 'Lina Meier', email: 'lina@example.com', role: 'student' } as CurrentUser,
    accessToken: 'token',
    isAuthenticated: true,
  })
  resetAsk()
  vi.mocked(getConversations).mockResolvedValue({ items: [] })
  vi.mocked(getTeacherAvailability).mockResolvedValue({ online: true, availableTeachers: 2 })
  helpStatusMock.mockRejectedValue(NEVER_ESCALATED)
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
  sessionStorage.clear()
  window.matchMedia = originalMatchMedia
})

describe('sending a message', () => {
  it('shows the answer once the command ends, after the request only stored the message (202)', async () => {
    let answered = false
    getConversationMock.mockImplementation(async () =>
      conversation(
        answered
          ? [message('s1', 'student', 'Is x = 5?'), message('a1', 'assistant', 'Yes: 3 · 5 + 5 = 20.')]
          : [],
      ),
    )
    streamMock.mockResolvedValue('accepted')
    progressMock.mockImplementation(async () =>
      answered
        ? { conversationId: 'c1', steps: [], updatedAt: new Date().toISOString(), status: 'completed' }
        : { conversationId: 'c1', steps: ['Checking your steps'], updatedAt: '2099-01-01T00:00:00.000Z', status: 'ai_running' },
    )
    const ask = openAsk()
    await ask.findByText('Linear equations')

    await userEvent.type(ask.getByRole('textbox', { name: 'Your question' }), 'Is x = 5?{Enter}')

    expect(await ask.findByText('Is x = 5?')).toBeInTheDocument()
    await advance(1100)
    expect(await ask.findByText('Checking your steps')).toBeInTheDocument()
    // Not read out while it is being written.
    expect(announcer()).toBeEmptyDOMElement()
    expect(streamMock.mock.calls[0][0].payload).toMatchObject({ content: 'Is x = 5?' })

    answered = true
    await advance(3000)
    expect(await thread(ask).findByText('Yes: 3 · 5 + 5 = 20.')).toBeInTheDocument()
    // Read out once, whole, when it is finished.
    expect(announcer()).toHaveTextContent('Yes: 3 · 5 + 5 = 20.')
    expect(ask.queryByText('Checking your steps')).not.toBeInTheDocument()
    // The wait is over: nothing is left for a reload to pick up.
    expect(sessionStorage.getItem('stoa_pending_chat_message:c1')).toBeNull()
  })

  it('picks a message still being answered back up after a reload, without sending it again', async () => {
    sessionStorage.setItem(
      'stoa_pending_chat_message:c1',
      JSON.stringify({ idempotencyKey: 'k-1', content: 'What is a prime?', askedAt: '2026-09-28T10:00:00.000Z' }),
    )
    let answered = false
    getConversationMock.mockImplementation(async () =>
      conversation(
        answered
          ? [message('s1', 'student', 'What is a prime?'), message('a1', 'assistant', 'A number with exactly two divisors.')]
          : [],
      ),
    )
    progressMock.mockImplementation(async () => ({
      conversationId: 'c1',
      steps: [],
      updatedAt: new Date().toISOString(),
      status: answered ? 'completed' : 'ai_running',
    }))
    const ask = openAsk()

    expect(await ask.findByText('What is a prime?')).toBeInTheDocument()
    expect(ask.getByText('Thinking…')).toBeInTheDocument()

    answered = true
    await advance(1100)
    expect(await thread(ask).findByText('A number with exactly two divisors.')).toBeInTheDocument()
    expect(streamMock).not.toHaveBeenCalled()
    expect(progressMock.mock.calls[0][2]).toBe('k-1')
  })

  it('offers to send a failed message again, as the same message', async () => {
    getConversationMock.mockResolvedValue(conversation([]))
    streamMock.mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValue('streamed')
    // The server never stored it: the same key is a first send.
    progressMock.mockRejectedValue(new ApiError('not found', { status: 404, code: 'message_command_not_found' }))
    const ask = openAsk()
    await ask.findByText('Linear equations')

    await userEvent.type(ask.getByRole('textbox', { name: 'Your question' }), 'Why both sides?{Enter}')
    await advance(1100)

    expect(await ask.findByText('Not sent')).toBeInTheDocument()
    await userEvent.click(ask.getByRole('button', { name: 'Send again' }))

    await waitFor(() => expect(streamMock).toHaveBeenCalledTimes(2))
    const [first, second] = streamMock.mock.calls.map(([call]) => call.payload)
    expect(second.content).toBe('Why both sides?')
    expect(second.idempotencyKey).toBe(first.idempotencyKey)
  })
})

describe('the teacher status card', () => {
  it('shows the request as the server reports it, not as the request answered', async () => {
    getConversationMock.mockResolvedValue(
      conversation([message('s1', 'student', 'Is x = 5?'), message('a1', 'assistant', 'Yes.')]),
    )
    // The POST answers one thing; the card must show what the server says when read.
    requestHelpMock.mockImplementation(async () => {
      helpStatusMock.mockResolvedValue(help('pending'))
      return help('in_progress', 'Posted Name')
    })
    const ask = openAsk()
    await ask.findByText('Yes.')
    expect(ask.queryByRole('region', { name: 'Teacher support' })).not.toBeInTheDocument()

    await userEvent.click(ask.getByRole('button', { name: 'Ask a teacher' }))

    const card = await ask.findByRole('region', { name: 'Teacher support' })
    expect(card).toHaveAttribute('data-help-status', 'pending')
    expect(within(card).getByText('Waiting')).toBeInTheDocument()
    expect(within(card).getByText('Teacher support requested')).toBeInTheDocument()
    expect(ask.queryByText(/Posted Name/)).not.toBeInTheDocument()
    // Nothing here lets the student say a teacher joined (#12 point 2).
    expect(ask.queryByRole('button', { name: /joined|confirm/i })).not.toBeInTheDocument()
    // And the request is not offered again while it is open.
    expect(ask.queryByRole('button', { name: 'Ask a teacher' })).not.toBeInTheDocument()
  })

  it('moves on when the server does, pending → assigned → in progress → resolved', async () => {
    getConversationMock.mockResolvedValue(
      conversation([message('s1', 'student', 'Is x = 5?'), message('a1', 'assistant', 'Yes.')]),
    )
    helpStatusMock.mockResolvedValue(help('pending'))
    const ask = openAsk()
    const card = await ask.findByRole('region', { name: 'Teacher support' })
    expect(card).toHaveAttribute('data-help-status', 'pending')

    helpStatusMock.mockResolvedValue(help('assigned', 'Ms Bergmann'))
    await advance(15_100)
    await waitFor(() => expect(card).toHaveAttribute('data-help-status', 'assigned'))
    expect(within(card).getByText('Ms Bergmann will join this conversation')).toBeInTheDocument()

    helpStatusMock.mockResolvedValue(help('in_progress', 'Ms Bergmann'))
    await advance(5_100)
    await waitFor(() => expect(card).toHaveAttribute('data-help-status', 'in_progress'))
    expect(within(card).getByText('Ms Bergmann is helping you')).toBeInTheDocument()

    helpStatusMock.mockResolvedValue(help('resolved', 'Ms Bergmann'))
    await advance(5_100)
    await waitFor(() => expect(card).toHaveAttribute('data-help-status', 'resolved'))
    expect(within(card).getByText('Resolved')).toBeInTheDocument()
    // Ended: a new request can be made under the answer again.
    expect(ask.getByRole('button', { name: 'Ask a teacher' })).toBeInTheDocument()
  })

  // #75: the request is read for every conversation that is opened, not only
  // one escalated while it was open -- including one whose help has ended.
  it.each([
    ['pending', 'Teacher support requested'],
    ['in_progress', 'Ms Bergmann is helping you'],
    ['resolved', 'Teacher support has ended'],
  ] as const)('shows a request already %s when the conversation is opened again', async (status, title) => {
    getConversationMock.mockResolvedValue(
      conversation([
        message('s1', 'student', 'Is x = 5?'),
        message('a1', 'assistant', 'Yes.'),
        message('t1', 'teacher', 'All clear now.'),
      ]),
    )
    helpStatusMock.mockResolvedValue(help(status, 'Ms Bergmann'))
    const ask = openAsk()

    const card = await ask.findByRole('region', { name: 'Teacher support' })
    expect(card).toHaveAttribute('data-help-status', status)
    expect(within(card).getByText(title)).toBeInTheDocument()
    expect(helpStatusMock).toHaveBeenCalledWith('c1')
    expect(requestHelpMock).not.toHaveBeenCalled()
  })

  it('says a request can still be sent while no teacher is online, without a time', async () => {
    vi.mocked(getTeacherAvailability).mockResolvedValue({ online: false, availableTeachers: 0, nextWindow: '16:00' })
    getConversationMock.mockResolvedValue(
      conversation([message('s1', 'student', 'Is x = 5?'), message('a1', 'assistant', 'Yes.')]),
    )
    const ask = openAsk()

    expect(
      await ask.findByText('Teachers are not online right now. When they are back, they will reply here.'),
    ).toBeInTheDocument()
    expect(ask.getByRole('button', { name: 'Ask a teacher' })).toBeEnabled()
    expect(ask.queryByText(/16:00/)).not.toBeInTheDocument()
  })
})

describe('a teacher in the conversation', () => {
  it('appears in the thread, with their name, while help is in progress', async () => {
    helpStatusMock.mockResolvedValue(help('in_progress', 'Ms Bergmann'))
    let replied = false
    getConversationMock.mockImplementation(async () =>
      conversation([
        message('s1', 'student', 'Is x = 5?'),
        message('a1', 'assistant', 'Yes.'),
        ...(replied ? [message('t1', 'teacher', 'Well done - now try 4x − 7 = −19.')] : []),
      ]),
    )
    const ask = openAsk()
    await ask.findByText('Yes.')
    expect(ask.queryByText(/now try 4x/)).not.toBeInTheDocument()

    replied = true
    await advance(5_100)

    const reply = await thread(ask).findByText('Well done - now try 4x − 7 = −19.')
    const bubble = reply.closest('[data-message-role]')
    expect(bubble).toHaveAttribute('data-message-role', 'teacher')
    expect(within(bubble as HTMLElement).getByText('Ms Bergmann')).toBeInTheDocument()
    // Read out with who it is from.
    expect(announcer()).toHaveTextContent('Ms Bergmann: Well done - now try 4x − 7 = −19.')
  })

  it('is not polled for while no help is open', async () => {
    getConversationMock.mockResolvedValue(
      conversation([message('s1', 'student', 'Is x = 5?'), message('a1', 'assistant', 'Yes.')]),
    )
    const ask = openAsk()
    await ask.findByText('Yes.')
    const reads = getConversationMock.mock.calls.length

    await advance(20_000)

    expect(getConversationMock.mock.calls.length).toBe(reads)
  })
})

describe('reading the conversation again', () => {
  it('keeps a reply the teacher sent just before resolving the request', async () => {
    helpStatusMock.mockResolvedValue(help('in_progress', 'Ms Bergmann'))
    let replied = false
    getConversationMock.mockImplementation(async () =>
      conversation([
        message('s1', 'student', 'Is x = 5?'),
        message('a1', 'assistant', 'Yes.'),
        ...(replied ? [message('t1', 'teacher', 'All clear now - good luck!')] : []),
      ]),
    )
    const ask = openAsk()
    await ask.findByText('Yes.')

    // Within one poll window the teacher replies and then resolves.
    await advance(3_000)
    replied = true
    helpStatusMock.mockResolvedValue(help('resolved', 'Ms Bergmann'))
    await advance(2_500)

    await waitFor(() =>
      expect(ask.getByRole('region', { name: 'Teacher support' })).toHaveAttribute('data-help-status', 'resolved'),
    )
    expect(await thread(ask).findByText('All clear now - good luck!')).toBeInTheDocument()
  })

  it('stops once Ask is closed', async () => {
    helpStatusMock.mockResolvedValue(help('in_progress', 'Ms Bergmann'))
    getConversationMock.mockResolvedValue(conversation([message('a1', 'assistant', 'Yes.')]))
    // Opened from the planet, so closing it takes it away rather than leaving the page.
    useAskStore.setState({ ownerId: 'u-1', open: true, conversationId: 'c1' })
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={client}>
          <MemoryRouter>
            <AskHost />
          </MemoryRouter>
        </QueryClientProvider>
      </I18nextProvider>,
    )
    const ask = within(screen.getByRole('complementary', { name: 'Ask' }))
    await ask.findByText('Yes.')
    await advance(5_100)
    expect(getConversationMock.mock.calls.length).toBeGreaterThan(1)

    await userEvent.click(ask.getByRole('button', { name: 'Close' }))
    const conversationReads = getConversationMock.mock.calls.length
    const helpReads = helpStatusMock.mock.calls.length
    await advance(30_000)

    expect(getConversationMock.mock.calls.length).toBe(conversationReads)
    expect(helpStatusMock.mock.calls.length).toBe(helpReads)
  })
})

describe('the scroll position', () => {
  /** jsdom lays nothing out: give the thread a height and track where it is scrolled to. */
  function measure(log: HTMLElement) {
    let top = 0
    Object.defineProperty(log, 'scrollHeight', { configurable: true, get: () => 1000 })
    Object.defineProperty(log, 'clientHeight', { configurable: true, get: () => 300 })
    Object.defineProperty(log, 'scrollTop', {
      configurable: true,
      get: () => top,
      set: (value: number) => {
        top = value
      },
    })
    return { at: () => top, scrollTo: (value: number) => {
      top = value
      fireEvent.scroll(log)
    } }
  }

  async function replyArrives(ask: ReturnType<typeof openAsk>, content: string, state: { replied: boolean }) {
    state.replied = true
    await advance(5_100)
    await thread(ask).findByText(content)
  }

  function setUp() {
    helpStatusMock.mockResolvedValue(help('in_progress', 'Ms Bergmann'))
    const state = { replied: false }
    getConversationMock.mockImplementation(async () =>
      conversation([
        message('a1', 'assistant', 'Yes.'),
        ...(state.replied ? [message('t1', 'teacher', 'A new reply')] : []),
      ]),
    )
    return state
  }

  it('follows a new message while the student reads the latest', async () => {
    const state = setUp()
    const ask = openAsk()
    await ask.findByText('Yes.')
    const log = measure(ask.getByRole('log', { name: 'Messages' }))
    log.scrollTo(700)

    await replyArrives(ask, 'A new reply', state)

    expect(log.at()).toBe(1000)
  })

  it('stays put when the student has scrolled up to read something earlier', async () => {
    const state = setUp()
    const ask = openAsk()
    await ask.findByText('Yes.')
    const log = measure(ask.getByRole('log', { name: 'Messages' }))
    log.scrollTo(100)

    await replyArrives(ask, 'A new reply', state)

    expect(log.at()).toBe(100)
  })
})
