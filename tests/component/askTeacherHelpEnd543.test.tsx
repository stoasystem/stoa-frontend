/**
 * How a teacher request ends from the student's side, driven through the real
 * Ask panel with only the API answered here (stoa-backend#147's walkthrough,
 * points 7 and 8).
 *
 * #543: while no teacher has taken it, the student takes the request back from
 * the card, after saying so a second time
 * (`POST /teacher-help/conversations/{id}/request/withdraw`). The card and the
 * week's allowance are then read again from the server. A 409 says why in
 * words: a teacher took it, or it has ended. A 503 says to try again.
 *
 * #544: a conversation has one request. Once it is over -- resolved,
 * cancelled, withdrawn, expired -- "Ask a teacher" is not offered under the
 * answers any more (it would hand back the same request), and the card points
 * to a new conversation instead.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AskHost } from '@/features/ask/AskHost'
import i18n from '@/i18n'
import { teacherHelpWithdrawErrorKey } from '@/lib/teacherHelpErrors'
import { ApiError, apiErrorFromBody } from '@/services/api/httpClient'
import { resetAsk } from '@/store/askStore'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { ChatMessage, Conversation } from '@/types/chat'
import { isEndedHelpRequest, isWithdrawableHelpRequest, type TeacherHelpRequest, type TeacherHelpStatus } from '@/types/teacherHelp'

vi.mock('@/services/analytics/analyticsClient', () => ({ trackEvent: vi.fn() }))
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
  withdrawTeacherHelpRequest: vi.fn(),
}))
vi.mock('@/services/student/studentApi', () => ({
  getStudentProfile: vi.fn(async () => ({ grade: '8', primarySubjects: ['math'] })),
}))
vi.mock('@/services/learning/memoryApi', () => ({
  getMyMemorySummary: vi.fn(async () => ({ recommendations: [], weakTopics: [] })),
}))

import { getConversation, getConversations } from '@/services/chat/chatApi'
import {
  createTeacherHelpRequest,
  getTeacherAvailability,
  getTeacherHelpRequest,
  withdrawTeacherHelpRequest,
} from '@/services/teacherHelp/teacherHelpApi'

const availabilityMock = vi.mocked(getTeacherAvailability)
const helpMock = vi.mocked(getTeacherHelpRequest)
const withdrawMock = vi.mocked(withdrawTeacherHelpRequest)
const requestHelpMock = vi.mocked(createTeacherHelpRequest)

const LANGUAGES = ['en', 'de', 'fr', 'it'] as const
const ENDED: TeacherHelpStatus[] = ['resolved', 'cancelled', 'withdrawn', 'expired']
const initialLanguage = i18n.language

/** What the server answers, through the same reader the HTTP client uses. */
function refusal(status: number, detail: Record<string, string>) {
  return apiErrorFromBody({ detail }, { status, fallback: 'refused' })
}

function help(status: TeacherHelpStatus | string): TeacherHelpRequest {
  return {
    requestId: 'r1',
    conversationId: 'c1',
    status: status as TeacherHelpStatus,
    teacherName: 'Frau Muster',
    createdAt: '2026-10-31T10:00:00.000Z',
  }
}

function message(id: string, role: ChatMessage['role'], content: string): ChatMessage {
  return { id, conversationId: 'c1', role, content, createdAt: '2026-10-31T10:00:00.000Z', status: 'completed' }
}

function conversation(): Conversation {
  return {
    id: 'c1',
    title: 'Fractions',
    subject: 'math',
    grade: '8',
    updatedAt: '2026-10-31T10:00:00.000Z',
    messages: [message('s1', 'student', 'How do I reduce 18/24?'), message('a1', 'assistant', 'Divide both by 6: 3/4.')],
  }
}

const tr = (key: string) => i18n.t(`chat:${key}`)

/** In this language's own words, not English filled in for a missing key. */
function ownWords(language: string, keys: string[]) {
  if (language === 'en') return
  const english = i18n.getFixedT('en', 'chat')
  for (const key of keys) expect(tr(key), key).not.toBe(english(key))
}

