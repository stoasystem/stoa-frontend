import { useQuery } from '@tanstack/react-query'
import { getTutorAvailability } from '@/services/tutor/tutorAvailabilityApi'

export function useTutorAvailabilityQuery() {
  return useQuery({
    queryKey: ['tutor', 'availability'],
    queryFn: getTutorAvailability,
  })
}
