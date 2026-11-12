/**
 * A question Ask holds back from `POST /conversations` -- one with a quote or
 * a file, which that request cannot carry -- and the quote itself (#263):
 *
 * - the held question goes out once the conversation exists, whether or not
 *   Ask is still open, and after a reload if its request was lost (what it
 *   carries, and under which key, is the question module's: `askQuestion562`);
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
import { AskServerProvider } from '@/features/ask/server/askServer'
import i18n from '@/i18n'
import { readPendingMessage, writePendingMessage } from '@/lib/pendingChatMessages'
import { resetAsk, useAskStore } from '@/store/askStore'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import { createFakeAskServer, type FakeAskServer } from '../fakes/askServer'

/** The server behind Ask, in memory (#571): each test seeds the conversations it opens. */
let server: FakeAskServer
let createConversation: FakeAskServer['conversations']['createConversation']
let getConversation: FakeAskServer['conversations']['getConversation']
let streamConversationMessage: FakeAskServer['stream']['streamConversationMessage']

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
        <MemoryRouter>
          <AskServerProvider value={server}>{node}</AskServerProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

/** `POST /conversations` held open until the test lets it answer. */
function createHeldOpen() {
  const answer = server.holdNext('createConversation')
  return (id: string) => {
    server.seed({ newConversationIds: [id] })
    return act(async () => answer())
  }
}

const exerciseQuote = () => makeQuote('2x + 3 = 7', { kind: 'challenge', id: 'ch-1' })
const practiceOn = (challengeId: string) => ({ context: { unitId: 'u', lessonId: 'l', challengeId } })
/** The practice stage on exercise ch-1, with Ask open beside it. */
const Stage = () => (
  <StageWithAsk practice={practiceOn('ch-1')}>
    <p>exercise</p>
  </StageWithAsk>
)
const sentTo = () => streamConversationMessage.mock.calls.map(([call]) => call.conversationId)

async function sendFromPanel() {
  const panel = within(screen.getByRole('complementary', { name: 'Ask' }))
  await userEvent.click(panel.getByRole('textbox'))
  await userEvent.keyboard('{Enter}')
  await waitFor(() => expect(createConversation).toHaveBeenCalledTimes(1))
  // `POST /conversations` cannot carry the quote, so it carries no question.
  expect(createConversation.mock.calls[0][0]).not.toHaveProperty('initialMessage')
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
  // Nothing listed, a message answered as it is sent, and no teacher online.
  server = createFakeAskServer()
  server.availability = { online: false, availableTeachers: 0 }
  ;({ createConversation, getConversation } = server.conversations)
  ;({ streamConversationMessage } = server.stream)
})

describe('a question held back from POST /conversations', () => {
  it('goes out into the new conversation even when Ask was closed before it existed', async () => {
    const answerCreate = createHeldOpen()
    useAskQuoteStore.setState({ quote: exerciseQuote() })
    act(() => useAskStore.getState().setDraft('u-1', 'Why subtract 3 first?'))
    mount(<Stage />)
    const panel = await sendFromPanel()

    await userEvent.click(panel.getByRole('button', { name: i18n.t('chat:ask.close') }))
    await answerCreate('new-1')

    await waitFor(() => expect(streamConversationMessage).toHaveBeenCalledTimes(1))
    const [call] = streamConversationMessage.mock.calls[0]
    expect(call.conversationId).toBe('new-1')
    // Kept as the conversation's pending message, so opening it shows it waiting.
    expect(readPendingMessage('new-1')?.content).toBe('Why subtract 3 first?')
    // The passage went with it, and leaves the composer.
    expect(useAskQuoteStore.getState().quote).toBeNull()
    // A closed Ask stays closed.
    expect(screen.queryByRole('complementary', { name: 'Ask' })).toBeNull()
  })

  it('is sent again, with the same key, when a reload lost its request', async () => {
    server.seed({ conversations: [conversation('new-1')] })
    writePendingMessage('new-1', {
      idempotencyKey: 'held-new-1',
      content: 'Why subtract 3 first?',
      askedAt: '2026-10-18T10:00:00Z',
      quote: { text: '2x + 3 = 7', source: { kind: 'challenge', id: 'ch-1' } },
      unconfirmed: true,
    })
    act(() => useAskStore.getState().select('u-1', 'new-1'))
    mount(<AskHost />)

    await waitFor(() => expect(streamConversationMessage).toHaveBeenCalledTimes(1))
    const [call] = streamConversationMessage.mock.calls[0]
    expect(call.conversationId).toBe('new-1')
    expect(call.payload.idempotencyKey).toBe('held-new-1')
    expect(call.payload.quote?.source).toEqual({ kind: 'challenge', id: 'ch-1' })
  })

  it('goes only into its own conversation, not one the student opened while it was made', async () => {
    server.seed({
      conversations: [conversation('old')],
      list: [{ id: 'old', title: 'Old chat', subject: 'math', grade: '8', updatedAt: '2026-10-01T10:00:00Z' }],
    })
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
    await screen.findByRole('dialog', { name: 'Ask' })
    expect(container.querySelector('[data-ask-pending-quote]')).toBeNull()
  })

  it('is dropped on moving to the next exercise', () => {
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
            <AskServerProvider value={server}>
              <StageWithAsk practice={practiceOn('ch-2')}>
                <p>exercise</p>
              </StageWithAsk>
            </AskServerProvider>
          </MemoryRouter>
        </QueryClientProvider>
      </I18nextProvider>,
    )
    expect(useAskQuoteStore.getState().quote).toBeNull()
  })

  it('of an answer is not shown or sent in another conversation', async () => {
    server.seed({ conversations: [conversation('conv-b')] })
    useAskQuoteStore.setState({ quote: makeQuote('Subtract 3 from both sides.', { kind: 'message', id: 'a1' }, 'conv-a') })
    act(() => useAskStore.getState().select('u-1', 'conv-b'))
    const { container } = mount(<AskHost />)
    const panel = within(await screen.findByRole('dialog', { name: 'Ask' }))
    await waitFor(() => expect(getConversation.mock.calls[0]?.[0]).toBe('conv-b'))
    expect(container.querySelector('[data-ask-pending-quote]')).toBeNull()

    await userEvent.type(panel.getByRole('textbox'), 'And then?{Enter}')
    await waitFor(() => expect(streamConversationMessage).toHaveBeenCalledTimes(1))
    expect(streamConversationMessage.mock.calls[0][0].payload).not.toHaveProperty('quote')
  })
})

describe('Ask beside an exercise says how to dictate, behind a microphone (#515, #553)', () => {
  it('in the docked composer under the stage on a phone', async () => {
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
      const docked = within(container.querySelector<HTMLElement>('[data-ask-docked]')!)
      await userEvent.click(docked.getByRole('button', { name: 'Ask by voice' }))
      expect(container.querySelector('[data-composer-dictation]')).toHaveAttribute('data-composer-dictation', 'mac')
    } finally {
      Reflect.deleteProperty(window.navigator, 'userAgent')
    }
  })
})
