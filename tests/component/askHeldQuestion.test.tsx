/**
 * A question Ask holds back from `POST /conversations` -- one with a quote or
 * a file, which that request cannot carry -- and the quote itself (#263):
 *
 * - the held question goes out once the conversation exists, whether or not
 *   Ask is still open, and after a reload if its request was lost;
 * - it goes into the conversation made for it, never one the student opened
 *   meanwhile;
 * - a quote belongs to the exercise, or the conversation, it was taken from,
 *   and is dropped on leaving it.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AskHost } from '@/features/ask/AskHost'
import { StageWithAsk } from '@/features/chapter/StageAsk'
import { makeQuote, useAskQuoteStore } from '@/features/ask/practiceContext'
import i18n from '@/i18n'
import { readPendingMessage, writePendingMessage } from '@/lib/pendingChatMessages'
import { ApiError } from '@/services/api/httpClient'
import { resetAsk, useAskStore } from '@/store/askStore'
import { type CurrentUser, useAuthStore } from '@/store/authStore'

vi.mock('@/services/analytics/analyticsClient', () => ({ trackEvent: vi.fn() }))
vi.mock('@/services/chat/commandMessageIds', () => ({
  commandMessageIds: vi.fn(async (c: string, k: string) => ({ studentMessageId: `s:${c}:${k}`, assistantMessageId: `a:${c}:${k}` })),
}))
vi.mock('@/services/chat/chatApi', () => ({ getConversations: vi.fn(), getConversation: vi.fn(), createConversation: vi.fn() }))
vi.mock('@/services/chat/chatStreamApi', () => ({ streamConversationMessage: vi.fn(), getGenerationProgress: vi.fn() }))
vi.mock('@/services/teacherHelp/teacherHelpApi', () => ({
  getTeacherAvailability: vi.fn(async () => ({ online: false, availableTeachers: 0 })),
  getTeacherHelpRequest: vi.fn(async () => {
    throw new ApiError('x', { status: 404 })
  }),
  createTeacherHelpRequest: vi.fn(),
}))
vi.mock('@/services/student/studentApi', () => ({ getStudentProfile: vi.fn(async () => ({ grade: '8', primarySubjects: ['math'] })) }))
vi.mock('@/services/learning/memoryApi', () => ({ getMyMemorySummary: vi.fn(async () => ({ recommendations: [], weakTopics: [] })) }))

import { createConversation, getConversation, getConversations } from '@/services/chat/chatApi'
import { getGenerationProgress, streamConversationMessage } from '@/services/chat/chatStreamApi'

function wide() {
  window.matchMedia = ((query: string) => ({
    matches: !/reduce/.test(query),
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  })) as never
}

function conversation(id: string) {
  return { id, title: id, subject: 'math', grade: '8', updatedAt: '2026-10-11T10:00:00Z', messages: [] }
}

function mount(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter>{node}</MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

/** `POST /conversations` held open until the test lets it answer. */
function createHeldOpen() {
  let answer!: (value: unknown) => void
  vi.mocked(createConversation).mockImplementation(
    () => new Promise((resolve) => (answer = resolve)) as never,
  )
  return (id: string) => act(async () => answer(conversation(id)))
}

const exerciseQuote = () => makeQuote('2x + 3 = 7', { kind: 'challenge', id: 'ch-1' })
const practiceOn = (challengeId: string) => ({ context: { unitId: 'u', lessonId: 'l', challengeId } })
/** The practice stage on exercise ch-1, with Ask open beside it. */
const Stage = () => (
  <StageWithAsk practice={practiceOn('ch-1')}>
    <p>exercise</p>
  </StageWithAsk>
)
const sentTo = () => vi.mocked(streamConversationMessage).mock.calls.map(([call]) => call.conversationId)

