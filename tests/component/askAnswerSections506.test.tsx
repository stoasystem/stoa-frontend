/**
 * An Ask answer in its sections (#506, stoa-backend#132), driven through the
 * real panel with only the API answered here: the steps and the answer at
 * once, the hints and the similar exercises opened one at a time, the related
 * knowledge points as labels; "I don't get this step" quoting that step; "Ask
 * a teacher" only under an answer that suggests one, greyed when the week's
 * requests are used up. An answer from before the sections, and a follow-up,
 * show their text as they always did. Laid out the same whether the answer
 * was read back or has just been written.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AskHost } from '@/features/ask/AskHost'
import { helpOfferedUnder } from '@/features/ask/AskPanel'
import i18n from '@/i18n'
import { ApiError } from '@/services/api/httpClient'
import { resetAsk } from '@/store/askStore'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { ChatMessage, ChatStreamEvent, Conversation, StructuredAnswer } from '@/types/chat'
import type { TeacherSupportStanding } from '@/types/teacherHelp'

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
const availabilityMock = vi.mocked(getTeacherAvailability)
const requestHelpMock = vi.mocked(createTeacherHelpRequest)

const SECTIONS: StructuredAnswer = {
  kind: 'answer',
  steps: ['Subtract 5 on both sides: 3x = 15.', 'Divide both sides by 3.'],
  answer: 'x = 5',
  hints: ['What undoes the + 5?', 'What undoes the · 3?'],
  similarExercises: ['Solve 2x + 4 = 10.'],
  knowledgePoints: [{ name: 'Linear equations', unitId: null }, { name: 'Inverse operations', unitId: 'u-inverse' }],
  suggestTeacher: false,
}

/** The joined text the backend keeps beside the sections: numbered steps, the answer and the first hint. */
const JOINED = '1. Subtract 5 on both sides: 3x = 15.\n2. Divide both sides by 3.\n\nx = 5\n\nHint: What undoes the + 5?'

function message(id: string, role: ChatMessage['role'], content: string, extra: Partial<ChatMessage> = {}): ChatMessage {
  return { id, conversationId: 'c1', role, content, createdAt: '2026-10-29T10:00:00.000Z', status: 'completed', ...extra }
}

function answer(id: string, structured: StructuredAnswer | null, content = JOINED) {
  return message(id, 'assistant', content, { structured })
}

function conversation(messages: ChatMessage[]): Conversation {
  return { id: 'c1', title: 'Linear equations', subject: 'math', grade: '8', updatedAt: '2026-10-29T10:00:00.000Z', messages }
}

function support(overrides: Partial<TeacherSupportStanding> = {}): TeacherSupportStanding {
  return { canRequest: true, remainingCases: 2, weeklyCases: 3, blockedReason: null, resetsAt: null, ...overrides }
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

function thread(ask: ReturnType<typeof openAsk>) {
  return within(ask.getByRole('log', { name: 'Messages' }))
}

function bubble(ask: ReturnType<typeof openAsk>, id: string) {
  const node = thread(ask).getAllByText((_, element) => element?.getAttribute('data-quote-id') === id)[0]
  return within(node)
}

function announcer() {
  return document.querySelector('[data-ask-announcer]') as HTMLElement
}

beforeEach(async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
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
  useAuthStore.setState({
    user: { id: 'u-1', name: 'Lina Meier', email: 'lina@example.com', role: 'student' } as CurrentUser,
    accessToken: 'token',
    isAuthenticated: true,
  })
  resetAsk()
  vi.mocked(getConversations).mockResolvedValue({ items: [] })
  availabilityMock.mockResolvedValue({ online: true, availableTeachers: 2 })
  vi.mocked(getTeacherHelpRequest).mockRejectedValue(new ApiError('never escalated', { status: 404 }))
})

const originalMatchMedia = window.matchMedia
afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
  sessionStorage.clear()
  window.matchMedia = originalMatchMedia
})

