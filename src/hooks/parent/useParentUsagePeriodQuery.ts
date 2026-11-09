import { useQuery } from '@tanstack/react-query'
import { getParentUsagePeriod } from '@/services/parent/parentApi'
import { parentQueryKeys } from '@/services/parent/parentQueryKeys'

/** The parent's own usage period and each child's; `enabled` false for any other role (the route answers 403). */
export function useParentUsagePeriodQuery(enabled = true) {
  return useQuery({
    queryKey: parentQueryKeys.usagePeriod(),
    queryFn: getParentUsagePeriod,
    enabled,
  })
}
