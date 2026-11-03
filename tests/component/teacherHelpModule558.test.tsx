/**
 * #558: 真人求助 as the student sees it, driven through the module's own
 * interface (`useTeacherHelp`) against the in-memory server behind Ask (#571). What
 * the student sees, how often the request and the conversation are read, what
 * a change of status reads again, asking and taking back, and every refusal
 * as the translation key the view says. The words themselves, and the wiring
 * into Ask, are the panel tests' (askTeacherHelpEnd543, askAnswerSections506).
 */
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query'
import { act, cleanup, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AskServerProvider } from '@/features/ask/server/askServer'
import { useTeacherHelp } from '@/features/ask/teacherHelp/useTeacherHelp'
import { useConversationsQuery } from '@/hooks/chat/useConversationsQuery'
import { trackEvent } from '@/services/analytics/analyticsClient'
import { ApiError } from '@/services/api/httpClient'
import type { ChatMessage, StructuredAnswer } from '@/types/chat'
import type { TeacherHelpRequest, TeacherHelpStatus, TeacherSupportStanding } from '@/types/teacherHelp'
import { createFakeAskServer, type FakeAskServer } from '../fakes/askServer'

/** The server behind Ask, in memory: one student's conversation c1, and its request for a teacher. */
let server: FakeAskServer
let readHelp: FakeAskServer['teacherHelp']['getTeacherHelpRequest']
let askHelp: FakeAskServer['teacherHelp']['createTeacherHelpRequest']
let takeBack: FakeAskServer['teacherHelp']['withdrawTeacherHelpRequest']
let readAvailability: FakeAskServer['teacherHelp']['getTeacherAvailability']
let readConversation: FakeAskServer['conversations']['getConversation']
let readList: FakeAskServer['conversations']['getConversations']
const track = vi.mocked(trackEvent)

const UPDATED = '2026-11-02T10:00:00.000Z'

function help(status: TeacherHelpStatus | string, teacherName?: string): TeacherHelpRequest {
  return { requestId: 'r1', conversationId: 'c1', status: status as TeacherHelpStatus, createdAt: UPDATED, teacherName }
}

function support(overrides: Partial<TeacherSupportStanding> = {}): TeacherSupportStanding {
  return { canRequest: true, remainingCases: 2, weeklyCases: 3, blockedReason: null, resetsAt: null, ...overrides }
}

function message(id: string, role: ChatMessage['role'], overrides: Partial<ChatMessage> = {}): ChatMessage {
  return { id, conversationId: 'c1', role, content: id, createdAt: UPDATED, status: 'completed', ...overrides }
}

function answer(id: string, structured: Partial<StructuredAnswer> | null = null, overrides: Partial<ChatMessage> = {}) {
  return message(id, 'assistant', { structured: structured && { kind: 'answer', ...structured }, ...overrides })
}

const ANSWERED = [message('s1', 'student'), answer('a1')]

/** The request for a teacher, as the server reports it from now on. */
function helpIs(request: TeacherHelpRequest) {
  server.seed({ helpRequests: [request] })
}

/** Whether a teacher is online, and the week's allowance, as the server answers them from now on. */
function standing({ online = server.availability.online, support: teacherSupport = server.availability.teacherSupport ?? null }: {
  online?: boolean
  support?: TeacherSupportStanding | null
}) {
  server.availability = { online, availableTeachers: online ? 1 : 0, teacherSupport }
}

function refusal(status: number, code?: string) {
  return new ApiError('refused', { status, code })
}

function newClient(staleTime = 0) {
  return new QueryClient({ defaultOptions: { queries: { retry: false, staleTime }, mutations: { retry: false } } })
}

/** Ask with conversation c1 open: its teacher help, beside the list that stays mounted. */
function openHelp({
  messages = ANSWERED,
  isStreaming = false,
  client = newClient(),
}: { messages?: readonly ChatMessage[]; isStreaming?: boolean; client?: QueryClient } = {}) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <AskServerProvider value={server}>{children}</AskServerProvider>
    </QueryClientProvider>
  )
  return renderHook(
    (props: { conversationId: string; messages: readonly ChatMessage[]; isStreaming: boolean }) => {
      useConversationsQuery()
      return useTeacherHelp(props)
    },
    { wrapper, initialProps: { conversationId: 'c1', messages, isStreaming } },
  )
}