describe('an answer read back in its sections', () => {
  it('shows the steps and the answer at once, and keeps the hints and the exercises closed', async () => {
    getConversationMock.mockResolvedValue(conversation([message('s1', 'student', 'Solve 3x + 5 = 20.'), answer('a1', SECTIONS)]))
    const ask = openAsk()

    const steps = await thread(ask).findByRole('list', { name: 'Steps' })
    expect(within(steps).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      expect.stringContaining('Subtract 5 on both sides: 3x = 15.'),
      expect.stringContaining('Divide both sides by 3.'),
    ])
    expect(thread(ask).getByText('x = 5')).toBeInTheDocument()
    // The joined text is not shown as well: the first hint stays closed.
    expect(thread(ask).queryByText('What undoes the + 5?')).not.toBeInTheDocument()
    expect(thread(ask).queryByText(/Hint: What undoes/)).not.toBeInTheDocument()
    expect(thread(ask).queryByText('Solve 2x + 4 = 10.')).not.toBeInTheDocument()

    const related = thread(ask).getByRole('list', { name: 'Related topics' })
    expect(within(related).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Linear equations',
      'Inverse operations',
    ])
    // The way to a star is #487's: until Ask is given it, a label leads nowhere.
    expect(within(related).queryByRole('button')).not.toBeInTheDocument()
  })

  it('opens the hints one at a time, and moves the keyboard onto the last one', async () => {
    getConversationMock.mockResolvedValue(conversation([answer('a1', SECTIONS)]))
    const ask = openAsk()

    const show = await thread(ask).findByRole('button', { name: 'Show a hint' })
    await userEvent.click(show)
    const hints = thread(ask).getByRole('list', { name: 'Hints' })
    expect(within(hints).getAllByRole('listitem').map((item) => item.textContent)).toEqual(['What undoes the + 5?'])
    expect(hints).toHaveAttribute('aria-live', 'polite')
    // The keyboard stays on the button while there is more to open.
    expect(show).toHaveFocus()
    expect(show).toHaveAccessibleName('Another hint')

    await userEvent.keyboard('{Enter}')
    expect(within(hints).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'What undoes the + 5?',
      'What undoes the · 3?',
    ])
    expect(thread(ask).queryByRole('button', { name: 'Another hint' })).not.toBeInTheDocument()
    await waitFor(() => expect(within(hints).getAllByRole('listitem')[1]).toHaveFocus())

    await userEvent.click(thread(ask).getByRole('button', { name: 'One more to practise' }))
    expect(thread(ask).getByRole('list', { name: 'Practice' })).toHaveTextContent('Solve 2x + 4 = 10.')
  })

  it('shows an answer from before the sections, and a follow-up, as their text', async () => {
    getConversationMock.mockResolvedValue(
      conversation([
        answer('a-old', null, 'An older answer, in one piece.'),
        message('s2', 'student', 'Why divide?'),
        // A follow-up has nothing in the list sections, and may still have its words as `answer`.
        answer(
          'a-follow',
          { kind: 'followUp', steps: [], answer: 'Because 3x means 3 · x.', hints: [], similarExercises: [], knowledgePoints: [] },
          'Because 3x means 3 · x.',
        ),
      ]),
    )
    const ask = openAsk()

    expect(await thread(ask).findByText('An older answer, in one piece.')).toBeInTheDocument()
    expect(thread(ask).getByText('Because 3x means 3 · x.')).toBeInTheDocument()
    expect(thread(ask).queryByRole('list', { name: 'Steps' })).not.toBeInTheDocument()
    expect(document.querySelector('[data-answer-sections]')).toBeNull()
  })

  it('says its sections in German', async () => {
    await i18n.changeLanguage('de')
    getConversationMock.mockResolvedValue(conversation([answer('a1', SECTIONS)]))
    render(
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <MemoryRouter initialEntries={['/ask/c1']}>
            <AskHost route={{ conversationId: 'c1' }} />
          </MemoryRouter>
        </QueryClientProvider>
      </I18nextProvider>,
    )
    expect(await screen.findByRole('list', { name: 'Schritte' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tipp zeigen' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Diesen Schritt verstehe ich nicht (Schritt 1)' })).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/ask\.answer\./)
  })
})

