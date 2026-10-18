import { apiPath } from '@/services/api/apiPath'
import { httpClient } from '@/services/api/httpClient'
import type { ParentChildReportState } from '@/types/parentReport'

export async function getChildReport(childId: string) {
  const response = await httpClient.get<ParentChildReportState>(
    apiPath`/parents/me/children/${childId}/report`,
  )
  return response.data
}