type Opened = ReturnType<typeof openHelp>

/** Advance the clock, then let what that set off land. waitFor is unusable under fake timers. */
async function advance(ms = 0) {
  for (const step of [ms, 10]) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(step)
    })
  }
}

async function press(opened: Opened, intent: 'request' | 'withdraw') {
  act(() => opened.result.current[intent]())
  await advance()
}

function offerOf(opened: Opened) {
  const { view } = opened.result.current
  if (view.kind !== 'offer' && view.kind !== 'asking') throw new Error(`no offer but ${view.kind}`)
  return view.offer
}

function cardOf(opened: Opened) {
  const { view } = opened.result.current
  if (!('card' in view)) throw new Error(`no card but ${view.kind}`)
  return view.card
}

beforeEach(() => {
  vi.useFakeTimers()
  // c1 never escalated: the fake's own default. A request asked for is r1.
  server = createFakeAskServer()
  ;({
    getTeacherHelpRequest: readHelp,
    createTeacherHelpRequest: askHelp,
    withdrawTeacherHelpRequest: takeBack,
    getTeacherAvailability: readAvailability,
  } = server.teacherHelp)
  ;({ getConversation: readConversation, getConversations: readList } = server.conversations)
  standing({ online: true, support: support() })
  server.seed({
    conversations: [{ id: 'c1', title: 'Linear equations', subject: 'math', grade: '8', updatedAt: UPDATED, messages: ANSWERED }],
    list: [{ id: 'c1', title: 'Linear equations', subject: 'math', grade: '8', updatedAt: UPDATED }],
    newHelpRequests: [{ requestId: 'r1', createdAt: UPDATED }],
  })
})

afterEach(() => {
  // Unmounted first: a tab shown again reads what is still mounted.
  cleanup()
  focusManager.setFocused(undefined)
  vi.useRealTimers()
  vi.resetAllMocks()
})

describe('what the student sees', () => {
  it('offers "Ask a teacher" under the answer, with who is online and the week’s allowance', async () => {
    const opened = openHelp()
    await advance()
    expect(opened.result.current.view).toEqual({
      kind: 'offer',
      offer: {
        underMessageId: 'a1',
        suggested: false,
        teachersOnline: true,
        support: support(),
        blockedKey: null,
        errorKey: null,
      },
    })
  })

  it('says when no teacher is online', async () => {
    standing({ online: false })
    const opened = openHelp()
    await advance()
    expect(offerOf(opened).teachersOnline).toBe(false)
  })

  it('shows nothing before there is an answer, nor while one is written', async () => {
    const before = openHelp({ messages: [message('s1', 'student')] })
    await advance()
    expect(before.result.current.view).toEqual({ kind: 'none' })
    before.unmount()

    const writing = openHelp({ messages: ANSWERED, isStreaming: true })
    await advance()
    expect(writing.result.current.view).toEqual({ kind: 'none' })
  })

  it('sits under the latest answer once it is whole, from before the sections too', async () => {
    const cases: [ChatMessage[], { underMessageId: string; suggested: boolean } | null][] = [
      [[answer('a1')], { underMessageId: 'a1', suggested: false }],
      [[answer('a1', { suggestTeacher: true }), answer('a2')], { underMessageId: 'a2', suggested: false }],
      [[answer('a1'), answer('a2', { suggestTeacher: true })], { underMessageId: 'a2', suggested: true }],
      [[answer('a1'), message('s2', 'student')], { underMessageId: 'a1', suggested: false }],
      [[answer('a1'), answer('a2', null, { status: 'streaming' })], null],
      [[answer('a1'), answer('a2', null, { status: 'failed' })], null],
      [[message('s1', 'student')], null],
    ]
    for (const [messages, place] of cases) {
      const opened = openHelp({ messages })
      await advance()
      const { view } = opened.result.current
      expect(view.kind === 'offer' ? { underMessageId: view.offer.underMessageId, suggested: view.offer.suggested } : null)
        .toEqual(place)
      opened.unmount()
    }
  })

  it.each([
    ['pending', 'waiting', true],
    ['waiting_no_teacher', 'waiting', true],
    // #397: a status this app does not know yet waits, and is not taken back.
    ['reassigning', 'waiting', false],
    ['assigned', 'assigned', true],
    ['in_progress', 'withTeacher', false],
    ['resolved', 'ended', false],
    ['cancelled', 'ended', false],
    ['withdrawn', 'ended', false],
    ['expired', 'ended', false],
  ])('shows a request that is %s as %s', async (status, kind, withdrawable) => {
    helpIs(help(status, 'Frau Keller'))
    const opened = openHelp()
    await advance()
    expect(opened.result.current.view).toEqual({
      kind,
      card: {
        request: help(status, 'Frau Keller'),
        teachersOnline: true,
        withdraw: { withdrawable, withdrawing: false, errorKey: null },
      },
    })
    expect(opened.result.current.teacherName).toBe('Frau Keller')
  })

  it('keeps showing the card while an answer is written', async () => {
    helpIs(help('in_progress'))
    const opened = openHelp({ isStreaming: true })
    await advance()
    expect(opened.result.current.view.kind).toBe('withTeacher')
  })

  it('draws the same view from one render to the next while nothing in it changed (#416)', async () => {
    const opened = openHelp()
    await advance()
    const first = opened.result.current.view
    opened.rerender({ conversationId: 'c1', messages: ANSWERED, isStreaming: false })
    expect(opened.result.current.view).toBe(first)
  })
})

