import { httpClient } from '@/services/api/httpClient'
import type { ChildLearningSummary, ParentChild } from '@/types/parent'
import type { LearningHistoryItem } from '@/types/student'

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
  const response = await httpClient.get<{ items: LearningHistoryItem[] }>(
    `/parents/me/children/${childId}/history`,
  )
  return response.data
}
