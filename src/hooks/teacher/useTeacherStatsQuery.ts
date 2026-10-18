import { useQuery } from '@tanstack/react-query'
import { getTeacherStats } from '@/services/teacher/teacherApi'
import { teacherQueryKeys } from '@/services/teacher/teacherQueryKeys'

export function useTeacherStatsQuery() {
  return useQuery({
    queryKey: teacherQueryKeys.stats(),
    queryFn: getTeacherStats,
    retry: false,
    // The board's "pending" sits above the request list, which polls; read
    // both on the same beat so the count and the list agree (#271).
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  })
}
