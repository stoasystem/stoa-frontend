import { httpClient } from '@/services/api/httpClient'

import type {
  TeacherDispatchStatus,
  TeacherWeeklyAvailability,
  TeacherWeeklyAvailabilityUpdate,
} from '@/types/teacherAvailability'

export async function getTeacherWeeklyAvailability() {
  const response = await httpClient.get<TeacherWeeklyAvailability>('/teachers/me/availability')
  return response.data
}

/** Subjects and hours only: the status is left out, so the backend keeps it. */
export async function updateTeacherWeeklyAvailability(payload: TeacherWeeklyAvailabilityUpdate) {
  const response = await httpClient.patch<TeacherWeeklyAvailability>('/teachers/me/availability', {
    subjects: payload.subjects,
    weeklyAvailability: payload.weeklyAvailability,
  })
  return response.data
}

/** The status alone (#768): subjects and hours are left out, so the backend keeps them. */
export async function updateTeacherDispatchStatus(status: TeacherDispatchStatus) {
  const response = await httpClient.patch<TeacherWeeklyAvailability>('/teachers/me/availability', { status })
  return response.data
}
