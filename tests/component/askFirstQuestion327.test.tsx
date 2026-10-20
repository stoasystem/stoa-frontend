/**
 * The first question of a new Ask conversation (#327): sent again with the
 * exercise it was asked beside (K3), and after a refusal asked again in the
 * conversation the refusal names rather than in a new empty one (K4) -- that
 * question only; any other starts a conversation of its own (#370).
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { StageWithAsk } from '@/features/chapter/StageAsk'
import { makeQuote, useAskQuoteStore } from '@/features/ask/practiceContext'
import i18n from '@/i18n'
import { readPendingMessage } from '@/lib/pendingChatMessages'
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
  const wrap = (inner: ReactNode) => (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter>{inner}</MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>
  )
  const view = render(wrap(node))
  return { ...view, rerender: (next: ReactNode) => view.rerender(wrap(next)) }
}

const practice = { unitId: 'u', lessonId: 'l', challengeId: 'ch-1' }
const Stage = ({ challengeId = practice.challengeId }: { challengeId?: string }) => (
  <StageWithAsk practice={{ context: { ...practice, challengeId } }}>
    <p>exercise</p>
  </StageWithAsk>
)

async function ask(question: string) {
  act(() => useAskStore.getState().setDraft('u-1', question))
  const panel = within(await screen.findByRole('complementary', { name: 'Ask' }))
  await userEvent.click(panel.getByRole('textbox'))
  await userEvent.keyboard('{Enter}')
  return panel
}

function refusal(conversationId?: string) {
  return new ApiError('You have reached today\u2019s limit.', {
    status: 429,
    code: 'daily_message_limit',
    detail: { code: 'daily_message_limit', message: 'You have reached today\u2019s limit.', ...(conversationId ? { conversationId } : {}) },
  })
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
  vi.mocked(getConversations).mockResolvedValue({ items: [] } as never)
  vi.mocked(getConversation).mockImplementation(async (id: string) => conversation(id) as never)
  vi.mocked(getGenerationProgress).mockResolvedValue({ status: 'completed', steps: [] } as never)
  vi.mocked(streamConversationMessage).mockResolvedValue('streamed' as never)
})

describe('K3: the first question asked beside an exercise', () => {
  it('is sent again with its exercise, under the key the server took it with', async () => {
    vi.mocked(createConversation).mockResolvedValue(conversation('new-1') as never)
    vi.mocked(getGenerationProgress).mockResolvedValue({
      conversationId: 'new-1', steps: [], updatedAt: '', status: 'failed', retryable: true,
    } as never)
    mount(<Stage />)
    const panel = await ask('Why subtract 3 first?')

    await waitFor(() => expect(createConversation).toHaveBeenCalledTimes(1))
    expect(vi.mocked(createConversation).mock.calls[0][0]).toMatchObject({ initialMessage: 'Why subtract 3 first?', practiceContext: practice })
    await waitFor(() => expect(readPendingMessage('new-1')?.practiceContext).toEqual(practice))

    const again = await panel.findByRole('button', { name: i18n.t('chat:ask.thread.sendAgain') }, { timeout: 5000 })
    await userEvent.click(again)

    await waitFor(() => expect(streamConversationMessage).toHaveBeenCalledTimes(1))
    const [call] = vi.mocked(streamConversationMessage).mock.calls[0]
    expect(call.conversationId).toBe('new-1')
    expect(call.payload.idempotencyKey).toBe('initial-new-1')
    expect(call.payload.practiceContext).toEqual(practice)
  })
})

describe('K4: a first question refused after its conversation was made', () => {
  it('is asked again in that conversation, not in a new empty one', async () => {
    vi.mocked(createConversation).mockRejectedValueOnce(refusal('made-1'))
    mount(<Stage />)
    const panel = await ask('Why subtract 3 first?')
    await waitFor(() => expect(panel.getByRole('textbox')).toHaveValue('Why subtract 3 first?'))
    const shown = (await panel.findByRole('alert')).textContent!
    expect(shown).not.toBe('')

    await userEvent.click(panel.getByRole('textbox'))
    await userEvent.keyboard('{Enter}')

    await waitFor(() => expect(streamConversationMessage).toHaveBeenCalledTimes(1))
    expect(createConversation).toHaveBeenCalledTimes(1)
    const [call] = vi.mocked(streamConversationMessage).mock.calls[0]
    expect(call.conversationId).toBe('made-1')
    expect(call.payload).toMatchObject({ content: 'Why subtract 3 first?', idempotencyKey: 'initial-made-1', practiceContext: practice })
    // The refusal is no longer shown once the question is on its way again.
    // Back on the list, the refusal of a question now on its way is not shown.
    await userEvent.click(await panel.findByRole('button', { name: i18n.t('chat:ask.back') }))
    await panel.findByRole('textbox')
    expect(screen.queryByText(shown)).toBeNull()
  })

  it('starts a new conversation when the refusal names none', async () => {
    vi.mocked(createConversation).mockRejectedValueOnce(refusal()).mockResolvedValueOnce(conversation('new-2') as never)
    mount(<Stage />)
    const panel = await ask('Why subtract 3 first?')
    await waitFor(() => expect(panel.getByRole('textbox')).toHaveValue('Why subtract 3 first?'))

    await userEvent.click(panel.getByRole('textbox'))
    await userEvent.keyboard('{Enter}')

    await waitFor(() => expect(createConversation).toHaveBeenCalledTimes(2))
  })
})

describe('#370: only the refused question goes into the conversation made for it', () => {
  // The backend titles a conversation after its first question, so the one a
  // refusal leaves behind carries the refused question's title.
  const titled: Record<string, string> = { 'made-1': 'Why subtract 3 first?', 'new-2': 'Why not divide first?' }
  const sentTo = () => vi.mocked(streamConversationMessage).mock.calls.map(([call]) => call.conversationId)

  beforeEach(() => {
    vi.mocked(getConversation).mockImplementation(async (id: string) => ({ ...conversation(id), title: titled[id] ?? id }) as never)
    vi.mocked(createConversation).mockReset().mockRejectedValueOnce(refusal('made-1')).mockResolvedValueOnce(conversation('new-2') as never)
  })

  it('starts a new conversation for a different question, under its own title', async () => {
    mount(<Stage />)
    const panel = await ask('Why subtract 3 first?')
    await waitFor(() => expect(panel.getByRole('textbox')).toHaveValue('Why subtract 3 first?'))

    await ask('Why not divide first?')

    await waitFor(() => expect(createConversation).toHaveBeenCalledTimes(2))
    expect(vi.mocked(createConversation).mock.calls[1][0]).toMatchObject({ initialMessage: 'Why not divide first?', practiceContext: practice })
    expect(await panel.findByRole('heading', { name: 'Why not divide first?' })).toBeInTheDocument()
    expect(panel.queryByRole('heading', { name: 'Why subtract 3 first?' })).toBeNull()
    expect(sentTo()).not.toContain('made-1')
  })

  it('starts a new conversation for the same words asked beside another exercise', async () => {
    const view = mount(<Stage />)
    const panel = await ask('Why subtract 3 first?')
    await waitFor(() => expect(panel.getByRole('textbox')).toHaveValue('Why subtract 3 first?'))

    // The same panel, now beside the next exercise.
    view.rerender(<Stage challengeId="ch-2" />)
    await userEvent.click(panel.getByRole('textbox'))
    await userEvent.keyboard('{Enter}')

    await waitFor(() => expect(createConversation).toHaveBeenCalledTimes(2))
    expect(vi.mocked(createConversation).mock.calls[1][0]).toMatchObject({ initialMessage: 'Why subtract 3 first?', practiceContext: { ...practice, challengeId: 'ch-2' } })
    expect(sentTo()).not.toContain('made-1')
  })

  it('starts a new conversation for the same words asked about a passage', async () => {
    mount(<Stage />)
    const panel = await ask('Why subtract 3 first?')
    await waitFor(() => expect(panel.getByRole('textbox')).toHaveValue('Why subtract 3 first?'))

    act(() => useAskQuoteStore.getState().setQuote(makeQuote('2x + 3 = 7', { kind: 'challenge', id: 'ch-1' })))
    await userEvent.click(panel.getByRole('textbox'))
    await userEvent.keyboard('{Enter}')

    // A quote does not go out with `POST /conversations`: the new one starts
    // empty and the question is sent into it.
    await waitFor(() => expect(streamConversationMessage).toHaveBeenCalledTimes(1))
    expect(createConversation).toHaveBeenCalledTimes(2)
    expect(vi.mocked(createConversation).mock.calls[1][0]).not.toHaveProperty('initialMessage')
    const [call] = vi.mocked(streamConversationMessage).mock.calls[0]
    expect(call.conversationId).toBe('new-2')
    expect(call.payload.idempotencyKey).toBe('held-new-2')
  })
})
