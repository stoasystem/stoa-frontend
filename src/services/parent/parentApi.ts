import { httpClient } from '@/services/api/httpClient'
import {
  mockChildLearningHistory,
  mockChildLearningSummary,
  mockParentChildren,
} from '@/data/phase11MockData'
import { withDemoFallback } from '@/services/demo/demoFallback'
import type { ChildLearningSummary, ParentChild } from '@/types/parent'
import type { LearningHistoryItem } from '@/types/student'

export async function getParentChildren() {
  return withDemoFallback(async () => {
    const response = await httpClient.get<{ items: ParentChild[] }>('/parents/me/children')
    return response.data
  }, { items: mockParentChildren })
}

export async function getChildLearningSummary(childId: string) {
  return withDemoFallback(async () => {
    const response = await httpClient.get<ChildLearningSummary>(
      `/parents/me/children/${childId}/summary`,
    )
    return response.data
  }, { ...mockChildLearningSummary, student: { ...mockChildLearningSummary.student, id: childId } })
}

export async function getChildLearningHistory(childId: string) {
  return withDemoFallback(async () => {
    const response = await httpClient.get<{ items: LearningHistoryItem[] }>(
      `/parents/me/children/${childId}/history`,
    )
    return response.data
  }, { items: mockChildLearningHistory })
}
