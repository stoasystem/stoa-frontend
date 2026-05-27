import { httpClient } from '@/services/api/httpClient'
import { withDemoFallback } from '@/services/demo/demoFallback'
import type { LearningHistoryItem, StudentProfile } from '@/types/student'

const mockStudentProfile: StudentProfile = {
  id: 'student-profile-anna',
  userId: 'demo-student',
  name: 'Demo student',
  grade: 'Grade 8',
  primarySubjects: ['Mathematics', 'Physics'],
  schoolSystem: 'Swiss lower secondary',
  createdAt: '2026-05-24T09:00:00Z',
  updatedAt: '2026-05-27T09:00:00Z',
}

const mockStudentLearningHistory: { items: LearningHistoryItem[] } = {
  items: [
    {
      id: 'history-practice-equations',
      subject: 'Mathematics',
      title: 'Practice Path: Solving equations in two steps',
      summary:
        'Completed a short Practice Path lesson and checked each operation before moving to the final answer.',
      createdAt: '2026-05-27T10:30:00Z',
    },
    {
      id: 'history-learning-chat-equations',
      subject: 'Mathematics',
      title: 'Question explanation',
      summary:
        'Asked for a clearer explanation after a practice hint was not enough to understand the next step.',
      createdAt: '2026-05-26T15:20:00Z',
    },
    {
      id: 'history-teacher-support-linear-systems',
      subject: 'Mathematics',
      title: 'Teacher support request',
      summary:
        'Requested professional teacher support after repeated confusion with substitution in a linear system.',
      createdAt: '2026-05-25T16:45:00Z',
    },
  ],
}

export async function getStudentProfile() {
  return withDemoFallback(async () => {
    const response = await httpClient.get<StudentProfile>('/students/me/profile')
    return response.data
  }, mockStudentProfile)
}

export async function updateStudentProfile(payload: Partial<StudentProfile>) {
  return withDemoFallback(async () => {
    const response = await httpClient.patch<StudentProfile>('/students/me/profile', payload)
    return response.data
  }, () => ({
    ...mockStudentProfile,
    ...payload,
    updatedAt: new Date().toISOString(),
  }))
}

export async function getStudentLearningHistory() {
  return withDemoFallback(async () => {
    const response = await httpClient.get<{ items: LearningHistoryItem[] }>(
      '/students/me/learning-history',
    )
    return response.data
  }, mockStudentLearningHistory)
}
