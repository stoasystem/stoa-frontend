/**
 * A question refused because this week's AI allowance is used up (#581): the
 * server answers `429 allowance_exhausted` (stoa-backend#206) before it stores
 * the message, charges the day or calls a model. Ask says so in the reader's
 * language -- apart from the day's messages being used up (#541) -- keeps the
 * way out to a teacher, and offers no "Send again": sent again the same week,
 * it is refused again.
 *
 * The allowance comes back on Monday in Zurich, so "Send again" comes back at
 * Zurich's midnight, not the server's UTC one. A first question is refused
 * after its conversation was made; the refusal names it, and the same question
 * asked again goes into it (#327 K4), as for the daily limit.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AskHost } from '@/features/ask/AskHost'
import { AskServerProvider } from '@/features/ask/server/askServer'
import { allowanceWeek } from '@/hooks/chat/useStreamingChat'
import i18n from '@/i18n'
import { ApiError } from '@/services/api/httpClient'
import { resetAsk } from '@/store/askStore'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { Conversation } from '@/types/chat'
import { createFakeAskServer, type FakeAskServer } from '../fakes/askServer'

let server: FakeAskServer
let streamMock: FakeAskServer['stream']['streamConversationMessage']

/** As the backend sends it: the usual ask-error body, naming a conversation it made for a first question. */
const allowanceExhausted = (conversationId?: string) =>
  new ApiError('This week’s AI allowance is used up.', {
    status: 429,
    code: 'allowance_exhausted',
    detail: {
      code: 'allowance_exhausted',
      message: 'This week’s AI allowance is used up.',
      correlationId: 'corr-581',
      ...(conversationId ? { conversationId } : {}),
    },
  })

const ALLOWANCE_WORDS = {
  de: 'Dein KI-Kontingent für diese Woche ist aufgebraucht. Es ist nächsten Montag (Zürcher Zeit) wieder da. Frag eine Lehrperson, wenn du jetzt Hilfe brauchst.',
  en: 'This week’s AI allowance is used up. It comes back next Monday (Zurich time). Ask a teacher if you need help now.',
  fr: 'Ton quota d’IA pour cette semaine est épuisé. Il revient lundi prochain (heure de Zurich). Demande à un enseignant si tu as besoin d’aide maintenant.',
  it: 'La tua quota di IA per questa settimana è esaurita. Torna lunedì prossimo (ora di Zurigo). Chiedi a un docente se hai bisogno di aiuto adesso.',
} as const

type Language = keyof typeof ALLOWANCE_WORDS
const languages = Object.keys(ALLOWANCE_WORDS) as Language[]

function conversation(id = 'c1', title = 'Linear equations'): Conversation {
  return { id, title, subject: 'math', grade: '8', updatedAt: '2026-11-04T09:00:00.000Z', messages: [] }
}

function openAsk(conversationId: string | null = 'c1') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[conversationId ? `/ask/${conversationId}` : '/ask']}>
          <AskServerProvider value={server}>
            <AskHost route={{ conversationId }} />
          </AskServerProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
  return within(screen.getByRole('complementary', { name: i18n.t('chat:ask.title') }))
}

type Ask = ReturnType<typeof openAsk>

const thread = (panel: Ask) => within(panel.getByRole('log', { name: i18n.t('chat:ask.thread.label') }))
const composer = (panel: Ask) => panel.getByRole('textbox', { name: i18n.t('chat:ask.composerLabel') })
const sendAgain = (panel: Ask) => panel.queryByRole('button', { name: i18n.t('chat:ask.thread.sendAgain') })

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

async function ask(panel: Ask, question: string) {
  await panel.findByText('Linear equations')
  await send(panel, question)
}

/** From the list, where there is no conversation to wait for. */
async function send(panel: Ask, question: string) {
  await userEvent.type(composer(panel), `${question}{Enter}`)
  await advance(1100)
}

const originalMatchMedia = window.matchMedia

beforeEach(async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  // Wednesday 4 November, 11:00 in Zurich.
  vi.setSystemTime(new Date('2026-11-04T10:00:00Z'))
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
  server = createFakeAskServer()
  server.seed({ conversations: [conversation()] })
  streamMock = server.stream.streamConversationMessage
})

afterEach(async () => {
  vi.useRealTimers()
  vi.clearAllMocks()
  sessionStorage.clear()
  window.matchMedia = originalMatchMedia
  await i18n.changeLanguage('en')
})

describe('the allowance’s week', () => {
  it('is the Monday of the week in Zurich, which turns at Zurich’s midnight', () => {
    // Sunday 23:30 in Zurich (CET, UTC+1).
    expect(allowanceWeek(new Date('2026-11-08T22:30:00Z'))).toBe('2026-11-02')
    // Monday 00:10 in Zurich, still Sunday in UTC.
    expect(allowanceWeek(new Date('2026-11-08T23:10:00Z'))).toBe('2026-11-09')
    // Summer time (CEST, UTC+2): Monday 00:30 in Zurich.
    expect(allowanceWeek(new Date('2026-06-14T22:30:00Z'))).toBe('2026-06-15')
    expect(allowanceWeek(new Date('2026-06-14T21:30:00Z'))).toBe('2026-06-08')
  })
})

