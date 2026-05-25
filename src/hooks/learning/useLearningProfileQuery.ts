import { useQuery } from '@tanstack/react-query'
import { getLearningProfile } from '@/services/learning/learningProfileApi'

export function useLearningProfileQuery(studentId: string) {
  return useQuery({
    queryKey: ['students', studentId, 'learning-profile'],
    queryFn: () => getLearningProfile(studentId),
    enabled: Boolean(studentId),
  })
}
