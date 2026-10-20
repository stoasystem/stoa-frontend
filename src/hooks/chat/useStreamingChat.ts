import i18n from '@/i18n'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  streamConversationMessage,
  type StreamMessagePayload,
} from '@/services/chat/chatStreamApi'
import { trackEvent } from '@/services/analytics/analyticsClient'
import { chatQueryKeys } from '@/services/chat/chatQueryKeys'
import { toUserFacingError } from '@/lib/userFacingText'
import type { ChatAttachment, ChatMessage, ChatStreamEvent, Conversation } from '@/types/chat'
import { commandMessageIds } from '@/services/chat/commandMessageIds'
import { watchGeneration, type GenerationOutcome } from '@/services/chat/generationWatch'
import {
  dropFailedMessage,
  keepFailedMessage,
  readFailedMessages,
  readPendingMessage,
  writePendingMessage,
  type FailedMessage,
  type PendingMessage,
} from '@/lib/pendingChatMessages'
import { detachedSendFor } from '@/services/chat/detachedSend'
import { isSameSession, storedRefreshToken } from '@/services/auth/sessionRefresh'
import { currentSessionToken, useAuthStore } from '@/store/authStore'

// Set when the failed command may be sent again as the same message; absent
// when the answer was paid for but unusable, so a retry is a new message.
type RetryPayload = FailedMessage['student']['retryPayload']

type LocalChatMessage = ChatMessage & {
  retryPayload?: RetryPayload
  /** On a failed student bubble: the bubble that stood for its answer. */
  failedAnswerId?: string
}

/**
 * The send request is given this long. It may hold its connection until the
 * answer is whole, but the gateway cuts it off at 29 seconds; past that it is
 * hanging, and the answer is left to `/generation` (#326 K6).
 */
export const SEND_REQUEST_LIMIT_MS = 35_000

/** The account whose words a failed message is: kept only under it. */
const signedInAccount = () => useAuthStore.getState().user?.id ?? null

function localFailedMessages(conversationId: string | null): LocalChatMessage[] {
  if (!conversationId) return []
  return readFailedMessages(conversationId, signedInAccount()).flatMap(({ student, answer }) =>
    answer ? [{ ...student, failedAnswerId: answer.id }, answer] : [student],
  )
}

type SendStreamingMessagePayload = Omit<StreamMessagePayload, 'idempotencyKey'> & {
  attachments?: ChatAttachment[]
}

/** In the reader's language: it stood in English under every interface (#183). */
const streamErrorFallback = () => i18n.t('chat:ask.thread.answerFailed')

// Kept in the tab while unanswered: see pendingChatMessages.
export { PENDING_MESSAGE_KEY_PREFIX } from '@/lib/pendingChatMessages'
const readPending = readPendingMessage
const writePending = writePendingMessage

function createLocalId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function getErrorMessage(error: unknown) {
  return toUserFacingError(error, streamErrorFallback())
}

/**
 * The conversation as the student sees it: the server's messages, and the local
 * ones it does not have yet.
 *
 * Local bubbles carry the server's ids, so one the server already holds is
 * shown once, as the server's - except a failed student message, whose local
 * bubble carries the retry and so stands in for the server's copy.
 */
export function mergeWithServerMessages<T extends ChatMessage>(
  serverMessages: ChatMessage[],
  localMessages: T[],
): Array<ChatMessage | T> {
  const answered = answeredOnServer(serverMessages)
  const failedLocalIds = new Set(
    localMessages
      .filter((message) => message.role === 'student' && message.status === 'failed' && !answered.has(message.id))
      .map((message) => message.id),
  )
  const serverIds = new Set(serverMessages.map((message) => message.id))
  // What stood for the answer of a failed question the server has answered since.
  const supersededAnswers = new Set(
    localMessages.flatMap((message) => {
      const answerId = (message as { failedAnswerId?: string }).failedAnswerId
      return answerId && answered.has(message.id) ? [answerId] : []
    }),
  )
  return [
    ...serverMessages.filter((message) => !failedLocalIds.has(message.id)),
    ...localMessages.filter(
      (message) =>
        failedLocalIds.has(message.id) || (!serverIds.has(message.id) && !supersededAnswers.has(message.id)),
    ),
  ]
}

/**
 * The student messages the server holds with an answer after them: one kept
 * here as failed reached the server after all - a stop or a let-go request
 * that raced it - and is the server's now, not "not sent".
 */
