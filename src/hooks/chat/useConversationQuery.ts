import { useQuery } from '@tanstack/react-query'
import { getConversation } from '@/services/chat/chatApi'
import { chatQueryKeys } from '@/services/chat/chatQueryKeys'

export function useConversationQuery(
  conversationId: string | null,
  // Ask reads the conversation again while a teacher is on it (#12 point 2).
  options: { refetchInterval?: number | false } = {},
) {
  return useQuery({
    queryKey: chatQueryKeys.conversation(conversationId ?? ''),
    queryFn: () => getConversation(conversationId ?? ''),
    enabled: Boolean(conversationId),
    refetchInterval: options.refetchInterval ?? false,
    refetchIntervalInBackground: false,
  })
}
