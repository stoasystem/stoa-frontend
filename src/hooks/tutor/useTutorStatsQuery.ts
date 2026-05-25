import { useQuery } from '@tanstack/react-query'
import { getTutorStats } from '@/services/tutor/tutorApi'
import { tutorQueryKeys } from '@/services/tutor/tutorQueryKeys'

export function useTutorStatsQuery() {
  return useQuery({
    queryKey: tutorQueryKeys.stats(),
    queryFn: getTutorStats,
    retry: false,
  })
}
