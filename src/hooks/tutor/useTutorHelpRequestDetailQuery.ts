import { useQuery } from '@tanstack/react-query'
import { getTutorHelpRequestDetail } from '@/services/tutor/tutorApi'
import { tutorQueryKeys } from '@/services/tutor/tutorQueryKeys'

export function useTutorHelpRequestDetailQuery(requestId: string | undefined) {
  return useQuery({
    queryKey: tutorQueryKeys.helpRequestDetail(requestId ?? ''),
    queryFn: () => getTutorHelpRequestDetail(requestId ?? ''),
    enabled: Boolean(requestId),
  })
}
