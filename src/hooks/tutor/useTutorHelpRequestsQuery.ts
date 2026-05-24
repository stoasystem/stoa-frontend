import { useQuery } from '@tanstack/react-query'
import { getTutorHelpRequests } from '@/services/tutor/tutorApi'
import { tutorQueryKeys } from '@/services/tutor/tutorQueryKeys'

export function useTutorHelpRequestsQuery() {
  return useQuery({
    queryKey: tutorQueryKeys.helpRequests(),
    queryFn: getTutorHelpRequests,
  })
}
