import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createConversation } from '@/services/chat/chatApi'
import { chatQueryKeys } from '@/services/chat/chatQueryKeys'
import { trackEvent } from '@/services/analytics/analyticsClient'
import type { ConversationListResponse, CreateConversationRequest } from '@/types/chat'

export function useCreateConversationMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateConversationRequest) => createConversation(payload),
    onSuccess: (conversation) => {
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
