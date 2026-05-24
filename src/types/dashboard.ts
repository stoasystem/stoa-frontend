export type DashboardStat = {
  label: string
  value: string
  description: string
}

export type WeakTopic = {
  id: string
  subject: string
  topic: string
  level: 'low' | 'medium' | 'high'
}

export type RecentQuestion = {
  id: string
  subject: string
  title: string
  createdAt: string
  status: 'answered_by_ai' | 'teacher_helped' | 'pending'
}

export type TeacherFeedback = {
  id: string
  teacherName: string
  content: string
  createdAt: string
}

export type LearningProgress = {
  id: string
  subject: string
  completed: number
  target: number
  description: string
}
