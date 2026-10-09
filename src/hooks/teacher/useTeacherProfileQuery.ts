import { useQuery } from '@tanstack/react-query'
import { getTeacherProfile } from '@/services/teacher/teacherApi'
import { teacherQueryKeys } from '@/services/teacher/teacherQueryKeys'

export function useTeacherProfileQuery() {
  return useQuery({
    queryKey: teacherQueryKeys.profile(),
    queryFn: getTeacherProfile,
    retry: false,
  })
}
