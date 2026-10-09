
import { httpClient } from '@/services/api/httpClient'

import type { TeacherWeeklyAvailability } from '@/types/teacherAvailability'

export async function getTeacherWeeklyAvailability() {
  const response = await httpClient.get<TeacherWeeklyAvailability>('/teachers/me/availability')
  return response.data
}

export async function updateTeacherWeeklyAvailability(payload: TeacherWeeklyAvailability) {
  const response = await httpClient.patch<TeacherWeeklyAvailability>('/teachers/me/availability', payload)
  return response.data
}
