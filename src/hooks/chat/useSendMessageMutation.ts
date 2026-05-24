import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sendConversationMessage } from '@/services/chat/chatApi'
import { chatQueryKeys } from '@/services/chat/chatQueryKeys'
import type { SendMessageRequest } from '@/types/chat'

export function useSendMessageMutation(conversationId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SendMessageRequest) => {
      if (!conversationId) {
        return Promise.reject(new Error('Conversation ID is required to send a message'))
      }

      return sendConversationMessage(conversationId, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations(), exact: true })

      if (conversationId) {
        queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversation(conversationId) })
      }
    },
  })
}
