import { useQuery } from '@tanstack/react-query'
import { getTutorProfile } from '@/services/tutor/tutorApi'
import { tutorQueryKeys } from '@/services/tutor/tutorQueryKeys'

export function useTutorProfileQuery() {
  return useQuery({
    queryKey: tutorQueryKeys.profile(),
    queryFn: getTutorProfile,
    retry: false,
  })
}
