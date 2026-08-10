import { httpClient } from '@/services/api/httpClient'

/** A topic the student has repeatedly struggled with. */
export interface MemoryWeakTopic {
  subject: string
  topicId: string
  label: string
  count: number
  latestEvidenceAt: string | null
  evidenceQuestionIds: string[]
}

/** A ranked next-practice suggestion produced by the sequencing engine. */
export interface MemoryRecommendation {
  candidateId: string
  type: string
  sourceType: string
  sourceId: string
  subject: string
  topicId: string
  label: string
  rationale: string
  confidence: 'high' | 'medium' | 'low'
  freshness: { status: string; lastEvidenceAt: string | null; source: string }
  reviewRequired: boolean
  reviewFlags: string[]
}

export interface MemorySummaryResponse {
  studentId: string
  roleView: string
  subjects: Array<{ id: string; label: string; rolloutState: string }>
  weakTopics: MemoryWeakTopic[]
  strengthTopics: unknown[]
  memorySnapshots: unknown[]
  recommendations: MemoryRecommendation[]
  sequencingSummary: Record<string, unknown>
  freshness: Record<string, unknown>
  updatedAt: string
}

export async function getMyMemorySummary(subject?: string): Promise<MemorySummaryResponse> {
  const params = subject ? { subject } : undefined
  const response = await httpClient.get<MemorySummaryResponse>('/students/me/memory', { params })
  return response.data
}
