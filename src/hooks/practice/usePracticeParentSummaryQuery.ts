import { useQuery } from '@tanstack/react-query'
import { getPracticeParentSummary } from '@/services/practice/practiceApi'
import { practiceQueryKeys } from '@/services/practice/practiceQueryKeys'

export function usePracticeParentSummaryQuery(childId: string | undefined) {
  return useQuery({
    queryKey: practiceQueryKeys.parentSummary(childId ?? ''),
    queryFn: () => getPracticeParentSummary(childId ?? ''),
    enabled: Boolean(childId),
  })
}
