import { useQuery } from '@tanstack/react-query'
import { getChildLearningProfile } from '@/services/parent/parentApi'
import { parentQueryKeys } from '@/services/parent/parentQueryKeys'

export function useChildLearningProfileQuery(childId: string | undefined) {
  return useQuery({
    queryKey: parentQueryKeys.childLearningProfile(childId ?? ''),
    queryFn: () => getChildLearningProfile(childId ?? ''),
    enabled: Boolean(childId),
  })
}
