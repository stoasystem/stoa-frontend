import { useQuery } from '@tanstack/react-query'
import { getStudentProfile } from '@/services/student/studentApi'
import { studentQueryKeys } from '@/services/student/studentQueryKeys'

export function useStudentProfileQuery() {
  return useQuery({
    queryKey: studentQueryKeys.profile(),
    queryFn: getStudentProfile,
  })
}