describe('an answer just written', () => {
  it('shows the text while it is written and its sections once it ends, before the conversation is read back', async () => {
    let reads = 0
    let releaseReadBack!: () => void
    const readBack = new Promise<void>((resolve) => {
      releaseReadBack = resolve
    })
    getConversationMock.mockImplementation(async () => {
      reads += 1
      if (reads > 1) await readBack
      return conversation(reads > 1 ? [message('student:c1:x', 'student', 'Solve 3x + 5 = 20.'), answer('a-new', SECTIONS)] : [])
    })
    progressMock.mockResolvedValue({ conversationId: 'c1', steps: [], updatedAt: new Date().toISOString(), status: 'ai_running' })
    let finish!: () => void
    const finished = new Promise<void>((resolve) => {
      finish = resolve
    })
    streamMock.mockImplementation(async ({ onEvent }: { onEvent: (event: ChatStreamEvent) => void }) => {
      onEvent({ type: 'message_start', messageId: 'a-new', role: 'assistant', createdAt: new Date().toISOString() })
      onEvent({ type: 'message_delta', messageId: 'a-new', delta: '1. Subtract 5 on both sides' })
      await finished
      onEvent({ type: 'message_done', messageId: 'a-new', status: 'completed', structured: SECTIONS })
      return 'streamed'
    })
    const ask = openAsk()
    await ask.findByText('Linear equations')

    await userEvent.type(ask.getByRole('textbox', { name: 'Your question' }), 'Solve 3x + 5 = 20.{Enter}')
    expect(await thread(ask).findByText('1. Subtract 5 on both sides')).toBeInTheDocument()
    expect(thread(ask).queryByRole('list', { name: 'Steps' })).not.toBeInTheDocument()

    await act(async () => finish())
    const steps = await thread(ask).findByRole('list', { name: 'Steps' })
    expect(steps).toHaveTextContent('Divide both sides by 3.')
    // Read out as it is shown: the steps and the answer, not the hint.
    await waitFor(() => expect(announcer()).toHaveTextContent('Divide both sides by 3.'))
    expect(announcer()).not.toHaveTextContent('What undoes')
    expect(reads).toBe(2)

    await act(async () => releaseReadBack())
    expect(await thread(ask).findByRole('list', { name: 'Steps' })).toBeInTheDocument()
  })
})

describe("I don't get this step", () => {
  it('quotes that step of the answer, with a question the student can send as it is', async () => {
    getConversationMock.mockResolvedValue(conversation([message('s1', 'student', 'Solve 3x + 5 = 20.'), answer('a1', SECTIONS)]))
    progressMock.mockResolvedValue({ conversationId: 'c1', steps: [], updatedAt: new Date().toISOString(), status: 'completed' })
    streamMock.mockResolvedValue('streamed')
    const ask = openAsk()

    await userEvent.click(await thread(ask).findByRole('button', { name: "I don't get this step (Step 2)" }))

    const pending = document.querySelector('[data-ask-pending-quote]') as HTMLElement
    expect(pending).toHaveTextContent('Quoted · Step 2')
    expect(pending).toHaveTextContent('Divide both sides by 3.')
    const composer = ask.getByRole('textbox', { name: 'Your question' })
    expect(composer).toHaveValue("I don't get this step. Can you explain it another way?")
    expect(composer).toHaveFocus()

    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(streamMock).toHaveBeenCalled())
    expect(streamMock.mock.calls[0][0].payload).toMatchObject({
      content: "I don't get this step. Can you explain it another way?",
      quote: {
        text: 'Divide both sides by 3.',
        source: { kind: 'message', id: 'a1', part: { section: 'steps', index: 1 } },
      },
    })
    // Only the two keys the backend takes.
    expect(Object.keys(streamMock.mock.calls[0][0].payload.quote ?? {}).sort()).toEqual(['source', 'text'])
  })

  it('keeps what the student already started to write', async () => {
    getConversationMock.mockResolvedValue(conversation([answer('a1', SECTIONS)]))
    const ask = openAsk()
    const composer = await ask.findByRole('textbox', { name: 'Your question' })
    await userEvent.type(composer, 'Why by 3')

    await userEvent.click(await thread(ask).findByRole('button', { name: "I don't get this step (Step 1)" }))
    expect(composer).toHaveValue('Why by 3')
    expect(document.querySelector('[data-ask-pending-quote]')).toHaveTextContent('Quoted · Step 1')
  })
})

