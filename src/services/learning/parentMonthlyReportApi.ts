import { mockParentMonthlyReport } from '@/data/phase12MockData'
import { httpClient } from '@/services/api/httpClient'
import { withDemoFallback } from '@/services/demo/demoFallback'
import type { ParentMonthlyReport } from '@/types/parentMonthlyReport'

export async function getParentMonthlyReport(childId: string) {
  return withDemoFallback(async () => {
    const response = await httpClient.get<ParentMonthlyReport>(`/parent/children/${childId}/monthly-report`)
    return response.data
  }, {
    ...mockParentMonthlyReport,
    student: { ...mockParentMonthlyReport.student, id: childId },
  })
}
