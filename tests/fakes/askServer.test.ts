/**
 * The in-memory server behind Ask (#571), on its own: what each of its
 * scripts makes it answer, so a test that leans on it leans on these.
 */
import { describe, expect, it } from 'vitest'
import { ApiError } from '@/services/api/httpClient'
import type { ChatStreamEvent } from '@/types/chat'
import { createFakeAskServer } from './askServer'

const UPDATED = '2026-11-03T10:00:00.000Z'

const conversation = (id: string, content = 'Why subtract 3 first?') => ({
  id,
  title: 'Linear equations',
  subject: 'math',
  grade: '8',
  updatedAt: UPDATED,
  messages: [{ id: 's1', conversationId: id, role: 'student' as const, content, createdAt: UPDATED, status: 'completed' as const }],
})

const send = (server: ReturnType<typeof createFakeAskServer>, idempotencyKey: string, events: ChatStreamEvent[] = []) =>
  server.stream.streamConversationMessage({
    conversationId: 'c1',
    payload: { content: 'Is x = 5?', idempotencyKey },
    onEvent: (event) => events.push(event),
  })

describe('seed', () => {
  it('answers with what it was given, and with what it was given again', async () => {
    const server = createFakeAskServer()
    server.seed({
      conversations: [conversation('c1')],
      list: [{ id: 'c1', title: 'Linear equations', subject: 'math', grade: '8', updatedAt: UPDATED }],
      helpRequests: [{ requestId: 'r1', conversationId: 'c1', status: 'pending', createdAt: UPDATED }],
    })

    expect(await server.conversations.getConversation('c1')).toEqual(conversation('c1'))
    expect((await server.conversations.getConversations()).items.map((item) => item.id)).toEqual(['c1'])
    expect((await server.teacherHelp.getTeacherHelpRequest('c1')).status).toBe('pending')

    server.seed({
      conversations: [conversation('c1', 'Why divide?')],
      helpRequests: [{ requestId: 'r1', conversationId: 'c1', status: 'in_progress', teacherName: 'Ms Bergmann', createdAt: UPDATED }],
    })
    expect((await server.conversations.getConversation('c1')).messages[0].content).toBe('Why divide?')
    expect(await server.teacherHelp.getTeacherHelpRequest('c1')).toMatchObject({ status: 'in_progress', teacherName: 'Ms Bergmann' })
  })

  it('answers 404 for what it does not hold, as the server does', async () => {
    const server = createFakeAskServer()

    await expect(server.conversations.getConversation('c1')).rejects.toMatchObject({ status: 404 })
    await expect(server.teacherHelp.getTeacherHelpRequest('c1')).rejects.toMatchObject({ status: 404 })
    await expect(server.stream.getGenerationProgress('c1', undefined, 'k-1')).rejects.toMatchObject({
      status: 404,
      code: 'message_command_not_found',
    })
  })

  it('makes conversations under the ids it was given, and lists them', async () => {
    const server = createFakeAskServer()
    server.seed({ newConversationIds: ['new-1'] })

    const made = await server.conversations.createConversation({ subject: 'math', grade: '8', initialMessage: 'Why?' })

    expect(made.id).toBe('new-1')
    expect((await server.conversations.getConversations()).items.map((item) => item.id)).toEqual(['new-1'])
    // Its first question is answered under initial-<id>.
    expect((await server.stream.getGenerationProgress('new-1', undefined, 'initial-new-1')).status).toBe('completed')
  })
})