async function sendFromPanel() {
  const panel = within(screen.getByRole('complementary', { name: 'Ask' }))
  await userEvent.click(panel.getByRole('textbox'))
  await userEvent.keyboard('{Enter}')
  await waitFor(() => expect(createConversation).toHaveBeenCalledTimes(1))
  // `POST /conversations` cannot carry the quote, so it carries no question.
  expect(vi.mocked(createConversation).mock.calls[0][0]).not.toHaveProperty('initialMessage')
  return panel
}

beforeEach(async () => {
  vi.clearAllMocks()
  sessionStorage.clear()
  await i18n.changeLanguage('en')
  wide()
  useAuthStore.setState({
    user: { id: 'u-1', name: 'L', email: 'l@x', role: 'student' } as CurrentUser,
    accessToken: 't',
    isAuthenticated: true,
  })
  resetAsk()
  useAskQuoteStore.setState({ quote: null })
  vi.mocked(getConversation).mockImplementation(async (id: string) => conversation(id) as never)
  vi.mocked(getGenerationProgress).mockResolvedValue({ status: 'completed', steps: [] } as never)
  vi.mocked(streamConversationMessage).mockResolvedValue('streamed' as never)
})

describe('a question held back from POST /conversations', () => {
  it('goes out into the new conversation even when Ask was closed before it existed', async () => {
    vi.mocked(getConversations).mockResolvedValue({ items: [] } as never)
    const answerCreate = createHeldOpen()
    useAskQuoteStore.setState({ quote: exerciseQuote() })
    act(() => useAskStore.getState().setDraft('u-1', 'Why subtract 3 first?'))
    mount(<Stage />)
    const panel = await sendFromPanel()

    await userEvent.click(panel.getByRole('button', { name: i18n.t('chat:ask.close') }))
    await answerCreate('new-1')

    await waitFor(() => expect(streamConversationMessage).toHaveBeenCalledTimes(1))
    const [call] = vi.mocked(streamConversationMessage).mock.calls[0]
    expect(call.conversationId).toBe('new-1')
    expect(call.payload.content).toBe('Why subtract 3 first?')
    expect(call.payload.quote).toEqual({ text: '2x + 3 = 7', source: { kind: 'challenge', id: 'ch-1' } })
    expect(call.payload.practiceContext).toEqual(practiceOn('ch-1').context)
    // Kept as the conversation's pending message, so opening it shows it waiting.
    expect(readPendingMessage('new-1')?.content).toBe('Why subtract 3 first?')
    // A closed Ask stays closed.
    expect(screen.queryByRole('complementary', { name: 'Ask' })).toBeNull()
  })

  it('is sent again, with the same key, when a reload lost its request', async () => {
    writePendingMessage('new-1', {
      idempotencyKey: 'held-new-1',
      content: 'Why subtract 3 first?',
      askedAt: '2026-10-18T10:00:00Z',
      quote: { text: '2x + 3 = 7', source: { kind: 'challenge', id: 'ch-1' } },
      unconfirmed: true,
    })
    vi.mocked(getConversations).mockResolvedValue({ items: [] } as never)
    act(() => useAskStore.getState().select('u-1', 'new-1'))
    mount(<AskHost />)

    await waitFor(() => expect(streamConversationMessage).toHaveBeenCalledTimes(1))
    const [call] = vi.mocked(streamConversationMessage).mock.calls[0]
    expect(call.conversationId).toBe('new-1')
    expect(call.payload.idempotencyKey).toBe('held-new-1')
    expect(call.payload.quote?.source).toEqual({ kind: 'challenge', id: 'ch-1' })
  })

  it('goes only into its own conversation, not one the student opened while it was made', async () => {
    vi.mocked(getConversations).mockResolvedValue({
      items: [{ id: 'old', title: 'Old chat', subject: 'math', grade: '8', updatedAt: '2026-10-01T10:00:00Z' }],
    } as never)
    const answerCreate = createHeldOpen()
    useAskQuoteStore.setState({ quote: exerciseQuote() })
    act(() => useAskStore.getState().setDraft('u-1', 'Why subtract 3 first?'))
    mount(<Stage />)
    const panel = within(screen.getByRole('complementary', { name: 'Ask' }))
    await panel.findByText('Old chat')
    await sendFromPanel()

    await userEvent.click(panel.getByText('Old chat'))
    await waitFor(() => expect(useAskStore.getState().conversationId).toBe('old'))
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20))
    })
    expect(sentTo()).not.toContain('old')

    await answerCreate('new-1')
    await waitFor(() => expect(sentTo()).toEqual(['new-1']))
    // The student stays in the conversation they chose.
    expect(useAskStore.getState().conversationId).toBe('old')
  })
})

