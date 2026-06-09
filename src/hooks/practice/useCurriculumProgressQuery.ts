import { useQuery } from '@tanstack/react-query'
import { getCurriculumProgress } from '@/services/practice/practiceApi'
import { practiceQueryKeys } from '@/services/practice/practiceQueryKeys'

export function useCurriculumProgressQuery({
  studentId,
  subjectId,
  enabled = true,
}: {
  studentId?: string
  subjectId?: string
  enabled?: boolean
} = {}) {
  return useQuery({
    queryKey: practiceQueryKeys.curriculumProgress(studentId, subjectId),
    queryFn: () => getCurriculumProgress({ studentId, subjectId }),
    enabled,
  })
}
