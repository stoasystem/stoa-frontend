import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAskServer } from '@/features/ask/server/askServer'
import { noteUsagePeriodEnded } from '@/hooks/student/useStudentEntitlementQuery'
import { isUsagePeriodEnded } from '@/lib/usagePeriod'
import { chatQueryKeys } from '@/services/chat/chatQueryKeys'
import { trackEvent } from '@/services/analytics/analyticsClient'
import type { Conversation, ConversationListResponse, CreateConversationRequest } from '@/types/chat'

export function useCreateConversationMutation(
  options: {
    /**
     * Runs once the conversation exists, even if the screen that asked for it
     * has gone meanwhile -- unlike a callback passed to `mutate`.
     */
    onCreated?: (conversation: Conversation, payload: CreateConversationRequest) => void
  } = {},
) {
  const queryClient = useQueryClient()
  const { onCreated } = options
  // What makes it: `POST /conversations`, unless a test puts its own server in (#571).
  const { createConversation } = useAskServer().conversations

  return useMutation({
    mutationFn: (payload: CreateConversationRequest) => createConversation(payload),
    onSuccess: (conversation, payload) => {
      onCreated?.(conversation, payload)
      trackEvent('chat_conversation_created', {
        conversationId: conversation.id,
        subject: conversation.subject,
      })
      queryClient.setQueryData<ConversationListResponse>(
        chatQueryKeys.conversations(),
        (current) => ({
          items: [
            {
              id: conversation.id,
              title: conversation.title,
              subject: conversation.subject,
              grade: conversation.grade,
              updatedAt: conversation.updatedAt,
              lastMessagePreview: conversation.messages[conversation.messages.length - 1]?.content,
            },
            ...(current?.items.filter((item) => item.id !== conversation.id) ?? []),
          ],
        }),
      )
      queryClient.setQueryData(chatQueryKeys.conversation(conversation.id), conversation)
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations(), exact: true })
    },
    // A first question refused because the usage period ended while Ask was
    // open (#615): Ask pauses, and the period is read again.
    onError: (error) => {
      if (isUsagePeriodEnded(error)) noteUsagePeriodEnded(queryClient)
    },
  })
}
