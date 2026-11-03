/**
 * A message refused because the student's messages for the day are used up
 * (#541): the server answers `429 message_daily_limit`, and Ask says so in the
 * reader's language instead of "the explanation could not be prepared", with
 * no "Send again" -- sent again the same day, it is refused again.
 *
 * The server counts the day in UTC (`datetime.now(timezone.utc)`), so in
 * Zurich it turns at 01:00 (02:00 in summer). The next UTC day the same
 * message can go out again, as itself. Other failures keep the general words
 * and their "Send again".
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AskHost } from '@/features/ask/AskHost'
import i18n from '@/i18n'
import { ApiError } from '@/services/api/httpClient'
import { resetAsk } from '@/store/askStore'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { Conversation } from '@/types/chat'

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
import { getTeacherAvailability, getTeacherHelpRequest } from '@/services/teacherHelp/teacherHelpApi'

const streamMock = vi.mocked(streamConversationMessage)
const progressMock = vi.mocked(getGenerationProgress)

/** As the backend sends it: `ATTACHMENT_ERROR_REGISTRY[MESSAGE_DAILY_LIMIT]`. */
const dailyLimit = () =>
  new ApiError('Your daily message limit is reached. Try again tomorrow.', { status: 429, code: 'message_daily_limit' })

const LIMIT_WORDS = {
  de: 'Deine Nachrichten für heute sind aufgebraucht. Komm morgen wieder, oder frag eine Lehrperson, wenn du jetzt Hilfe brauchst.',
  en: 'You have used all your messages for today. Come back tomorrow, or ask a teacher if you need help now.',
  fr: 'Tu as utilisé tous tes messages pour aujourd’hui. Reviens demain, ou demande à un enseignant si tu as besoin d’aide maintenant.',
  it: 'Hai usato tutti i tuoi messaggi di oggi. Torna domani, oppure chiedi a un docente se hai bisogno di aiuto adesso.',
} as const

const GENERAL_FAILURE = 'The explanation could not be prepared right now. Please try again or ask a teacher.'

function conversation(): Conversation {
  return {
    id: 'c1',
    title: 'Linear equations',
    subject: 'math',
    grade: '8',
    updatedAt: '2026-10-31T10:00:00.000Z',
    messages: [],
  }
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
  return within(screen.getByRole('complementary', { name: i18n.t('chat:ask.title') }))
}

type Ask = ReturnType<typeof openAsk>

/** The messages themselves, without the live region that reads replies out. */
const thread = (panel: Ask) => within(panel.getByRole('log', { name: i18n.t('chat:ask.thread.label') }))

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

async function ask(panel: Ask, question: string) {
  await panel.findByText('Linear equations')
  await userEvent.type(panel.getByRole('textbox', { name: i18n.t('chat:ask.composerLabel') }), `${question}{Enter}`)
  await advance(1100)
}

const sendAgain = (panel: Ask) => panel.queryByRole('button', { name: i18n.t('chat:ask.thread.sendAgain') })

const originalMatchMedia = window.matchMedia
const originalTimeZone = process.env.TZ

