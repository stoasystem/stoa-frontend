import { useQuery } from '@tanstack/react-query'
import { getTeacherWeeklyAvailability } from '@/services/teacher/teacherAvailabilityApi'
import { teacherQueryKeys } from '@/services/teacher/teacherQueryKeys'

export function useTeacherWeeklyAvailabilityQuery() {
  return useQuery({
    queryKey: teacherQueryKeys.availability(),
    queryFn: getTeacherWeeklyAvailability,
  })
}