/** Ask on its page: the open conversation is the one in the address, as `/ask/:id` gives it. */
function RoutedAsk() {
  const { id } = useParams()
  return <AskHost route={{ conversationId: id ?? null }} />
}

function openAsk() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/ask/c1']}>
          <Routes>
            <Route path="/ask/:id" element={<RoutedAsk />} />
            <Route path="/ask" element={<RoutedAsk />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
  return within(screen.getByRole('complementary', { name: tr('ask.title') }))
}

async function card(ask: ReturnType<typeof openAsk>) {
  return within(await ask.findByRole('region', { name: tr('ask.help.cardLabel') }))
}

/** The answers have been drawn, so whatever sits under them has had its chance to appear. */
async function answered(ask: ReturnType<typeof openAsk>) {
  await within(ask.getByRole('log', { name: tr('ask.thread.label') })).findByText('Divide both by 6: 3/4.')
}

beforeEach(async () => {
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
  vi.mocked(getConversation).mockResolvedValue(conversation())
  availabilityMock.mockResolvedValue({
    online: true,
    availableTeachers: 2,
    teacherSupport: { canRequest: true, remainingCases: 5, weeklyCases: 6, blockedReason: null, resetsAt: null },
  })
})

const originalMatchMedia = window.matchMedia
afterEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
  window.matchMedia = originalMatchMedia
})

afterAll(async () => {
  await i18n.changeLanguage(initialLanguage)
})