beforeEach(async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  // 23:30 in Zurich on 31 October: the server's day is still the 31st.
  vi.setSystemTime(new Date('2026-10-31T22:30:00Z'))
  await i18n.changeLanguage('en')
  window.matchMedia = ((query: string) => ({
    matches: true,
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
  vi.mocked(getConversation).mockResolvedValue(conversation())
  vi.mocked(getTeacherAvailability).mockResolvedValue({ online: true, availableTeachers: 2 })
  vi.mocked(getTeacherHelpRequest).mockRejectedValue(new ApiError('never escalated', { status: 404 }))
  // Refused before it was stored: the server holds no command under its key.
  progressMock.mockRejectedValue(new ApiError('not found', { status: 404, code: 'message_command_not_found' }))
})

afterEach(async () => {
  vi.useRealTimers()
  vi.clearAllMocks()
  sessionStorage.clear()
  window.matchMedia = originalMatchMedia
  process.env.TZ = originalTimeZone
  await i18n.changeLanguage('en')
})

describe('the day’s messages used up', () => {
  it.each(Object.keys(LIMIT_WORDS) as Array<keyof typeof LIMIT_WORDS>)(
    'says so in %s, and offers no "Send again"',
    async (language) => {
      await i18n.changeLanguage(language)
      streamMock.mockRejectedValue(dailyLimit())
      const panel = openAsk()

      await ask(panel, 'Why both sides?')

      expect(await thread(panel).findByText(LIMIT_WORDS[language])).toBeInTheDocument()
      expect(panel.queryByText(i18n.t('chat:ask.thread.answerFailed'))).not.toBeInTheDocument()
      expect(thread(panel).getByText(i18n.t('chat:ask.thread.notSent'))).toBeInTheDocument()
      expect(sendAgain(panel)).not.toBeInTheDocument()
      expect(streamMock).toHaveBeenCalledTimes(1)
    },
  )

  it('writes German the Swiss way', () => {
    expect(i18n.getResource('de', 'chat', 'ask.thread.dailyLimit')).not.toMatch(/ß/)
  })

  it('stays without "Send again" after a reload the same day', async () => {
    streamMock.mockRejectedValue(dailyLimit())
    const first = openAsk()
    await ask(first, 'Why both sides?')
    expect(await thread(first).findByText(LIMIT_WORDS.en)).toBeInTheDocument()

    cleanup()
    const panel = openAsk()

    expect(await thread(panel).findByText('Why both sides?')).toBeInTheDocument()
    expect(thread(panel).getByText(LIMIT_WORDS.en)).toBeInTheDocument()
    expect(sendAgain(panel)).not.toBeInTheDocument()
  })

  it('offers "Send again" once the server’s UTC day has turned, not Zurich’s, and sends the same message', async () => {
    process.env.TZ = 'Europe/Zurich'
    streamMock.mockRejectedValueOnce(dailyLimit()).mockResolvedValue('streamed')
    const panel = openAsk()
    await ask(panel, 'Why both sides?')
    expect(await thread(panel).findByText(LIMIT_WORDS.en)).toBeInTheDocument()
    const composer = panel.getByRole('textbox', { name: i18n.t('chat:ask.composerLabel') })

    // 00:30 on 1 November in Zurich, 23:30 on 31 October for the server.
    vi.setSystemTime(new Date('2026-10-31T23:30:00Z'))
    await userEvent.type(composer, 'x')
    expect(sendAgain(panel)).not.toBeInTheDocument()

    // The server's day has turned.
    vi.setSystemTime(new Date('2026-11-01T00:10:00Z'))
    await userEvent.type(composer, 'y')
    await userEvent.click(await panel.findByRole('button', { name: 'Send again' }))

    await waitFor(() => expect(streamMock).toHaveBeenCalledTimes(2))
    const [first, second] = streamMock.mock.calls.map(([call]) => call.payload)
    expect(second.content).toBe('Why both sides?')
    expect(second.idempotencyKey).toBe(first.idempotencyKey)
  })
})

describe('any other failure', () => {
  it.each([
    ['the network', () => new TypeError('Failed to fetch')],
    ['a 503', () => new ApiError('Request failed with status code 503', { status: 503 })],
    ['another 429', () => new ApiError('Request failed with status code 429', { status: 429 })],
  ])('keeps the general words and "Send again" after %s', async (_, failure) => {
    streamMock.mockRejectedValueOnce(failure()).mockResolvedValue('streamed')
    const panel = openAsk()

    await ask(panel, 'Why both sides?')

    expect(await thread(panel).findByText(GENERAL_FAILURE)).toBeInTheDocument()
    expect(panel.queryByText(LIMIT_WORDS.en)).not.toBeInTheDocument()
    await userEvent.click(panel.getByRole('button', { name: 'Send again' }))
    await waitFor(() => expect(streamMock).toHaveBeenCalledTimes(2))
  })
})