describe('Ask a teacher', () => {
  it('is offered only under an answer that suggests a teacher', async () => {
    getConversationMock.mockResolvedValue(conversation([answer('a1', SECTIONS)]))
    const ask = openAsk()
    await thread(ask).findByRole('list', { name: 'Steps' })
    expect(ask.queryByRole('button', { name: 'Ask a teacher' })).not.toBeInTheDocument()
  })

  it('sits under the answer that suggested it, also once a follow-up came after it', async () => {
    getConversationMock.mockResolvedValue(
      conversation([
        answer('a1', { ...SECTIONS, suggestTeacher: true }),
        message('s2', 'student', 'Why divide?'),
        answer('a2', { kind: 'followUp', suggestTeacher: false }, 'Because 3x means 3 · x.'),
      ]),
    )
    const ask = openAsk()
    await thread(ask).findByText('Because 3x means 3 · x.')
    const button = await ask.findByRole('button', { name: 'Ask a teacher' })
    expect(bubble(ask, 'a1').getByText('x = 5').closest('[data-message-role]')).toContainElement(button)
  })

  it('is still offered under the latest answer from before the sections', () => {
    expect(helpOfferedUnder([answer('a1', null)])).toBe('a1')
    expect(helpOfferedUnder([answer('a1', { ...SECTIONS, suggestTeacher: true }), answer('a2', null)])).toBe('a2')
    expect(helpOfferedUnder([answer('a1', null), answer('a2', SECTIONS)])).toBeNull()
    expect(helpOfferedUnder([answer('a1', { ...SECTIONS, suggestTeacher: true }), answer('a2', SECTIONS, '')])).toBe('a1')
    expect(
      helpOfferedUnder([answer('a1', { ...SECTIONS, suggestTeacher: true }), message('a2', 'assistant', '', { status: 'streaming' })]),
    ).toBeNull()
  })

  it('asks for help in this conversation and reads the week’s allowance again at once', async () => {
    availabilityMock.mockResolvedValue({ online: true, availableTeachers: 2, teacherSupport: support() })
    getConversationMock.mockResolvedValue(conversation([answer('a1', { ...SECTIONS, suggestTeacher: true })]))
    requestHelpMock.mockResolvedValue({
      requestId: 'r1',
      conversationId: 'c1',
      status: 'pending',
      createdAt: '2026-10-29T10:00:00.000Z',
    })
    const ask = openAsk()

    expect(await ask.findByText('2 teacher requests left this week')).toBeInTheDocument()
    const reads = availabilityMock.mock.calls.length
    await userEvent.click(ask.getByRole('button', { name: 'Ask a teacher' }))

    await waitFor(() => expect(requestHelpMock).toHaveBeenCalledWith({ conversationId: 'c1' }))
    await waitFor(() => expect(availabilityMock.mock.calls.length).toBeGreaterThan(reads))
  })

  it('is greyed with the reason once the week’s requests are used up', async () => {
    availabilityMock.mockResolvedValue({
      online: true,
      availableTeachers: 2,
      teacherSupport: support({
        canRequest: false,
        remainingCases: 0,
        blockedReason: 'teacher_support_allowance_exhausted',
        resetsAt: '2026-11-02T00:00:00+01:00',
      }),
    })
    getConversationMock.mockResolvedValue(conversation([answer('a1', { ...SECTIONS, suggestTeacher: true })]))
    const ask = openAsk()

    const button = await ask.findByRole('button', { name: 'Ask a teacher' })
    await waitFor(() => expect(button).toBeDisabled())
    expect(button).toHaveAccessibleDescription(
      "This week's teacher requests are used up. They become available again next week.",
    )
    expect(ask.queryByText(/left this week/)).not.toBeInTheDocument()
  })

  it('says nothing of an allowance it could not read, and answers a refusal in words', async () => {
    availabilityMock.mockResolvedValue({ online: true, availableTeachers: 2, teacherSupport: null })
    getConversationMock.mockResolvedValue(conversation([answer('a1', { ...SECTIONS, suggestTeacher: true })]))
    requestHelpMock.mockRejectedValue(new ApiError('exhausted', { status: 429 }))
    const ask = openAsk()

    const button = await ask.findByRole('button', { name: 'Ask a teacher' })
    expect(ask.queryByText(/left this week/)).not.toBeInTheDocument()
    const reads = availabilityMock.mock.calls.length
    await userEvent.click(button)
    expect(await ask.findByRole('alert')).toHaveTextContent('This week\'s teacher requests are used up.')
    await waitFor(() => expect(availabilityMock.mock.calls.length).toBeGreaterThan(reads))
  })
})
