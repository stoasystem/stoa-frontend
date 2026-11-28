import { httpClient } from '@/services/api/httpClient'
import type { StudentEntitlement, StudentProfile } from '@/types/student'

export async function getStudentProfile() {
  const response = await httpClient.get<StudentProfile>('/students/me/profile')
  return response.data
}

export async function updateStudentProfile(payload: Partial<StudentProfile>) {
  const response = await httpClient.patch<StudentProfile>('/students/me/profile', payload)
  return response.data
}

export async function getStudentEntitlement() {
  const response = await httpClient.get<StudentEntitlement>('/students/me/entitlement')
  return response.data
}
