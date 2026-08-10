import { useQuery } from '@tanstack/react-query'
import { chatQueryKeys } from '@/services/chat/chatQueryKeys'
import { getTeacherAvailability } from '@/services/teacherHelp/teacherHelpApi'

export function useTeacherAvailabilityQuery() {
  return useQuery({
    queryKey: chatQueryKeys.teacherAvailability(),
    queryFn: getTeacherAvailability,
    staleTime: 60_000,
    refetchInterval: 60_000,
    // Don't poll while the tab is hidden — availability isn't time-critical
    refetchIntervalInBackground: false,
  })
}
