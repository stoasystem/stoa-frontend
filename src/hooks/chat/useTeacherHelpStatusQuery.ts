import { useQuery } from '@tanstack/react-query'
import { getTeacherHelpRequest } from '@/services/teacherHelp/teacherHelpApi'
import { chatQueryKeys } from '@/services/chat/chatQueryKeys'

export function useTeacherHelpStatusQuery(requestId: string | null) {
  return useQuery({
    queryKey: chatQueryKeys.teacherHelpRequest(requestId ?? ''),
    queryFn: () => getTeacherHelpRequest(requestId ?? ''),
    enabled: Boolean(requestId),
    refetchInterval: (query) => {
      const status = query.state.data?.status

      return status === 'pending' || status === 'assigned' || status === 'in_progress'
        ? 10_000
        : false
    },
  })
}
