import { useQuery } from '@tanstack/react-query'
import { useAskServer } from '@/features/ask/server/askServer'
import { studentQueryKeys } from '@/services/student/studentQueryKeys'

/** The signed-in student's profile; `enabled: false` for an account that has none. */
export function useStudentProfileQuery({ enabled = true }: { enabled?: boolean } = {}) {
  const { getStudentProfile } = useAskServer().student
  return useQuery({
    queryKey: studentQueryKeys.profile(),
    queryFn: () => getStudentProfile(),
    enabled,
  })
}