describe('a quote chosen beside an exercise', () => {
  it('is dropped when the stage goes, and not shown in Ask on the planet', async () => {
    vi.mocked(getConversations).mockResolvedValue({ items: [] } as never)
    const stage = mount(
      <StageWithAsk practice={practiceOn('ch-1')}>
        <p>exercise</p>
      </StageWithAsk>,
    )
    act(() => useAskQuoteStore.getState().setQuote(exerciseQuote()))
    stage.unmount()
    expect(useAskQuoteStore.getState().quote).toBeNull()

    act(() => useAskStore.getState().openWithDraft('u-1', 'What is a prime number?'))
    const { container } = mount(<AskHost />)
    await screen.findByRole('complementary', { name: 'Ask' })
    expect(container.querySelector('[data-ask-pending-quote]')).toBeNull()
  })

  it('is dropped on moving to the next exercise', () => {
    vi.mocked(getConversations).mockResolvedValue({ items: [] } as never)
    const view = mount(
      <StageWithAsk practice={practiceOn('ch-1')}>
        <p>exercise</p>
      </StageWithAsk>,
    )
    act(() => useAskQuoteStore.getState().setQuote(exerciseQuote()))
    view.rerender(
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={new QueryClient()}>
          <MemoryRouter>
            <StageWithAsk practice={practiceOn('ch-2')}>
              <p>exercise</p>
            </StageWithAsk>
          </MemoryRouter>
        </QueryClientProvider>
      </I18nextProvider>,
    )
    expect(useAskQuoteStore.getState().quote).toBeNull()
  })

  it('of an answer is not shown or sent in another conversation', async () => {
    vi.mocked(getConversations).mockResolvedValue({ items: [] } as never)
    useAskQuoteStore.setState({ quote: makeQuote('Subtract 3 from both sides.', { kind: 'message', id: 'a1' }, 'conv-a') })
    act(() => useAskStore.getState().select('u-1', 'conv-b'))
    const { container } = mount(<AskHost />)
    const panel = within(await screen.findByRole('complementary', { name: 'Ask' }))
    await waitFor(() => expect(vi.mocked(getConversation).mock.calls[0]?.[0]).toBe('conv-b'))
    expect(container.querySelector('[data-ask-pending-quote]')).toBeNull()

    await userEvent.type(panel.getByRole('textbox'), 'And then?{Enter}')
    await waitFor(() => expect(streamConversationMessage).toHaveBeenCalledTimes(1))
    expect(vi.mocked(streamConversationMessage).mock.calls[0][0].payload).not.toHaveProperty('quote')
  })
})

describe('Ask beside an exercise says how to dictate (#515)', () => {
  it('in the docked composer under the stage on a phone', async () => {
    vi.mocked(getConversations).mockResolvedValue({ items: [] } as never)
    const mac = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15'
    Object.defineProperty(window.navigator, 'userAgent', { value: mac, configurable: true })
    // Narrow: Ask starts closed and the composer is docked under the exercise.
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
    })) as never
    try {
      const { container } = mount(<Stage />)
      await userEvent.click(within(container.querySelector<HTMLElement>('[data-ask-docked]')!).getByRole('textbox'))
      expect(container.querySelector('[data-composer-dictation]')).toHaveAttribute('data-composer-dictation', 'mac')
      expect(container.querySelector('[data-composer-dictation]')).toHaveAttribute(
        'data-composer-dictation-placement',
        'floating',
      )
    } finally {
      Reflect.deleteProperty(window.navigator, 'userAgent')
    }
  })
})
