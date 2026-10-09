import { useQuery } from '@tanstack/react-query'
import { getTeacherWeeklyAvailability } from '@/services/teacher/teacherAvailabilityApi'

export function useTeacherWeeklyAvailabilityQuery() {
  return useQuery({
    queryKey: ['teacher', 'availability'],
    queryFn: getTeacherWeeklyAvailability,
  })
}