describe('withdrawing a request no teacher has taken (#543)', () => {
  for (const language of LANGUAGES) {
    it(`takes it back after asking once more, then reads the card and the allowance again (${language})`, async () => {
      await i18n.changeLanguage(language)
      ownWords(language, [
        'ask.help.withdraw.action',
        'ask.help.withdraw.confirm',
        'ask.help.withdraw.yes',
        'ask.help.withdraw.keep',
        'ask.help.withdraw.errors.accepted',
        'ask.help.withdraw.errors.closed',
        'ask.help.withdraw.errors.unavailable',
      ])
      helpMock.mockResolvedValue(help('pending'))
      withdrawMock.mockImplementation(async () => {
        helpMock.mockResolvedValue(help('withdrawn'))
        return help('withdrawn')
      })
      const ask = openAsk()
      const before = await card(ask)

      await userEvent.click(before.getByRole('button', { name: tr('ask.help.withdraw.action') }))
      // Nothing is sent until the student says so a second time.
      expect(withdrawMock).not.toHaveBeenCalled()
      const question = before.getByRole('group', { name: tr('ask.help.withdraw.confirm') })
      const yes = within(question).getByRole('button', { name: tr('ask.help.withdraw.yes') })
      await waitFor(() => expect(yes).toHaveFocus())
      const reads = availabilityMock.mock.calls.length
      await userEvent.click(yes)

      expect(withdrawMock).toHaveBeenCalledWith('c1')
      const after = await card(ask)
      expect(await after.findByText(tr('ask.help.title.withdrawn'))).toBeInTheDocument()
      expect(after.getByText(tr('ask.help.status.withdrawn'))).toBeInTheDocument()
      // The week's case came back: the allowance is read again now, not at the next minute.
      await waitFor(() => expect(availabilityMock.mock.calls.length).toBeGreaterThan(reads))
      expect(after.queryByRole('button', { name: tr('ask.help.withdraw.action') })).not.toBeInTheDocument()
      expect(after.queryByRole('alert')).not.toBeInTheDocument()
    })
  }

  it.each(['pending', 'waiting_no_teacher', 'assigned'])('is offered while the request is %s', async (status) => {
    helpMock.mockResolvedValue(help(status))
    const ask = openAsk()
    expect(await (await card(ask)).findByRole('button', { name: 'Withdraw request' })).toBeInTheDocument()
  })

  it.each(['in_progress', ...ENDED, 'reassigning'])('is not offered while the request is %s', async (status) => {
    helpMock.mockResolvedValue(help(status))
    const ask = openAsk()
    const shown = await card(ask)
    await answered(ask)
    expect(shown.queryByRole('button', { name: 'Withdraw request' })).not.toBeInTheDocument()
  })

  it('keeps the request when the student changes their mind, with the keyboard back where it was', async () => {
    helpMock.mockResolvedValue(help('pending'))
    const ask = openAsk()
    const shown = await card(ask)
    const action = await shown.findByRole('button', { name: 'Withdraw request' })
    await userEvent.click(action)
    await userEvent.click(shown.getByRole('button', { name: 'Keep request' }))

    expect(withdrawMock).not.toHaveBeenCalled()
    expect(shown.queryByRole('group', { name: /Withdraw your request\?/ })).not.toBeInTheDocument()
    await waitFor(() => expect(shown.getByRole('button', { name: 'Withdraw request' })).toHaveFocus())
  })

  it('says so when a teacher took it first, and shows the request as it now stands', async () => {
    helpMock.mockResolvedValue(help('assigned'))
    withdrawMock.mockImplementation(async () => {
      helpMock.mockResolvedValue(help('in_progress'))
      throw refusal(409, { code: 'teacher_help_already_accepted' })
    })
    const ask = openAsk()
    const shown = await card(ask)
    await userEvent.click(await shown.findByRole('button', { name: 'Withdraw request' }))
    await userEvent.click(shown.getByRole('button', { name: 'Withdraw' }))

    expect(await shown.findByRole('alert')).toHaveTextContent(
      'A teacher has already taken your request, so it can no longer be withdrawn.',
    )
    expect(await shown.findByText('Frau Muster is helping you')).toBeInTheDocument()
    expect(shown.queryByRole('button', { name: 'Withdraw' })).not.toBeInTheDocument()
  })

  it('says so when the request had already ended', async () => {
    helpMock.mockResolvedValue(help('pending'))
    withdrawMock.mockImplementation(async () => {
      helpMock.mockResolvedValue(help('expired'))
      throw refusal(409, { code: 'teacher_help_request_closed' })
    })
    const ask = openAsk()
    const shown = await card(ask)
    await userEvent.click(await shown.findByRole('button', { name: 'Withdraw request' }))
    await userEvent.click(shown.getByRole('button', { name: 'Withdraw' }))

    expect(await shown.findByRole('alert')).toHaveTextContent('This request has already ended.')
    expect(await shown.findByText('No teacher was free in time')).toBeInTheDocument()
  })

  it('asks to try again when withdrawing is briefly unavailable, and the second try goes through', async () => {
    helpMock.mockResolvedValue(help('pending'))
    withdrawMock.mockRejectedValueOnce(
      refusal(503, {
        code: 'teacher_help_withdrawal_unavailable',
        message: 'Withdrawing is briefly unavailable. Please try again.',
        action: 'retry_same_case',
      }),
    )
    const ask = openAsk()
    const shown = await card(ask)
    await userEvent.click(await shown.findByRole('button', { name: 'Withdraw request' }))
    await userEvent.click(shown.getByRole('button', { name: 'Withdraw' }))

    expect(await shown.findByRole('alert')).toHaveTextContent(
      'Withdrawing is briefly unavailable. Please try again in a moment.',
    )
    // Still waiting, and the question is still there to answer again.
    withdrawMock.mockImplementation(async () => {
      helpMock.mockResolvedValue(help('withdrawn'))
      return help('withdrawn')
    })
    await userEvent.click(shown.getByRole('button', { name: 'Withdraw' }))
    expect(await shown.findByText('You withdrew the request')).toBeInTheDocument()
    expect(withdrawMock).toHaveBeenCalledTimes(2)
    await waitFor(() => expect(shown.queryByRole('alert')).not.toBeInTheDocument())
  })

  it('reads every refusal in words, and anything else as a plain failure', () => {
    expect(teacherHelpWithdrawErrorKey(refusal(409, { code: 'teacher_help_already_accepted' }))).toBe('ask.help.withdraw.errors.accepted')
    expect(teacherHelpWithdrawErrorKey(refusal(409, { code: 'teacher_help_request_closed' }))).toBe('ask.help.withdraw.errors.closed')
    expect(teacherHelpWithdrawErrorKey(refusal(404, { code: 'teacher_help_request_not_found' }))).toBe('ask.help.withdraw.errors.closed')
    expect(teacherHelpWithdrawErrorKey(refusal(503, { code: 'teacher_help_withdrawal_unavailable' }))).toBe('ask.help.withdraw.errors.unavailable')
    expect(teacherHelpWithdrawErrorKey(new ApiError('gateway', { status: 504 }))).toBe('ask.help.withdraw.errors.unavailable')
    expect(teacherHelpWithdrawErrorKey(refusal(409, { code: 'teacher_help_request_not_withdrawable' }))).toBe('ask.help.withdraw.errors.generic')
    expect(teacherHelpWithdrawErrorKey(new Error('offline'))).toBe('ask.help.withdraw.errors.generic')
  })
})