describe('answerWith', () => {
  it('streams the events it was given, holds where it was told, and ends as it was told', async () => {
    const server = createFakeAskServer()
    let finish!: () => void
    const finished = new Promise<void>((resolve) => (finish = resolve))
    server.answerWith(
      {
        events: [{ type: 'message_delta', messageId: 'a1', delta: 'Subtract 5' }],
        until: finished,
        after: [{ type: 'message_done', messageId: 'a1', status: 'completed' }],
      },
      { outcome: 'accepted', steps: ['Checking your steps'] },
    )

    const events: ChatStreamEvent[] = []
    const first = send(server, 'k-1', events)
    await Promise.resolve()
    expect(events.map((event) => event.type)).toEqual(['message_delta'])
    expect((await server.stream.getGenerationProgress('c1', undefined, 'k-1')).status).toBe('ai_running')
    finish()
    expect(await first).toBe('streamed')
    expect(events.map((event) => event.type)).toEqual(['message_delta', 'message_done'])
    expect((await server.stream.getGenerationProgress('c1', undefined, 'k-1')).status).toBe('completed')

    // Only stored: the command runs, with its steps, until the test ends it.
    expect(await send(server, 'k-2')).toBe('accepted')
    expect(await server.stream.getGenerationProgress('c1', undefined, 'k-2')).toMatchObject({
      status: 'ai_running',
      steps: ['Checking your steps'],
    })
    server.seed({ generations: [{ conversationId: 'c1', idempotencyKey: 'k-2', status: 'completed' }] })
    expect((await server.stream.getGenerationProgress('c1', undefined, 'k-2')).status).toBe('completed')

    // Past the answers given: streamed, with nothing on the stream.
    expect(await send(server, 'k-3')).toBe('streamed')
  })

  it('leaves the command where it was told, seeds what the answer leaves, and refuses after all that', async () => {
    const server = createFakeAskServer()
    server.seed({ conversations: [conversation('c1')] })
    const unavailable = new Error('Request failed with status code 503')
    let hang!: () => void
    server.answerWith(
      { refuse: unavailable, status: 'failed', retryable: true },
      { until: new Promise<void>((resolve) => (hang = resolve)), status: 'completed' },
      { leaves: { conversations: [conversation('c1', 'Is x = 5?')] } },
    )

    // Refused, its command read back as failed and to be sent again.
    await expect(send(server, 'k-1')).rejects.toBe(unavailable)
    expect(await server.stream.getGenerationProgress('c1', undefined, 'k-1')).toMatchObject({ status: 'failed', retryable: true })

    // Ended while the request still hangs.
    const hanging = send(server, 'k-2')
    await Promise.resolve()
    expect((await server.stream.getGenerationProgress('c1', undefined, 'k-2')).status).toBe('completed')
    hang()
    expect(await hanging).toBe('streamed')

    // The conversation reads the answer back once the request is through, not before.
    expect((await server.conversations.getConversation('c1')).messages[0].content).toBe('Why subtract 3 first?')
    expect(await send(server, 'k-3')).toBe('streamed')
    expect((await server.conversations.getConversation('c1')).messages[0].content).toBe('Is x = 5?')
  })
})

describe('refuseNextWith', () => {
  it('refuses the next call of that request only, and stores nothing of it', async () => {
    const server = createFakeAskServer()
    const limit = new ApiError('limit', { status: 429, code: 'message_daily_limit' })
    server.refuseNextWith(limit)
    server.refuseNextWith(new ApiError('exhausted', { status: 429 }), 'createTeacherHelpRequest')

    await expect(send(server, 'k-1')).rejects.toBe(limit)
    await expect(server.stream.getGenerationProgress('c1', undefined, 'k-1')).rejects.toMatchObject({ status: 404 })
    expect(await send(server, 'k-1')).toBe('streamed')

    await expect(server.teacherHelp.createTeacherHelpRequest({ conversationId: 'c1' })).rejects.toMatchObject({ status: 429 })
    expect((await server.teacherHelp.createTeacherHelpRequest({ conversationId: 'c1' })).status).toBe('pending')
    expect((await server.teacherHelp.getTeacherHelpRequest('c1')).status).toBe('pending')
  })
})

describe('holdNext', () => {
  it('holds the next call until it is let go, then answers from what the server holds by then', async () => {
    const server = createFakeAskServer()
    server.seed({ conversations: [conversation('c1')] })
    const release = server.holdNext('getConversation')

    let read: string | undefined
    const held = server.conversations.getConversation('c1').then((answer) => (read = answer.messages[0].content))
    server.seed({ conversations: [conversation('c1', 'Why divide?')] })
    await Promise.resolve()
    expect(read).toBeUndefined()

    release()
    await held
    expect(read).toBe('Why divide?')
    // The next call is not held.
    expect((await server.conversations.getConversation('c1')).id).toBe('c1')
  })
})

describe('availability, profile and memory summary', () => {
  it('are answered as they stand when asked', async () => {
    const server = createFakeAskServer()
    expect(await server.teacherHelp.getTeacherAvailability()).toEqual({ online: true, availableTeachers: 2 })
    expect((await server.student.getStudentProfile()).grade).toBe('8')
    expect((await server.memory.getMyMemorySummary()).weakTopics).toEqual([])

    server.availability = { online: false, availableTeachers: 0, nextWindow: '16:00' }
    expect(await server.teacherHelp.getTeacherAvailability()).toEqual({ online: false, availableTeachers: 0, nextWindow: '16:00' })
  })

  it('takes a request back, as withdrawn', async () => {
    const server = createFakeAskServer()
    await server.teacherHelp.createTeacherHelpRequest({ conversationId: 'c1' })

    expect((await server.teacherHelp.withdrawTeacherHelpRequest('c1')).status).toBe('withdrawn')
    expect((await server.teacherHelp.getTeacherHelpRequest('c1')).status).toBe('withdrawn')
  })
})
