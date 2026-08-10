import { httpClient } from '@/services/api/httpClient'

export interface MemorySnapshot {
  student_id: string
  subject: string
  topic_id: string
  weak_topics: string[]
  struggling_concepts: string[]
  mastered_concepts: string[]
  strengths: string[]
  count: number
  confidence?: string
  last_seen_at?: string
}

export interface MemorySummaryResponse {
  snapshots: MemorySnapshot[]
  generated_snapshots: MemorySnapshot[]
  stored_snapshots: MemorySnapshot[]
  profile: Record<string, unknown>
  recommendations: Array<{
    topic_id: string
    subject: string
    confidence?: string
    reason?: string
  }>
}

export async function getMyMemorySummary(subject?: string): Promise<MemorySummaryResponse> {
  const params = subject ? { subject } : undefined
  const response = await httpClient.get<MemorySummaryResponse>('/students/me/memory', { params })
  return response.data
}
