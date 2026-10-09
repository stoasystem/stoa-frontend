import { useQuery } from '@tanstack/react-query'
import { getTeacherStats } from '@/services/teacher/teacherApi'
import { teacherQueryKeys } from '@/services/teacher/teacherQueryKeys'

export function useTeacherStatsQuery() {
  return useQuery({
    queryKey: teacherQueryKeys.stats(),
    queryFn: getTeacherStats,
    retry: false,
  })
}
