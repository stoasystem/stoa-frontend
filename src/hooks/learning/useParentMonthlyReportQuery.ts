import { useQuery } from '@tanstack/react-query'
import { getParentMonthlyReport } from '@/services/learning/parentMonthlyReportApi'

export function useParentMonthlyReportQuery(childId: string) {
  return useQuery({
    queryKey: ['parent', 'children', childId, 'monthly-report'],
    queryFn: () => getParentMonthlyReport(childId),
    enabled: Boolean(childId),
  })
}
