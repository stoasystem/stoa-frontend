import { useQuery } from '@tanstack/react-query'
import { getSubjectPath } from '@/services/practice/practiceApi'
import { practiceQueryKeys } from '@/services/practice/practiceQueryKeys'

export function useSubjectPathQuery(subjectId: string | undefined) {
  return useQuery({
    queryKey: practiceQueryKeys.subjectPath(subjectId ?? ''),
    queryFn: () => getSubjectPath(subjectId ?? ''),
    enabled: Boolean(subjectId),
  })
}
