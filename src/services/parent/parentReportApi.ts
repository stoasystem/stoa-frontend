import { httpClient } from '@/services/api/httpClient'
import type { ParentChildReportState } from '@/types/parentReport'

export async function getChildReport(childId: string) {
  const response = await httpClient.get<ParentChildReportState>(
    `/parents/me/children/${childId}/report`,
  )
  return response.data
}
