import { useQuery } from '@tanstack/react-query'
import { getChildLearningSummary } from '@/services/parent/parentApi'
import { parentQueryKeys } from '@/services/parent/parentQueryKeys'

export function useChildLearningSummaryQuery(childId: string | undefined) {
  return useQuery({
    queryKey: parentQueryKeys.childSummary(childId ?? ''),
    queryFn: () => getChildLearningSummary(childId ?? ''),
    enabled: Boolean(childId),
  })
}
