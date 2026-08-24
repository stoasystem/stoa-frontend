
import { httpClient } from '@/services/api/httpClient'

import type { TutorAvailability } from '@/types/tutorAvailability'

export async function getTutorAvailability() {
  const response = await httpClient.get<TutorAvailability>('/teachers/me/availability')
  return response.data
}

export async function updateTutorAvailability(payload: TutorAvailability) {
  const response = await httpClient.patch<TutorAvailability>('/teachers/me/availability', payload)
  return response.data
}