describe('one request per conversation (#544)', () => {
  for (const language of LANGUAGES) {
    it.each(ENDED)(`offers no "Ask a teacher" once the request is %s, and points to a new conversation (${language})`, async (status) => {
      await i18n.changeLanguage(language)
      ownWords(language, [`ask.help.body.${status}`, 'ask.help.newConversation'])
      helpMock.mockResolvedValue(help(status))
      const ask = openAsk()
      const shown = await card(ask)
      await answered(ask)

      expect(ask.queryByRole('button', { name: tr('ask.help.request') })).not.toBeInTheDocument()
      expect(shown.getByText(tr(`ask.help.body.${status}`))).toBeInTheDocument()
      expect(shown.getByRole('button', { name: tr('ask.help.newConversation') })).toBeInTheDocument()
    })
  }

  it.each(ENDED)('no longer tells an English student to ask again under an answer once it is %s', async (status) => {
    helpMock.mockResolvedValue(help(status))
    const ask = openAsk()
    const shown = await card(ask)
    const said = shown.getByText(tr(`ask.help.body.${status}`)).textContent ?? ''
    expect(said).not.toMatch(/under any answer/i)
    expect(said).toMatch(/new conversation/i)
  })

  it('goes back to the list, where the next question starts a new conversation', async () => {
    helpMock.mockResolvedValue(help('resolved'))
    const ask = openAsk()
    const shown = await card(ask)
    await userEvent.click(shown.getByRole('button', { name: 'New conversation' }))

    await waitFor(() => expect(ask.queryByRole('log', { name: 'Messages' })).not.toBeInTheDocument())
    expect(ask.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument()
    expect(ask.getByRole('heading', { name: 'Ask' })).toBeInTheDocument()
  })

  it('offers no "Ask a teacher" while the request is still open either, nor a new conversation', async () => {
    helpMock.mockResolvedValue(help('pending'))
    const ask = openAsk()
    const shown = await card(ask)
    await answered(ask)
    expect(ask.queryByRole('button', { name: 'Ask a teacher' })).not.toBeInTheDocument()
    expect(shown.queryByRole('button', { name: 'New conversation' })).not.toBeInTheDocument()
  })

  it('still offers "Ask a teacher" in a conversation that never had a request', async () => {
    helpMock.mockRejectedValue(new ApiError('never escalated', { status: 404 }))
    requestHelpMock.mockResolvedValue(help('pending'))
    const ask = openAsk()
    await userEvent.click(await ask.findByRole('button', { name: 'Ask a teacher' }))
    await waitFor(() => expect(requestHelpMock).toHaveBeenCalledWith({ conversationId: 'c1' }))
  })

  it('names the statuses that end a request, and the ones a student may still take back', () => {
    const all: TeacherHelpStatus[] = ['pending', 'waiting_no_teacher', 'assigned', 'in_progress', ...ENDED]
    expect(all.filter((status) => isEndedHelpRequest(status))).toEqual(ENDED)
    expect(all.filter((status) => isWithdrawableHelpRequest(status))).toEqual(['pending', 'waiting_no_teacher', 'assigned'])
    expect(isEndedHelpRequest('reassigning' as never)).toBe(false)
    expect(isWithdrawableHelpRequest('reassigning' as never)).toBe(false)
  })
})
