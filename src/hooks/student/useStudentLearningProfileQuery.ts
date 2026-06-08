import { useQuery } from '@tanstack/react-query'
import { getStudentLearningProfile } from '@/services/student/studentApi'
import { studentQueryKeys } from '@/services/student/studentQueryKeys'

export function useStudentLearningProfileQuery(studentId: string | undefined) {
  return useQuery({
    queryKey: studentQueryKeys.learningProfile(studentId),
    queryFn: () => getStudentLearningProfile(studentId ?? ''),
    enabled: Boolean(studentId),
  })
}
