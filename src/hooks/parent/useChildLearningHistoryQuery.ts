import { useQuery } from '@tanstack/react-query'
import { getChildLearningHistory } from '@/services/parent/parentApi'
import { parentQueryKeys } from '@/services/parent/parentQueryKeys'

export function useChildLearningHistoryQuery(childId: string | undefined) {
  return useQuery({
    queryKey: parentQueryKeys.childHistory(childId ?? ''),
    queryFn: () => getChildLearningHistory(childId ?? ''),
    enabled: Boolean(childId),
  })
}
