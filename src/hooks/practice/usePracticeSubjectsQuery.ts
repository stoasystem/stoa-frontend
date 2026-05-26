import { useQuery } from '@tanstack/react-query'
import { getPracticeSubjects } from '@/services/practice/practiceApi'
import { practiceQueryKeys } from '@/services/practice/practiceQueryKeys'

export function usePracticeSubjectsQuery() {
  return useQuery({
    queryKey: practiceQueryKeys.subjects(),
    queryFn: getPracticeSubjects,
  })
}
