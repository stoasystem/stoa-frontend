import { useQuery } from '@tanstack/react-query'
import { getConversation } from '@/services/chat/chatApi'
import { chatQueryKeys } from '@/services/chat/chatQueryKeys'

export function useConversationQuery(conversationId: string | null) {
  return useQuery({
    queryKey: chatQueryKeys.conversation(conversationId ?? ''),
    queryFn: () => getConversation(conversationId ?? ''),
    enabled: Boolean(conversationId),
  })
}