function answeredOnServer(serverMessages: ChatMessage[]): Set<string> {
  const answered = new Set<string>()
  let answerFollows = false
  for (let index = serverMessages.length - 1; index >= 0; index -= 1) {
    const message = serverMessages[index]
    if (message.role === 'assistant' && message.status !== 'failed' && message.status !== 'streaming') {
      answerFollows = true
    } else if (message.role === 'student') {
      if (answerFollows) answered.add(message.id)
      answerFollows = false
    }
  }
  return answered
}

/** Of the local messages, the failed ones still to be sent again, with what stood for their answer. */
function stillFailed<T extends ChatMessage & { retryPayload?: unknown; failedAnswerId?: string }>(
  messages: T[],
  serverMessages: ChatMessage[],
): T[] {
  const answered = answeredOnServer(serverMessages)
  const kept = new Set<string>()
  for (const message of messages) {
    if (message.role !== 'student' || message.status !== 'failed' || !message.retryPayload) continue
    if (answered.has(message.id)) continue
    kept.add(message.id)
    if (message.failedAnswerId) kept.add(message.failedAnswerId)
  }
  return messages.filter((message) => kept.has(message.id))
}

export function useStreamingChat(conversationId: string | null) {
  const queryClient = useQueryClient()
  const [localMessages, setLocalMessages] = useState<LocalChatMessage[]>(() =>
    localFailedMessages(conversationId),
  )
  const [isStreaming, setIsStreaming] = useState(false)
  // Set in the same tick as an attempt starts, so a second send - a retry
  // tapped twice, say - is refused before the state has caught up.
  const busyRef = useRef(false)
  // The messages as last shown, for what a failure keeps of its answer.
  const localMessagesRef = useRef(localMessages)
  useEffect(() => {
    localMessagesRef.current = localMessages
  }, [localMessages])
  // Stops the send request and the reading of its command together.
  const stopRef = useRef<(() => void) | null>(null)
  const activeAssistantMessageIdRef = useRef<string | null>(null)
  const stoppedByUserRef = useRef(false)
  // The attempt that owns the refs and the streaming state. An attempt that was
  // stopped or replaced - by a switch of conversation, say - may still finish
  // later, and must not undo the state of the one that replaced it.
  const currentAttemptRef = useRef(0)

  const invalidateConversation = useCallback(async () => {
    if (!conversationId) return

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.conversation(conversationId),
      }),
      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.conversations(),
      }),
    ])
  }, [conversationId, queryClient])

  const handleStreamEvent = useCallback((event: ChatStreamEvent) => {
    if (event.type === 'message_start') {
      const currentAssistantId = activeAssistantMessageIdRef.current
      activeAssistantMessageIdRef.current = event.messageId

      setLocalMessages((messages) =>
        messages.map((message) =>
          message.id === currentAssistantId
            ? {
                ...message,
                id: event.messageId,
                role: event.role,
                createdAt: event.createdAt,
                status: 'streaming',
              }
            : message,
        ),
      )
      return
    }

    if (event.type === 'message_delta') {
      setLocalMessages((messages) =>
        messages.map((message) =>
          message.id === event.messageId
            ? {
                ...message,
                content: `${message.content}${event.delta}`,
                status: 'streaming',
              }
            : message,
        ),
      )
      return
    }

    if (event.type === 'message_done') {
      setLocalMessages((messages) =>
        messages.map((message) =>
          message.id === event.messageId
            ? {
                ...message,
                status: event.status,
              }
            : message,
        ),
      )
      return
    }

    if (event.type === 'message_error') {
      const messageId = event.messageId ?? activeAssistantMessageIdRef.current
      const safeMessage = toUserFacingError(new Error(event.message), streamErrorFallback())

      setLocalMessages((messages) =>
        messages.map((message) =>
          message.id === messageId
            ? {
                ...message,
                content: message.content || safeMessage,
                status: 'failed',
              }
            : message,
        ),
      )
    }
  }, [])

  /**
   * Send a message, or with `send: false` wait for one already sent, and settle
   * it by what its command says: the answer, or a failure the student can send
   * again - as the same message when the command allows it. True once it was
   * answered; false when it failed, was stopped or was overtaken.
   *
   * `sending` is a send of it still on its way from elsewhere in the tab
   * (`sendDetached`): until it is done, not finding the message on the server
   * means not stored yet.
   */
  const runAttempt = useCallback(
    async (
      pending: PendingMessage,
      {
        send,
        sending,
        replaces,
      }: { send: boolean; sending?: Promise<void>; replaces?: LocalChatMessage },
    ): Promise<boolean> => {
      if (!conversationId) return false

      const attempt = ++currentAttemptRef.current
      const isCurrent = () => currentAttemptRef.current === attempt
      // The message is the signed-in person's. Signing out clears what they
      // left in the tab; an attempt resuming after that must not write it back,
      // send it, or report on it under whoever holds the tab now (#34). A
      // renewal while it runs changes the access token and keeps the session,
      // as `readCurrentAccount` has it (#326 S1).
      const sender = currentSessionToken()
      const senderRefresh = storedRefreshToken()
      const sameSession = () =>
        currentSessionToken() === sender || (sender !== null && isSameSession(senderRefresh))
      const owns = () => isCurrent() && sameSession()
      const owner = signedInAccount()
      busyRef.current = true
      setIsStreaming(true)

      try {
        const requestController = new AbortController()
        const pollController = new AbortController()
        // The server's own ids, so the bubbles are recognised as its messages when
        // the conversation is read back; local ones where hashing is unavailable.
        const { studentMessageId, assistantMessageId } = await commandMessageIds(
          conversationId,
          pending.idempotencyKey,
        ).catch(() => ({
          studentMessageId: createLocalId('student'),
          assistantMessageId: createLocalId('assistant'),
        }))
        if (!owns()) return false

        stopRef.current = () => {
          requestController.abort()
          pollController.abort()
        }
        activeAssistantMessageIdRef.current = assistantMessageId
        stoppedByUserRef.current = false
        if (send) writePending(conversationId, { ...pending, unconfirmed: undefined })
        // A failed message sent again leaves the thread only now that its new
        // attempt is under way (#326 K2).
        if (replaces) dropFailedMessage(conversationId, replaces.id)

        setLocalMessages((messages) => [
          // A retry of the same message replaces what its earlier attempt left.
          ...messages.filter(
            (message) =>
              message.id !== studentMessageId &&
              message.id !== assistantMessageId &&
              message.id !== replaces?.id &&
              message.id !== replaces?.failedAnswerId,
          ),
          {
            id: studentMessageId,
            conversationId,
            role: 'student',
            content: pending.content,
            createdAt: pending.askedAt,
            status: 'sending',
            attachments: pending.attachments,
            // The quote block shows on the student's own bubble at once, as it
            // does when the conversation is read back from the server (#56).
            quote: pending.quote ?? null,
          },
          {
            id: assistantMessageId,
            conversationId,
            role: 'assistant',
            content: '',
            createdAt: pending.askedAt,
            status: 'streaming',
          },
        ])

        // The request that generates the answer may hold its connection until
        // the answer is whole, be cut off at 29 seconds, or return as soon as
        // the message is stored. Either way the command is read on a second
        // connection, with its steps, until it ends.
        const watcher = watchGeneration({
          conversationId,
          idempotencyKey: pending.idempotencyKey,
          askedAt: pending.askedAt,
          signal: pollController.signal,
          requestDone: !send && !sending,
          onSteps: (steps) => {
            if (!owns()) return
            const writingId = activeAssistantMessageIdRef.current ?? assistantMessageId
            setLocalMessages((messages) =>
              messages.map((message) =>
                message.id === writingId && message.status === 'streaming'
                  ? { ...message, content: steps.join('\n\n') }
                  : message,
              ),
            )
          },
        })

        void sending?.then(() => watcher.markRequestDone())

        let outcome: GenerationOutcome | null = null
        let requestError: unknown = null
        if (send) {
          // The request is let go once the command has ended without it, or
          // once it has run past the gateway's limit: the student is not left
          // with "thinking" over an answer that is already there (#326 K6).
          let abandoned = false
          const abandon = () => {
            abandoned = true
            requestController.abort()
          }
          const limit = window.setTimeout(abandon, SEND_REQUEST_LIMIT_MS)
          void watcher.outcome.then((settled) => {
            if (settled.kind !== 'aborted') abandon()
          })
          const aborted = new Promise<never>((_, reject) => {
            const fail = () => reject(requestController.signal.reason)
            if (requestController.signal.aborted) fail()
            else requestController.signal.addEventListener('abort', fail, { once: true })
          })
          try {
            const request = streamConversationMessage({
              conversationId,
              // Spread, not `undefined`: a question asked away from the stage
              // sends a body without these keys at all (#56).
              payload: {
                content: pending.content,
                attachmentIds: pending.attachmentIds,
                idempotencyKey: pending.idempotencyKey,
                ...(pending.practiceContext ? { practiceContext: pending.practiceContext } : {}),
                ...(pending.quote ? { quote: pending.quote } : {}),
              },
              signal: requestController.signal,
              onEvent: (event) => {
                if (requestController.signal.aborted || !owns()) return
                handleStreamEvent(event)
                if (event.type === 'message_error') {
                  throw new Error(event.message)
                }
              },
            })
            // Settled however the race goes; its end is no longer waited for.
            request.catch(() => {})
            const delivered = await Promise.race([request, aborted])
            if (delivered === 'streamed') outcome = { kind: 'completed' }
          } catch (error) {
            // Let go here: not a failure to report in its own words.
            requestError = abandoned ? null : error
          } finally {
            window.clearTimeout(limit)
          }
          watcher.markRequestDone()
        }
        if (!stoppedByUserRef.current && outcome === null) {
          outcome = await watcher.outcome
        }
        pollController.abort()
        if (!owns()) return false
        // Read now: the updaters below run when React renders, after the refs
        // have been cleared for the next attempt.
        const settledAssistantId = activeAssistantMessageIdRef.current ?? assistantMessageId
        const sameMessageRetry = (sameMessage: boolean): RetryPayload => ({
          content: pending.content,
          attachmentIds: pending.attachmentIds,
          attachments: pending.attachments,
          ...(pending.practiceContext ? { practiceContext: pending.practiceContext } : {}),
          ...(pending.quote ? { quote: pending.quote } : {}),
          ...(sameMessage ? { idempotencyKey: pending.idempotencyKey } : {}),
        })
        const studentBubble = (): LocalChatMessage => ({
          id: studentMessageId,
          conversationId,
          role: 'student',
          content: pending.content,
          createdAt: pending.askedAt,
          attachments: pending.attachments,
          quote: pending.quote ?? null,
        })

        if (stoppedByUserRef.current) {
          writePending(conversationId, null)
          trackEvent('chat_response_stopped', { conversationId })
          // Stopping only stops the waiting: a message the server has is still
          // answered, and shows as the server's. One it does not have is kept
          // as not sent, to send again under the same key (#326 K5).
          // Kept as not sent before the server is asked: a switch of
          // conversation or a reload meanwhile must not lose it.
          const student = { ...studentBubble(), status: 'failed' as const, retryPayload: sameMessageRetry(true) }
          keepFailedMessage(conversationId, owner, { student })
          await invalidateConversation()
          if (!owns()) return false
          const held = queryClient
            .getQueryData<Conversation>(chatQueryKeys.conversation(conversationId))
            ?.messages.some((message) => message.id === studentMessageId)
          if (held) {
            dropFailedMessage(conversationId, studentMessageId)
            setLocalMessages((messages) =>
              messages
                .filter((message) => message.id !== studentMessageId)
                .map((message) =>
                  message.id === settledAssistantId ? { ...message, status: 'stopped' } : message,
                ),
            )
            return false
          }
          setLocalMessages((messages) => [
            ...messages.filter(
              (message) => message.id !== studentMessageId && message.id !== settledAssistantId,
            ),
            student,
          ])
          return false
        }
        if (outcome === null || outcome.kind === 'aborted') return false

        writePending(conversationId, null)
        if (outcome.kind === 'completed') {
          await invalidateConversation()
          if (!owns()) return false
          trackEvent('chat_response_completed', { conversationId })
          if (!currentSessionToken()?.startsWith('demo:')) {
            // The server holds this message and its answer now; the ones that
            // did not go through stay, with their retry (#326 K1) - from what
            // is on screen, which holds them even where storage could not.
            const server = queryClient.getQueryData<Conversation>(chatQueryKeys.conversation(conversationId))?.messages ?? []
            for (const id of answeredOnServer(server)) dropFailedMessage(conversationId, id)
            setLocalMessages((messages) => stillFailed(messages, server))
          }
          return true
        }

        const retryPayload = sameMessageRetry(outcome.kind !== 'failed' || outcome.retryable)
        // What the answer's place showed when it failed: the steps written so
        // far, or the failure in words.
        const shown = localMessagesRef.current.find((message) => message.id === settledAssistantId)
        const failedAnswer: ChatMessage = {
          id: settledAssistantId,
          conversationId,
          role: 'assistant',
          createdAt: pending.askedAt,
          ...shown,
          content: shown?.content || getErrorMessage(requestError),
          status: 'failed',
        }
        const student: LocalChatMessage = {
          ...studentBubble(),
          status: 'failed',
          retryPayload,
          failedAnswerId: settledAssistantId,
        }
        keepFailedMessage(conversationId, owner, { student: { ...studentBubble(), status: 'failed', retryPayload }, answer: failedAnswer })
        setLocalMessages((messages) =>
          messages.map((message) => {
            if (message.id === studentMessageId) return { ...message, ...student }
            if (message.id === settledAssistantId) return { ...message, content: message.content || failedAnswer.content, status: 'failed' }
            return message
          }),
        )
        return false
      } finally {
        // Whatever ended the attempt - an answer, a failure, a stop, a session
        // that changed - the composer is given back, unless a newer attempt
        // has taken over (#326 S1).
        if (isCurrent()) {
          busyRef.current = false
          setIsStreaming(false)
          stopRef.current = null
          activeAssistantMessageIdRef.current = null
          stoppedByUserRef.current = false
          // Another account's words are not left on screen under this one.
          if (!sameSession()) setLocalMessages([])
        }
      }
    },
    [conversationId, handleStreamEvent, invalidateConversation, queryClient],
  )

  useEffect(() => {
    currentAttemptRef.current += 1
    // The ones that did not go through are still there to send again (#326 K1).
    setLocalMessages(localFailedMessages(conversationId))
    busyRef.current = false
    setIsStreaming(false)
    activeAssistantMessageIdRef.current = null
    stoppedByUserRef.current = false
    // A message sent before the page was reloaded is still one command on the
    // server; wait for it instead of losing it.
    // One sent with no conversation on screen (`sendDetached`) and not known to
    // have arrived is waited for while its request is still going, and sent
    // again with the same key once this tab no longer has that request.
    const pending = conversationId ? readPending(conversationId) : null
    if (pending) {
      const sending = detachedSendFor(pending.idempotencyKey)
      void runAttempt(pending, { send: Boolean(pending.unconfirmed) && !sending, sending })
    }
    return () => {
      stopRef.current?.()
      stopRef.current = null
    }
  }, [conversationId, runAttempt])

  const sendStreamingMessage = useCallback(
    async (
      { content, attachmentIds, attachments, practiceContext, quote }: SendStreamingMessagePayload,
      idempotencyKey?: string,
      replaces?: LocalChatMessage,
    ) => {
      if (!conversationId || isStreaming || busyRef.current) return false

      const trimmed = content.trim()
      if (!trimmed) return false

      trackEvent('chat_message_sent', {
        conversationId,
        hasAttachments: Boolean(attachmentIds?.length),
      })
      trackEvent('chat_response_started', { conversationId })
      return runAttempt(
        {
          // The key names the message, not the attempt: a retry of a message
          // the server may still answer sends the same one.
          idempotencyKey: idempotencyKey ?? createLocalId('student'),
          content: trimmed,
          attachmentIds,
          attachments,
          askedAt: new Date().toISOString(),
          ...(practiceContext ? { practiceContext } : {}),
          ...(quote ? { quote } : {}),
        },
        { send: true, replaces },
      )
    },
    [conversationId, isStreaming, runAttempt],
  )

  const stopStreaming = useCallback(() => {
    if (!stopRef.current) return

    stoppedByUserRef.current = true
    stopRef.current()
  }, [])

  const retryMessage = useCallback(
    (messageId: string) => {
      const message = localMessages.find(
        (localMessage) =>
          localMessage.id === messageId &&
          localMessage.role === 'student' &&
          localMessage.status === 'failed' &&
          localMessage.retryPayload,
      )

      // Not while another message is on its way: the failed one stays, with
      // its retry, until it can actually be sent (#326 K2).
      if (!message?.retryPayload || busyRef.current) return

      const { idempotencyKey, ...payload } = message.retryPayload
      void sendStreamingMessage(payload, idempotencyKey, message)
    },
    [localMessages, sendStreamingMessage],
  )

  return {
    localMessages,
    isStreaming,
    sendStreamingMessage,
    stopStreaming,
    // Offered only when a retry can go out at once: a bubble shows no "send
    // again" while another message is on its way (#326 K2).
    retryMessage: isStreaming ? undefined : retryMessage,
  }
}
