import { useQuery } from '@tanstack/react-query'
import { useAskServer } from '@/features/ask/server/askServer'
import { chatQueryKeys } from '@/services/chat/chatQueryKeys'

export function useTeacherAvailabilityQuery() {
  const { getTeacherAvailability } = useAskServer().teacherHelp
  return useQuery({
    queryKey: chatQueryKeys.teacherAvailability(),
    queryFn: () => getTeacherAvailability(),
    staleTime: 60_000,
    refetchInterval: 60_000,
    // Don't poll while the tab is hidden — availability isn't time-critical
    refetchIntervalInBackground: false,
  })
}
