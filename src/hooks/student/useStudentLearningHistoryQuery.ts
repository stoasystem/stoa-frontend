import { useQuery } from '@tanstack/react-query'
import { getStudentLearningHistory } from '@/services/student/studentApi'
import { studentQueryKeys } from '@/services/student/studentQueryKeys'

export function useStudentLearningHistoryQuery() {
  return useQuery({
    queryKey: studentQueryKeys.learningHistory(),
    queryFn: getStudentLearningHistory,
  })
}
