import { httpClient } from '@/services/api/httpClient'
import type { ParentWeeklyReport } from '@/types/parentReport'

export async function getChildReport(childId: string) {
  const response = await httpClient.get<ParentWeeklyReport>(
    `/parents/me/children/${childId}/report`,
  )
  return response.data
}
