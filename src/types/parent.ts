import type { DashboardStat, RecentQuestion, WeakTopic } from '@/types/dashboard'

export type ParentChild = {
  id: string
  name: string
  grade: string
  primarySubjects: string[]
}

export type TeacherHelpRecord = {
  id: string
  subject: string
  status: 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'cancelled'
  createdAt: string
}

export type ChildLearningSummary = {
  student: {
    id: string
    name: string
    grade: string
  }
  stats: DashboardStat[]
  weakTopics: WeakTopic[]
  recentQuestions: RecentQuestion[]
  teacherHelpRecords: TeacherHelpRecord[]
}
