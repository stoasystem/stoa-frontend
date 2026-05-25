import { httpClient } from '@/services/api/httpClient'
import { mockParentWeeklyReport } from '@/data/phase11MockData'
import { withDemoFallback } from '@/services/demo/demoFallback'
import type { ParentWeeklyReport } from '@/types/parentReport'

export async function getChildReport(childId: string) {
  return withDemoFallback(async () => {
    const response = await httpClient.get<ParentWeeklyReport>(
      `/parents/me/children/${childId}/report`,
    )
    return response.data
  }, { ...mockParentWeeklyReport, student: { ...mockParentWeeklyReport.student, id: childId } })
}