describe('in an open conversation', () => {
  it.each(languages)('says so in %s, apart from the daily limit, and offers no "Send again"', async (language) => {
    await i18n.changeLanguage(language)
    server.refuseNextWith(allowanceExhausted())
    const panel = openAsk()

    await ask(panel, 'Why both sides?')

    expect(await thread(panel).findByText(ALLOWANCE_WORDS[language])).toBeInTheDocument()
    expect(panel.queryByText(i18n.t('chat:ask.thread.dailyLimit'))).not.toBeInTheDocument()
    expect(panel.queryByText(i18n.t('chat:ask.thread.answerFailed'))).not.toBeInTheDocument()
    expect(thread(panel).getByText(i18n.t('chat:ask.thread.notSent'))).toBeInTheDocument()
    expect(sendAgain(panel)).not.toBeInTheDocument()
    expect(streamMock).toHaveBeenCalledTimes(1)
  })

  it('writes German the Swiss way', () => {
    expect(i18n.getResource('de', 'chat', 'ask.thread.weeklyAllowance')).not.toMatch(/ß/)
  })

  it('stays without "Send again" after a reload the same week', async () => {
    server.refuseNextWith(allowanceExhausted())
    const first = openAsk()
    await ask(first, 'Why both sides?')
    expect(await thread(first).findByText(ALLOWANCE_WORDS.en)).toBeInTheDocument()

    cleanup()
    // Saturday: another day, the same week.
    vi.setSystemTime(new Date('2026-11-07T10:00:00Z'))
    const panel = openAsk()

    expect(await thread(panel).findByText('Why both sides?')).toBeInTheDocument()
    expect(thread(panel).getByText(ALLOWANCE_WORDS.en)).toBeInTheDocument()
    expect(sendAgain(panel)).not.toBeInTheDocument()
  })

  it('offers "Send again" on Monday in Zurich, and sends the same message', async () => {
    server.refuseNextWith(allowanceExhausted())
    const panel = openAsk()
    await ask(panel, 'Why both sides?')
    expect(await thread(panel).findByText(ALLOWANCE_WORDS.en)).toBeInTheDocument()

    // Sunday 23:30 in Zurich.
    vi.setSystemTime(new Date('2026-11-08T22:30:00Z'))
    await userEvent.type(composer(panel), 'x')
    expect(sendAgain(panel)).not.toBeInTheDocument()

    // Monday 00:10 in Zurich; the server's UTC day is still Sunday.
    vi.setSystemTime(new Date('2026-11-08T23:10:00Z'))
    await userEvent.type(composer(panel), 'y')
    await userEvent.click(await panel.findByRole('button', { name: 'Send again' }))

    await waitFor(() => expect(streamMock).toHaveBeenCalledTimes(2))
    const [first, second] = streamMock.mock.calls.map(([call]) => call.payload)
    expect(second.content).toBe('Why both sides?')
    expect(second.idempotencyKey).toBe(first.idempotencyKey)
  })
})

describe('the first question of a new conversation', () => {
  it.each(languages)('says so in %s', async (language) => {
    await i18n.changeLanguage(language)
    server.refuseNextWith(allowanceExhausted('made-1'), 'createConversation')
    const panel = openAsk(null)

    await send(panel, 'Why subtract 3 first?')

    expect(await panel.findByRole('alert')).toHaveTextContent(ALLOWANCE_WORDS[language])
    expect(panel.queryByText(i18n.t('chat:ask.thread.startFailed'))).not.toBeInTheDocument()
    expect(streamMock).not.toHaveBeenCalled()
  })

  it('asked again as it was, goes into the conversation the refusal named', async () => {
    server.refuseNextWith(allowanceExhausted('made-1'), 'createConversation')
    const panel = openAsk(null)
    await send(panel, 'Why subtract 3 first?')
    expect(await panel.findByRole('alert')).toHaveTextContent(ALLOWANCE_WORDS.en)
    // The refused question is back in the composer.
    expect(composer(panel)).toHaveValue('Why subtract 3 first?')

    // Next week: the conversation the server made is there, and the question goes into it.
    vi.setSystemTime(new Date('2026-11-09T08:00:00Z'))
    server.seed({ conversations: [conversation('made-1', 'Why subtract 3 first?')] })
    await send(panel, '')

    await waitFor(() => expect(streamMock).toHaveBeenCalledTimes(1))
    const [{ conversationId, payload }] = streamMock.mock.calls.map(([call]) => call)
    expect(conversationId).toBe('made-1')
    expect(payload.content).toBe('Why subtract 3 first?')
    expect(payload.idempotencyKey).toBe('initial-made-1')
  })
})