describe('why "Ask a teacher" cannot be pressed', () => {
  it.each([
    [support(), null],
    [null, null],
    [support({ canRequest: false, remainingCases: 0, blockedReason: 'teacher_support_allowance_exhausted' }), 'teacher.errors.allowanceExhausted'],
    [support({ canRequest: false, remainingCases: 0, blockedReason: null }), 'teacher.errors.allowanceExhausted'],
    [support({ canRequest: false, remainingCases: 0, blockedReason: 'teacher_support_not_included' }), 'teacher.errors.planDenied'],
  ])('with the allowance %j it says %s', async (allowance, key) => {
    standing({ support: allowance })
    const opened = openHelp()
    await advance()
    expect(offerOf(opened).blockedKey).toBe(key)
    expect(offerOf(opened).support).toEqual(allowance)
  })
})

describe('how often it is read', () => {
  it('reads the request and the conversation every five seconds while a teacher has it', async () => {
    helpIs(help('in_progress'))
    openHelp()
    await advance()
    expect(readHelp).toHaveBeenCalledTimes(1)
    expect(readConversation).toHaveBeenCalledTimes(1)

    for (let poll = 2; poll <= 4; poll += 1) {
      await advance(5_000)
      expect(readHelp).toHaveBeenCalledTimes(poll)
      expect(readConversation).toHaveBeenCalledTimes(poll)
    }
  })

  it.each(['pending', 'waiting_no_teacher', 'reassigning'])('reads every fifteen seconds while it is %s', async (status) => {
    helpIs(help(status))
    openHelp()
    await advance()

    await advance(5_000)
    expect(readHelp).toHaveBeenCalledTimes(1)
    expect(readConversation).toHaveBeenCalledTimes(1)

    await advance(10_000)
    expect(readHelp).toHaveBeenCalledTimes(2)
    expect(readConversation).toHaveBeenCalledTimes(2)
  })

  it.each(['resolved', 'cancelled', 'withdrawn', 'expired'])('stops reading once the request is %s', async (status) => {
    helpIs(help(status))
    openHelp()
    await advance()
    await advance(60_000)
    expect(readHelp).toHaveBeenCalledTimes(1)
    expect(readConversation).toHaveBeenCalledTimes(1)
  })

  it('speeds up when a waiting request is offered to a teacher', async () => {
    helpIs(help('pending'))
    const opened = openHelp()
    await advance()

    helpIs(help('assigned'))
    await advance(15_000)
    expect(readHelp).toHaveBeenCalledTimes(2)
    expect(opened.result.current.view.kind).toBe('assigned')

    await advance(10_000)
    expect(readHelp).toHaveBeenCalledTimes(4)
  })

  it('reads nothing while the tab is hidden', async () => {
    helpIs(help('in_progress'))
    openHelp()
    await advance()

    focusManager.setFocused(false)
    await advance(30_000)
    expect(readHelp).toHaveBeenCalledTimes(1)
    expect(readConversation).toHaveBeenCalledTimes(1)
  })

  // #405: a conversation that was never escalated is answered 404. That is its
  // answer, not a failure: kept as no help, and not asked again each time the
  // conversation opens, with the app's own staleTime (src/app/query/queryClient.ts).
  it('keeps a conversation never escalated as no help, and does not read it again when it opens again', async () => {
    const client = newClient(60_000)
    const first = openHelp({ client })
    await advance()
    expect(first.result.current.view.kind).toBe('offer')
    first.unmount()

    const again = openHelp({ client })
    await advance()
    expect(again.result.current.view.kind).toBe('offer')
    await advance(30_000)
    expect(readHelp).toHaveBeenCalledTimes(1)
  })

  it('reads the request again when it opens again after any other failure', async () => {
    // Each reading of the request fails.
    server.refuseNextWith(refusal(503), 'getTeacherHelpRequest')
    server.refuseNextWith(refusal(503), 'getTeacherHelpRequest')
    const client = newClient(60_000)
    const first = openHelp({ client })
    await advance()
    first.unmount()

    openHelp({ client })
    await advance()
    expect(readHelp).toHaveBeenCalledTimes(2)
  })
})

