import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createConversation } from '@/services/chat/chatApi'
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
    /** What makes it: `POST /conversations`, unless a test puts its own in (#562). */
    create?: (payload: CreateConversationRequest) => Promise<Conversation>
  } = {},
) {
  const queryClient = useQueryClient()
  const { onCreated, create = createConversation } = options

  return useMutation({
    mutationFn: (payload: CreateConversationRequest) => create(payload),
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
  })
}
