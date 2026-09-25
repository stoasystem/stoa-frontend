import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  streamConversationMessage,
  type StreamMessagePayload,
} from '@/services/chat/chatStreamApi'
import { trackEvent } from '@/services/analytics/analyticsClient'
import { chatQueryKeys } from '@/services/chat/chatQueryKeys'
import { toUserFacingError } from '@/lib/userFacingText'
import type { ChatAttachment, ChatMessage, ChatStreamEvent } from '@/types/chat'
import { commandMessageIds } from '@/services/chat/commandMessageIds'
import { watchGeneration, type GenerationOutcome } from '@/services/chat/generationWatch'

/**
 * One message on its way: what was asked, and the idempotency key that makes
 * it one command on the server however often it is sent. Kept in session
 * storage while unanswered, so a reload picks the same command up again.
 */
type PendingMessage = {
  idempotencyKey: string
  content: string
  attachmentIds?: string[]
  attachments?: ChatAttachment[]
  askedAt: string
}

type RetryPayload = Omit<PendingMessage, 'askedAt' | 'idempotencyKey'> & {
  // Set when the failed command may be sent again as the same message; absent
  // when the answer was paid for but unusable, so a retry is a new message.
  idempotencyKey?: string
}

type LocalChatMessage = ChatMessage & {
  retryPayload?: RetryPayload
}

type SendStreamingMessagePayload = Omit<StreamMessagePayload, 'idempotencyKey'> & {
  attachments?: ChatAttachment[]
}

const streamErrorFallback =
  'The explanation could not be prepared right now. Please try again or ask a teacher.'

export const PENDING_MESSAGE_KEY_PREFIX = 'stoa_pending_chat_message:'
const pendingKey = (conversationId: string) => `${PENDING_MESSAGE_KEY_PREFIX}${conversationId}`

function readPending(conversationId: string): PendingMessage | null {
  try {
    const raw = sessionStorage.getItem(pendingKey(conversationId))
    if (!raw) return null
    const value = JSON.parse(raw) as Partial<PendingMessage>
    if (typeof value.idempotencyKey !== 'string' || typeof value.content !== 'string') return null
    return {
      idempotencyKey: value.idempotencyKey,
      content: value.content,
      attachmentIds: value.attachmentIds,
      attachments: value.attachments,
      askedAt: typeof value.askedAt === 'string' ? value.askedAt : new Date(0).toISOString(),
    }
  } catch {
    return null
  }
}

function writePending(conversationId: string, pending: PendingMessage | null) {
  try {
    if (pending) {
      sessionStorage.setItem(pendingKey(conversationId), JSON.stringify(pending))
    } else {
      sessionStorage.removeItem(pendingKey(conversationId))
    }
  } catch {
    // Without storage a reload loses the wait, not the message.
  }
}

function createLocalId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function getErrorMessage(error: unknown) {
  return toUserFacingError(error, streamErrorFallback)
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
  const failedLocalIds = new Set(
    localMessages
      .filter((message) => message.role === 'student' && message.status === 'failed')
      .map((message) => message.id),
  )
  const serverIds = new Set(serverMessages.map((message) => message.id))
  return [
    ...serverMessages.filter((message) => !failedLocalIds.has(message.id)),
    ...localMessages.filter(
      (message) => failedLocalIds.has(message.id) || !serverIds.has(message.id),
    ),
  ]
}

