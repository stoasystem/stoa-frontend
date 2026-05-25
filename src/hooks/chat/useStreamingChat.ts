import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  streamConversationMessage,
  type StreamMessagePayload,
} from '@/services/chat/chatStreamApi'
import { trackEvent } from '@/services/analytics/analyticsClient'
import { chatQueryKeys } from '@/services/chat/chatQueryKeys'
import type { ChatAttachment, ChatMessage, ChatStreamEvent } from '@/types/chat'

type LocalChatMessage = ChatMessage & {
  retryPayload?: StreamMessagePayload
}

type SendStreamingMessagePayload = StreamMessagePayload & {
  attachments?: ChatAttachment[]
}

function createLocalId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Failed to stream message.'
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

      setLocalMessages((messages) =>
        messages.map((message) =>
          message.id === messageId
            ? {
                ...message,
                content: message.content || event.message,
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

      try {
        await streamConversationMessage({
          conversationId,
          payload: {
            content: trimmed,
            attachmentIds,
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

        await invalidateConversation()
        trackEvent('chat_response_completed', { conversationId })
        if (!localStorage.getItem('stoa_access_token')?.startsWith('demo:')) {
          setLocalMessages([])
        }
      } catch (error) {
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
