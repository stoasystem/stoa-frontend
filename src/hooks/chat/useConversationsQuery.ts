import { useQuery } from '@tanstack/react-query'
import { getConversations } from '@/services/chat/chatApi'
import { chatQueryKeys } from '@/services/chat/chatQueryKeys'

export function useConversationsQuery() {
  return useQuery({
    queryKey: chatQueryKeys.conversations(),
    queryFn: getConversations,
  })
}
