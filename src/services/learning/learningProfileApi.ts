import { httpClient } from '@/services/api/httpClient'
import type { LearningProfile } from '@/types/learningProfile'

export async function getLearningProfile(studentId: string) {
  // The id comes from the address, decoded by the router: `x%252F..` arrives as
  // `x/..`, and unencoded it would walk the request to another API path.
  const response = await httpClient.get<LearningProfile>(
    `/students/${encodeURIComponent(studentId)}/learning-profile`,
  )
  return response.data
}
