/**
 * Quick replies under Ask's answer (#682, stoa-backend#443), driven through
 * the real panel with only the API answered here. The latest answer's
 * `structured.quickReplies` are buttons under it -- and under no earlier
 * answer; none leave nothing behind. One pressed goes out as an ordinary
 * follow-up: its own words, once, without the passage the student put aside;
 * none can be pressed again while it is on its way; the follow-up's answer
 * brings its own replies, or none. Refused for the day's limit, it is said as
 * for a question typed.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AskHost } from '@/features/ask/AskHost'
import { AskServerProvider } from '@/features/ask/server/askServer'
import i18n from '@/i18n'
import { ApiError } from '@/services/api/httpClient'
import { resetAsk } from '@/store/askStore'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { ChatMessage, ChatStreamEvent, Conversation, StructuredAnswer } from '@/types/chat'
import { createFakeAskServer, type FakeAskServer } from '../fakes/askServer'

let server: FakeAskServer
let streamMock: FakeAskServer['stream']['streamConversationMessage']

const GROUP = 'What you could say next'
const FIRST = ["I don't get step 2", 'Give me a similar one to try', 'Why divide by 3?']
const LATER = ['One more example, please', 'Show me where 15 comes from']

const SECTIONS: StructuredAnswer = {
  kind: 'answer',
  steps: ['Subtract 5 on both sides: 3x = 15.', 'Divide both sides by 3.'],
  answer: 'x = 5',
  hints: [],
  similarExercises: [],
  knowledgePoints: [],
  suggestTeacher: false,
}

function message(id: string, role: ChatMessage['role'], content: string, extra: Partial<ChatMessage> = {}): ChatMessage {
  return { id, conversationId: 'c1', role, content, createdAt: '2026-11-18T10:00:00.000Z', status: 'completed', ...extra }
}

function answer(id: string, structured: StructuredAnswer | null, content = 'x = 5') {
  return message(id, 'assistant', content, { structured })
}

function readBack(messages: ChatMessage[]) {
  const conversation: Conversation = {
    id: 'c1',
    title: 'Linear equations',
    subject: 'math',
    grade: '8',
    updatedAt: '2026-11-18T10:00:00.000Z',
    messages,
  }
  server.seed({ conversations: [conversation] })
}

function openAsk() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/ask/c1']}>
          <AskServerProvider value={server}>
            <AskHost route={{ conversationId: 'c1' }} />
          </AskServerProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
  return within(screen.getByRole('dialog', { name: 'Ask' }))
}

type Ask = ReturnType<typeof openAsk>

const thread = (ask: Ask) => within(ask.getByRole('log', { name: 'Messages' }))
const groups = (ask: Ask) => thread(ask).queryAllByRole('group', { name: GROUP })
const labels = (group: HTMLElement) => within(group).getAllByRole('button').map((button) => button.textContent)

/** The answer a node sits under, by the id its bubble carries. */
function answerOf(node: HTMLElement) {
  return node.closest('[data-message-role="assistant"]')?.querySelector('[data-quote-id]')?.getAttribute('data-quote-id')
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
  server = createFakeAskServer()
  streamMock = server.stream.streamConversationMessage
})

const originalMatchMedia = window.matchMedia
afterEach(async () => {
  vi.useRealTimers()
  vi.clearAllMocks()
  sessionStorage.clear()
  window.matchMedia = originalMatchMedia
  await i18n.changeLanguage('en')
})

