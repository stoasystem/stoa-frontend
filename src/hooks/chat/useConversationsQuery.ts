import { useQuery } from '@tanstack/react-query'
import { useAskServer } from '@/features/ask/server/askServer'
import { chatQueryKeys } from '@/services/chat/chatQueryKeys'

export function useConversationsQuery() {
  const { getConversations } = useAskServer().conversations
  return useQuery({
    queryKey: chatQueryKeys.conversations(),
    queryFn: () => getConversations(),
  })
}
