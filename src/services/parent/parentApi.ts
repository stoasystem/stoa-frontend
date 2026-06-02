import { httpClient } from '@/services/api/httpClient'
import type {
  ChildLearningHistoryResponse,
  ChildLearningSummary,
  ParentChild,
} from '@/types/parent'

export async function getParentChildren() {
  const response = await httpClient.get<{ items: ParentChild[] }>('/parents/me/children')
  return response.data
}

export async function getChildLearningSummary(childId: string) {
  const response = await httpClient.get<ChildLearningSummary>(
    `/parents/me/children/${childId}/summary`,
  )
  return response.data
}

export async function getChildLearningHistory(childId: string) {
  const response = await httpClient.get<ChildLearningHistoryResponse>(
    `/parents/me/children/${childId}/history`,
  )
  return response.data
}
