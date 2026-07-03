import { useQuery } from '@tanstack/react-query'
import { getParentAccountOperations } from '@/services/parent/parentApi'
import { parentQueryKeys } from '@/services/parent/parentQueryKeys'

export function useParentAccountOperationsQuery() {
  return useQuery({
    queryKey: parentQueryKeys.accountOperations(),
    queryFn: getParentAccountOperations,
    retry: false,
  })
}