describe('a change of status', () => {
  it('reads the conversation and the list once more, and only then', async () => {
    helpIs(help('pending'))
    const opened = openHelp()
    await advance()
    // The first reading of the request is no change.
    expect(readConversation).toHaveBeenCalledTimes(1)
    expect(readList).toHaveBeenCalledTimes(1)

    await press(opened, 'withdraw')
    expect(opened.result.current.view.kind).toBe('ended')
    expect(readConversation).toHaveBeenCalledTimes(2)
    expect(readList).toHaveBeenCalledTimes(2)

    await advance(60_000)
    expect(readConversation).toHaveBeenCalledTimes(2)
    expect(readList).toHaveBeenCalledTimes(2)
  })

  it('reads the list once more when a poll finds the request taken', async () => {
    helpIs(help('pending'))
    openHelp()
    await advance()

    helpIs(help('assigned'))
    await advance(15_000)
    expect(readList).toHaveBeenCalledTimes(2)
    await advance(5_000)
    expect(readList).toHaveBeenCalledTimes(2)
  })
})

describe('asking a teacher', () => {
  it('asks in this conversation, says so while it is on its way, then shows the request as the server has it', async () => {
    const letGo = server.holdNext('createTeacherHelpRequest')
    const opened = openHelp()
    await advance()

    await press(opened, 'request')
    expect(askHelp).toHaveBeenCalledWith({ conversationId: 'c1' })
    expect(opened.result.current.view.kind).toBe('asking')

    letGo()
    await advance()
    expect(opened.result.current.view.kind).toBe('waiting')
    expect(cardOf(opened).request).toEqual(help('pending'))
    expect(track).toHaveBeenCalledWith('teacher_help_requested', { requestId: 'r1', conversationId: 'c1', status: 'pending' })
  })

  it('stays "on its way" while an answer is being written', async () => {
    // Never let go.
    server.holdNext('createTeacherHelpRequest')
    const opened = openHelp()
    await advance()
    await press(opened, 'request')
    opened.rerender({ conversationId: 'c1', messages: ANSWERED, isStreaming: true })
    expect(opened.result.current.view.kind).toBe('asking')
  })

  it('reads the week’s allowance again at once', async () => {
    const opened = openHelp()
    await advance()
    expect(readAvailability).toHaveBeenCalledTimes(1)

    await press(opened, 'request')
    expect(readAvailability).toHaveBeenCalledTimes(2)
  })

  it('offers nothing more in the conversation once asked (#544)', async () => {
    helpIs(help('resolved'))
    const opened = openHelp({ messages: [...ANSWERED, message('s2', 'student'), answer('a2', { suggestTeacher: true })] })
    await advance()
    expect(opened.result.current.view.kind).toBe('ended')
  })

  it.each([
    [refusal(503, 'teacher_support_admission_recoverable'), 'teacher.errors.temporary'],
    [refusal(403, 'teacher_support_not_included'), 'teacher.errors.planDenied'],
    [refusal(429, 'teacher_support_allowance_exhausted'), 'teacher.errors.allowanceExhausted'],
    // The code is read before the status.
    [refusal(409, 'teacher_support_admission_recoverable'), 'teacher.errors.temporary'],
    [refusal(403), 'teacher.errors.planDenied'],
    [refusal(409), 'teacher.errors.alreadyOpen'],
    [refusal(429), 'teacher.errors.allowanceExhausted'],
    [refusal(502), 'teacher.errors.temporary'],
    [refusal(504), 'teacher.errors.temporary'],
    [refusal(418), 'teacher.errors.generic'],
    [new Error('offline'), 'teacher.errors.generic'],
  ])('says a refusal (%s) as %s, counts it, and reads the allowance again', async (error, key) => {
    server.refuseNextWith(error, 'createTeacherHelpRequest')
    const opened = openHelp()
    await advance()

    await press(opened, 'request')
    expect(opened.result.current.view.kind).toBe('offer')
    expect(offerOf(opened).errorKey).toBe(key)
    expect(track).toHaveBeenCalledWith('teacher_help_request_failed', { reason: key })
    expect(track).not.toHaveBeenCalledWith('teacher_help_requested', expect.anything())
    expect(readAvailability).toHaveBeenCalledTimes(2)
  })
})

