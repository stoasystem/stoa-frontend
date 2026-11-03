import { useQuery } from '@tanstack/react-query'
import { useAskServer } from '@/features/ask/server/askServer'
import { studentQueryKeys } from '@/services/student/studentQueryKeys'

export function useStudentProfileQuery() {
  const { getStudentProfile } = useAskServer().student
  return useQuery({
    queryKey: studentQueryKeys.profile(),
    queryFn: () => getStudentProfile(),
  })
}
