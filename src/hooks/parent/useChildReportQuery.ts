import { useQuery } from '@tanstack/react-query'
import { getChildReport } from '@/services/parent/parentReportApi'
import { parentQueryKeys } from '@/services/parent/parentQueryKeys'

export function useChildReportQuery(childId: string | undefined) {
  return useQuery({
    queryKey: parentQueryKeys.childReport(childId ?? ''),
    queryFn: () => getChildReport(childId ?? ''),
    enabled: Boolean(childId),
  })
}