describe('taking the request back (#543)', () => {
  it('withdraws, then reads the request and the week’s allowance back', async () => {
    helpIs(help('pending'))
    const opened = openHelp()
    await advance()
    expect(readAvailability).toHaveBeenCalledTimes(1)

    await press(opened, 'withdraw')
    expect(takeBack).toHaveBeenCalledWith('c1')
    expect(opened.result.current.view.kind).toBe('ended')
    expect(cardOf(opened).request.status).toBe('withdrawn')
    expect(readAvailability).toHaveBeenCalledTimes(2)
  })

  it('says it is withdrawing while it is', async () => {
    helpIs(help('pending'))
    // Never let go.
    server.holdNext('withdrawTeacherHelpRequest')
    const opened = openHelp()
    await advance()
    await press(opened, 'withdraw')
    expect(cardOf(opened).withdraw.withdrawing).toBe(true)
  })

  it.each([
    [refusal(409, 'teacher_help_already_accepted'), 'ask.help.withdraw.errors.accepted'],
    [refusal(409, 'teacher_help_request_closed'), 'ask.help.withdraw.errors.closed'],
    [refusal(404, 'teacher_help_request_not_found'), 'ask.help.withdraw.errors.closed'],
    [refusal(503, 'teacher_help_withdrawal_unavailable'), 'ask.help.withdraw.errors.unavailable'],
    [refusal(502), 'ask.help.withdraw.errors.unavailable'],
    [refusal(504), 'ask.help.withdraw.errors.unavailable'],
    [refusal(409, 'teacher_help_request_not_withdrawable'), 'ask.help.withdraw.errors.generic'],
    [new Error('offline'), 'ask.help.withdraw.errors.generic'],
  ])('says a refusal (%s) as %s, and reads the request and the allowance again', async (error, key) => {
    helpIs(help('assigned'))
    server.refuseNextWith(error, 'withdrawTeacherHelpRequest')
    const opened = openHelp()
    await advance()

    await press(opened, 'withdraw')
    expect(cardOf(opened).withdraw.errorKey).toBe(key)
    expect(readHelp).toHaveBeenCalledTimes(2)
    expect(readAvailability).toHaveBeenCalledTimes(2)
  })

  it('keeps saying why while the request moves on, and forgets it once a withdrawal goes through', async () => {
    helpIs(help('assigned'))
    server.refuseNextWith(refusal(409, 'teacher_help_already_accepted'), 'withdrawTeacherHelpRequest')
    const opened = openHelp()
    await advance()
    await press(opened, 'withdraw')

    helpIs(help('in_progress'))
    await advance(5_000)
    expect(opened.result.current.view.kind).toBe('withTeacher')
    expect(cardOf(opened).withdraw.errorKey).toBe('ask.help.withdraw.errors.accepted')

    // Refused once only: the next withdrawal goes through.
    await press(opened, 'withdraw')
    expect(opened.result.current.view.kind).toBe('ended')
    expect(cardOf(opened).withdraw.errorKey).toBeNull()
  })
})
