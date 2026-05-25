import { mockTutorAvailability } from '@/data/phase11MockData'
import { httpClient } from '@/services/api/httpClient'
import { withDemoFallback } from '@/services/demo/demoFallback'
import type { TutorAvailability } from '@/types/tutorAvailability'

let demoAvailability = mockTutorAvailability

export async function getTutorAvailability() {
  return withDemoFallback(async () => {
    const response = await httpClient.get<TutorAvailability>('/tutors/me/availability')
    return response.data
  }, demoAvailability)
}

export async function updateTutorAvailability(payload: TutorAvailability) {
  return withDemoFallback(async () => {
    const response = await httpClient.patch<TutorAvailability>('/tutors/me/availability', payload)
    return response.data
  }, () => {
    demoAvailability = payload
    return demoAvailability
  })
}
