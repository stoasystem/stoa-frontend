import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  getGenerationProgress,
  streamConversationMessage,
  type StreamMessagePayload,
} from '@/services/chat/chatStreamApi'
import { trackEvent } from '@/services/analytics/analyticsClient'
import { chatQueryKeys } from '@/services/chat/chatQueryKeys'
import { toUserFacingError } from '@/lib/userFacingText'
import type { ChatAttachment, ChatMessage, ChatStreamEvent } from '@/types/chat'

type LocalChatMessage = ChatMessage & {
  // A retry is a new attempt and gets its own key.
  retryPayload?: Omit<StreamMessagePayload, 'idempotencyKey'>
}

// The idempotency key belongs to the attempt, which this hook owns, so callers
// do not supply one.
type SendStreamingMessagePayload = Omit<StreamMessagePayload, 'idempotencyKey'> & {
  attachments?: ChatAttachment[]
}

const streamErrorFallback =
  'The explanation could not be prepared right now. Please try again or ask a teacher.'

function createLocalId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function getErrorMessage(error: unknown) {
  return toUserFacingError(error, streamErrorFallback)
}

export function useStreamingChat(conversationId: string | null) {
  const queryClient = useQueryClient()
  const [localMessages, setLocalMessages] = useState<LocalChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const activeAssistantMessageIdRef = useRef<string | null>(null)
  const stoppedByUserRef = useRef(false)
  const streamErrorEventRef = useRef(false)

  useEffect(() => {
    setLocalMessages([])
    setIsStreaming(false)
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    activeAssistantMessageIdRef.current = null
    stoppedByUserRef.current = false
    streamErrorEventRef.current = false
  }, [conversationId])

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

  const sendStreamingMessage = useCallback(
    async ({ content, attachmentIds, attachments }: SendStreamingMessagePayload) => {
      if (!conversationId || isStreaming) return

      const trimmed = content.trim()
      if (!trimmed) return

      const controller = new AbortController()
      const studentMessageId = createLocalId('student')
      const assistantMessageId = createLocalId('assistant')
      const now = new Date().toISOString()

      abortControllerRef.current = controller
      activeAssistantMessageIdRef.current = assistantMessageId
      stoppedByUserRef.current = false
      streamErrorEventRef.current = false
      setIsStreaming(true)

      setLocalMessages((messages) => [
        ...messages,
        {
          id: studentMessageId,
          conversationId,
          role: 'student',
          content: trimmed,
          createdAt: now,
          status: 'sending',
          attachments,
          retryPayload: {
            content: trimmed,
            attachmentIds,
          },
        },
        {
          id: assistantMessageId,
          conversationId,
          role: 'assistant',
          content: '',
          createdAt: now,
          status: 'streaming',
        },
      ])
      trackEvent('chat_message_sent', {
        conversationId,
        hasAttachments: Boolean(attachmentIds?.length),
      })
      trackEvent('chat_response_started', { conversationId })

      // The request that generates the answer holds its connection until the
      // answer is whole, so the steps are read back on a second connection.
      const progressTimer = window.setInterval(() => {
        void getGenerationProgress(conversationId, controller.signal)
          .then((steps) => {
            if (steps.length === 0) return
            setLocalMessages((messages) =>
              messages.map((message) =>
                message.id === (activeAssistantMessageIdRef.current ?? assistantMessageId) &&
                message.status === 'streaming'
                  ? { ...message, content: steps.join('\n\n') }
                  : message,
              ),
            )
          })
          .catch(() => undefined)
      }, 1000)

      try {
        await streamConversationMessage({
          conversationId,
          payload: {
            content: trimmed,
            attachmentIds,
            idempotencyKey: studentMessageId,
          },
          signal: controller.signal,
          onEvent: (event) => {
            handleStreamEvent(event)

            if (event.type === 'message_error') {
              streamErrorEventRef.current = true
              throw new Error(event.message)
            }
          },
        })

        window.clearInterval(progressTimer)
        await invalidateConversation()
        trackEvent('chat_response_completed', { conversationId })
        if (!localStorage.getItem('stoa_access_token')?.startsWith('demo:')) {
          setLocalMessages([])
        }
      } catch (error) {
        window.clearInterval(progressTimer)
        if (controller.signal.aborted && stoppedByUserRef.current) {
          setLocalMessages((messages) =>
            messages.map((message) =>
              message.id === activeAssistantMessageIdRef.current
                ? {
                    ...message,
                    status: 'stopped',
                  }
                : message.id === studentMessageId
                  ? {
                      ...message,
                      status: 'completed',
              }
                : message,
            ),
          )
          trackEvent('chat_response_stopped', { conversationId })
          return
        }

        setLocalMessages((messages) =>
          messages.map((message) => {
            if (message.id === studentMessageId && !streamErrorEventRef.current) {
              return {
                ...message,
                status: 'failed',
              }
            }

            if (message.id === activeAssistantMessageIdRef.current) {
              return {
                ...message,
                content: message.content || getErrorMessage(error),
                status: 'failed',
              }
            }

            return message
          }),
        )
      } finally {
        setIsStreaming(false)
        abortControllerRef.current = null
        activeAssistantMessageIdRef.current = null
        stoppedByUserRef.current = false
        streamErrorEventRef.current = false
      }
    },
    [conversationId, handleStreamEvent, invalidateConversation, isStreaming],
  )

  const stopStreaming = useCallback(() => {
    if (!abortControllerRef.current) return

    stoppedByUserRef.current = true
    abortControllerRef.current.abort()
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

      setLocalMessages((messages) =>
        messages.filter((localMessage) => localMessage.id !== messageId),
      )
      void sendStreamingMessage(message.retryPayload)
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
