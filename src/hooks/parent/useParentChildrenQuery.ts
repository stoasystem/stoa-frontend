import { useQuery } from '@tanstack/react-query'
import { getParentChildren } from '@/services/parent/parentApi'
import { parentQueryKeys } from '@/services/parent/parentQueryKeys'

export function useParentChildrenQuery() {
  return useQuery({
    queryKey: parentQueryKeys.children(),
    queryFn: getParentChildren,
  })
}
