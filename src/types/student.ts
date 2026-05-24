export type StudentProfile = {
  id: string
  userId: string
  name: string
  grade: string
  primarySubjects: string[]
  schoolSystem?: string
  createdAt?: string
  updatedAt?: string
}

export type LearningHistoryItem = {
  id: string
  subject: string
  title: string
  summary: string
  createdAt: string
}