export function useStreamingChat(conversationId: string | null) {
  const queryClient = useQueryClient()
  const [localMessages, setLocalMessages] = useState<LocalChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
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
      const safeMessage = toUserFacingError(new Error(event.message), streamErrorFallback)

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
   * again - as the same message when the command allows it.
   */
  const runAttempt = useCallback(
    async (pending: PendingMessage, { send }: { send: boolean }) => {
      if (!conversationId) return

      const attempt = ++currentAttemptRef.current
      const owns = () => currentAttemptRef.current === attempt
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
      if (!owns()) return

      stopRef.current = () => {
        requestController.abort()
        pollController.abort()
      }
      activeAssistantMessageIdRef.current = assistantMessageId
      stoppedByUserRef.current = false
      setIsStreaming(true)
      writePending(conversationId, pending)

      setLocalMessages((messages) => [
        // A retry of the same message replaces what its earlier attempt left.
        ...messages.filter(
          (message) => message.id !== studentMessageId && message.id !== assistantMessageId,
        ),
        {
          id: studentMessageId,
          conversationId,
          role: 'student',
          content: pending.content,
          createdAt: pending.askedAt,
          status: 'sending',
          attachments: pending.attachments,
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
        requestDone: !send,
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

      let outcome: GenerationOutcome | null = null
      let requestError: unknown = null
      if (send) {
        try {
          const delivered = await streamConversationMessage({
            conversationId,
            payload: {
              content: pending.content,
              attachmentIds: pending.attachmentIds,
              idempotencyKey: pending.idempotencyKey,
            },
            signal: requestController.signal,
            onEvent: (event) => {
              handleStreamEvent(event)
              if (event.type === 'message_error') {
                throw new Error(event.message)
              }
            },
          })
          if (delivered === 'streamed') outcome = { kind: 'completed' }
        } catch (error) {
          requestError = error
        }
        watcher.markRequestDone()
      }
      if (!stoppedByUserRef.current && outcome === null) {
        outcome = await watcher.outcome
      }
      pollController.abort()
      if (!owns()) return
      // Read now: the updaters below run when React renders, after the refs
      // have been cleared for the next attempt.
      const settledAssistantId = activeAssistantMessageIdRef.current ?? assistantMessageId

      try {
        if (stoppedByUserRef.current) {
          writePending(conversationId, null)
          setLocalMessages((messages) =>
            messages.map((message) =>
              message.id === settledAssistantId
                ? { ...message, status: 'stopped' }
                : message.id === studentMessageId
                  ? { ...message, status: 'completed' }
                  : message,
            ),
          )
          trackEvent('chat_response_stopped', { conversationId })
          return
        }
        if (outcome === null || outcome.kind === 'aborted') return

        writePending(conversationId, null)
        if (outcome.kind === 'completed') {
          await invalidateConversation()
          trackEvent('chat_response_completed', { conversationId })
          if (!localStorage.getItem('stoa_access_token')?.startsWith('demo:')) {
            setLocalMessages([])
          }
          return
        }

        const sameMessage = outcome.kind !== 'failed' || outcome.retryable
        const retryPayload: RetryPayload = {
          content: pending.content,
          attachmentIds: pending.attachmentIds,
          attachments: pending.attachments,
          ...(sameMessage ? { idempotencyKey: pending.idempotencyKey } : {}),
        }
        setLocalMessages((messages) =>
          messages.map((message) => {
            if (message.id === studentMessageId) {
              return { ...message, status: 'failed', retryPayload }
            }
            if (message.id === settledAssistantId) {
              return {
                ...message,
                content: message.content || getErrorMessage(requestError),
                status: 'failed',
              }
            }
            return message
          }),
        )
      } finally {
        if (owns()) {
          setIsStreaming(false)
          stopRef.current = null
          activeAssistantMessageIdRef.current = null
          stoppedByUserRef.current = false
        }
      }
    },
    [conversationId, handleStreamEvent, invalidateConversation],
  )

  useEffect(() => {
    currentAttemptRef.current += 1
    setLocalMessages([])
    setIsStreaming(false)
    activeAssistantMessageIdRef.current = null
    stoppedByUserRef.current = false
    // A message sent before the page was reloaded is still one command on the
    // server; wait for it instead of losing it.
    const pending = conversationId ? readPending(conversationId) : null
    if (pending) {
      void runAttempt(pending, { send: false })
    }
    return () => {
      stopRef.current?.()
      stopRef.current = null
    }
  }, [conversationId, runAttempt])

  const sendStreamingMessage = useCallback(
    async (
      { content, attachmentIds, attachments }: SendStreamingMessagePayload,
      idempotencyKey?: string,
    ) => {
      if (!conversationId || isStreaming) return

      const trimmed = content.trim()
      if (!trimmed) return

      trackEvent('chat_message_sent', {
        conversationId,
        hasAttachments: Boolean(attachmentIds?.length),
      })
      trackEvent('chat_response_started', { conversationId })
      await runAttempt(
        {
          // The key names the message, not the attempt: a retry of a message
          // the server may still answer sends the same one.
          idempotencyKey: idempotencyKey ?? createLocalId('student'),
          content: trimmed,
          attachmentIds,
          attachments,
          askedAt: new Date().toISOString(),
        },
        { send: true },
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

      if (!message?.retryPayload) return

      const { idempotencyKey, ...payload } = message.retryPayload
      setLocalMessages((messages) =>
        messages.filter((localMessage) => localMessage.id !== messageId),
      )
      void sendStreamingMessage(payload, idempotencyKey)
    },
    [localMessages, sendStreamingMessage],
  )

  return {
    localMessages,
    isStreaming,
    sendStreamingMessage,
    stopStreaming,
    retryMessage,
  }
}