describe('where the quick replies are', () => {
  it('shows them under the latest answer only, above "Ask a teacher"', async () => {
    readBack([
      message('s1', 'student', 'Solve 3x + 5 = 20.'),
      answer('a1', { ...SECTIONS, quickReplies: ['From the first answer'] }),
      message('s2', 'student', 'And why?'),
      answer('a2', { kind: 'followUp', quickReplies: FIRST }, 'Because both sides stay equal.'),
    ])
    const ask = openAsk()

    const teacher = await ask.findByRole('button', { name: 'Ask a teacher' })
    const shown = groups(ask)
    expect(shown).toHaveLength(1)
    expect(labels(shown[0])).toEqual(FIRST)
    expect(answerOf(shown[0])).toBe('a2')
    expect(ask.queryByText('From the first answer')).not.toBeInTheDocument()
    // Read in order: the answer, what to say next, then the teacher.
    expect(shown[0].compareDocumentPosition(teacher) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('shows none once a teacher has written after the answer', async () => {
    readBack([message('s1', 'student', 'Solve 3x + 5 = 20.'), answer('a1', { ...SECTIONS, quickReplies: FIRST }), message('t1', 'teacher', 'Hi!')])
    const ask = openAsk()

    expect(await thread(ask).findByText('Hi!')).toBeInTheDocument()
    expect(groups(ask)).toHaveLength(0)
  })

  it.each([
    ['empty', { ...SECTIONS, quickReplies: [] }],
    ['absent', SECTIONS],
    ['without sections', null],
  ])('leaves nothing behind when they are %s', async (_, structured) => {
    readBack([message('s1', 'student', 'Solve 3x + 5 = 20.'), answer('a1', structured)])
    const ask = openAsk()

    await ask.findByRole('button', { name: 'Ask a teacher' })
    expect(groups(ask)).toHaveLength(0)
    expect(document.querySelector('[data-ask-quick-replies]')).toBeNull()
    // Nothing between the answer and "Ask a teacher": no empty row kept for them.
    const wrapper = document.querySelector('[data-message-role="assistant"]') as HTMLElement
    const help = wrapper.querySelector('[data-help-action]') as HTMLElement
    const bubble = wrapper.querySelector('[data-quote-id="a1"]') as HTMLElement
    expect(bubble.nextElementSibling).toBe(help)
  })
})

describe('pressing one', () => {
  it('sends its words as they are, once, without the passage put aside, and leaves the composer alone', async () => {
    readBack([message('s1', 'student', 'Solve 3x + 5 = 20.'), answer('a1', { ...SECTIONS, quickReplies: FIRST })])
    const ask = openAsk()
    const composer = await ask.findByRole('textbox', { name: 'Your question' })
    // A passage put aside, and a question started, for the student's own next question.
    await userEvent.click(await thread(ask).findByRole('button', { name: "I don't get this step (Step 1)" }))
    await userEvent.clear(composer)
    await userEvent.type(composer, 'Why by 3')

    const reply = within(groups(ask)[0]).getByRole('button', { name: FIRST[1] })
    fireEvent.click(reply)
    fireEvent.click(reply)

    await waitFor(() => expect(streamMock).toHaveBeenCalledTimes(1))
    const { conversationId, payload } = streamMock.mock.calls[0][0]
    expect(conversationId).toBe('c1')
    expect(payload.content).toBe(FIRST[1])
    expect(payload).not.toHaveProperty('quote')
    expect(payload.attachmentIds ?? []).toEqual([])
    expect(payload.idempotencyKey).toEqual(expect.any(String))
    expect(await thread(ask).findByText(FIRST[1])).toBeInTheDocument()
    expect(composer).toHaveValue('Why by 3')
    expect(document.querySelector('[data-ask-pending-quote]')).toHaveTextContent('Quoted · Step 1')
  })

  it('cannot be pressed again, nor any other, while it is on its way', async () => {
    readBack([message('s1', 'student', 'Solve 3x + 5 = 20.'), answer('a1', { ...SECTIONS, quickReplies: FIRST })])
    server.answerWith({ until: new Promise(() => {}) })
    const ask = openAsk()
    const group = (await thread(ask).findAllByRole('group', { name: GROUP }))[0]

    const pressed = within(group).getByRole('button', { name: FIRST[0] })
    fireEvent.click(pressed)

    // At once, before the answer has started to come: the same buttons, greyed.
    const now = groups(ask)
    expect(now).toEqual([group])
    for (const button of within(group).getAllByRole('button')) expect(button).toBeDisabled()
    fireEvent.click(within(group).getByRole('button', { name: FIRST[2] }))
    await waitFor(() => expect(streamMock).toHaveBeenCalledTimes(1))
    // Then the answer being written is the latest, and there are none.
    await waitFor(() => expect(groups(ask)).toHaveLength(0))
    expect(streamMock).toHaveBeenCalledTimes(1)
  })
})

describe('pressed from the keyboard', () => {
  it('hands the keyboard on to the composer', async () => {
    readBack([message('s1', 'student', 'Solve 3x + 5 = 20.'), answer('a1', { kind: 'followUp', quickReplies: FIRST })])
    server.answerWith({ until: new Promise(() => {}) })
    const ask = openAsk()
    const reply = within((await thread(ask).findAllByRole('group', { name: GROUP }))[0]).getByRole('button', { name: FIRST[0] })

    reply.focus()
    await userEvent.keyboard('{Enter}')

    await waitFor(() => expect(streamMock).toHaveBeenCalledTimes(1))
    expect(ask.getByRole('textbox', { name: 'Your question' })).toHaveFocus()
  })

  it('leaves the focus alone after a tap', async () => {
    readBack([message('s1', 'student', 'Solve 3x + 5 = 20.'), answer('a1', { kind: 'followUp', quickReplies: FIRST })])
    server.answerWith({ until: new Promise(() => {}) })
    const ask = openAsk()
    const reply = within((await thread(ask).findAllByRole('group', { name: GROUP }))[0]).getByRole('button', { name: FIRST[0] })

    await userEvent.click(reply)

    await waitFor(() => expect(streamMock).toHaveBeenCalledTimes(1))
    expect(ask.getByRole('textbox', { name: 'Your question' })).not.toHaveFocus()
  })
})

describe('the answer to it', () => {
  it.each([
    ['its own replies', LATER, LATER],
    ['none', [], null],
  ])('brings %s, and the earlier ones are gone', async (_, replies, shown) => {
    readBack([message('s1', 'student', 'Solve 3x + 5 = 20.'), answer('a1', { ...SECTIONS, quickReplies: FIRST })])
    let finish!: () => void
    const finished = new Promise<void>((resolve) => {
      finish = resolve
    })
    const written: ChatStreamEvent[] = [
      { type: 'message_start', messageId: 'a-new', role: 'assistant', createdAt: new Date().toISOString() },
      { type: 'message_delta', messageId: 'a-new', delta: 'Because 3x means 3 times x.' },
    ]
    const done: ChatStreamEvent = {
      type: 'message_done',
      messageId: 'a-new',
      status: 'completed',
      structured: { kind: 'followUp', quickReplies: replies },
    }
    // What the conversation reads back once the answer is written.
    const leaves = {
      conversations: [
        {
          id: 'c1',
          title: 'Linear equations',
          subject: 'math',
          grade: '8',
          updatedAt: '2026-11-18T10:05:00.000Z',
          messages: [
            message('s1', 'student', 'Solve 3x + 5 = 20.'),
            answer('a1', { ...SECTIONS, quickReplies: FIRST }),
            message('s-new', 'student', FIRST[2]),
            answer('a-new', { kind: 'followUp', quickReplies: replies }, 'Because 3x means 3 times x.'),
          ],
        },
      ],
    }
    server.answerWith({ events: written, until: finished, after: [done], leaves })
    const ask = openAsk()
    await userEvent.click(within((await thread(ask).findAllByRole('group', { name: GROUP }))[0]).getByRole('button', { name: FIRST[2] }))
    expect(await thread(ask).findByText('Because 3x means 3 times x.')).toBeInTheDocument()
    expect(groups(ask)).toHaveLength(0)

    await act(async () => finish())

    if (shown) {
      const group = await thread(ask).findByRole('group', { name: GROUP })
      expect(labels(group)).toEqual(shown)
      expect(answerOf(group)).toBe('a-new')
      expect(groups(ask)).toHaveLength(1)
    } else {
      await waitFor(() => expect(ask.getByRole('button', { name: 'Ask a teacher' }).closest('[data-message-role]')?.textContent).toContain('Because 3x'))
      expect(groups(ask)).toHaveLength(0)
    }
    for (const earlier of FIRST) expect(thread(ask).queryByRole('button', { name: earlier })).not.toBeInTheDocument()
  })
})

describe('the day’s messages used up', () => {
  it('is said as for a question typed, with no "Send again"', async () => {
    readBack([message('s1', 'student', 'Solve 3x + 5 = 20.'), answer('a1', { ...SECTIONS, quickReplies: FIRST })])
    server.refuseNextWith(
      new ApiError('Your daily message limit is reached. Try again tomorrow.', { status: 429, code: 'message_daily_limit' }),
    )
    const ask = openAsk()

    await userEvent.click(within((await thread(ask).findAllByRole('group', { name: GROUP }))[0]).getByRole('button', { name: FIRST[0] }))

    expect(await thread(ask).findByText(i18n.t('chat:ask.thread.dailyLimit'))).toBeInTheDocument()
    expect(thread(ask).getByText(i18n.t('chat:ask.thread.notSent'))).toBeInTheDocument()
    expect(thread(ask).getByText(FIRST[0], { selector: '[data-message-role="student"] *' })).toBeInTheDocument()
    expect(ask.queryByRole('button', { name: i18n.t('chat:ask.thread.sendAgain') })).not.toBeInTheDocument()
    expect(streamMock).toHaveBeenCalledTimes(1)
  })
})

describe('the group’s name', () => {
  it.each([
    ['de', 'Was du als Nächstes sagen kannst'],
    ['fr', 'Ce que tu pourrais dire ensuite'],
    ['it', 'Cosa potresti dire ora'],
  ])('is said in %s', async (language, name) => {
    await i18n.changeLanguage(language)
    readBack([message('s1', 'student', 'Solve 3x + 5 = 20.'), answer('a1', { kind: 'followUp', quickReplies: FIRST })])
    render(
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <MemoryRouter initialEntries={['/ask/c1']}>
            <AskServerProvider value={server}>
              <AskHost route={{ conversationId: 'c1' }} />
            </AskServerProvider>
          </MemoryRouter>
        </QueryClientProvider>
      </I18nextProvider>,
    )
    expect(await screen.findByRole('group', { name })).toBeInTheDocument()
  })
})
