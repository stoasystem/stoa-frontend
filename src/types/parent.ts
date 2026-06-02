export type ParentChild = {
  id: string
  userId: string
  name: string
  email: string
  grade: string | null
  subjects: string[]
  relationship: string
}

export type ParentChildActivity = {
  id: string
  type: 'question' | 'conversation' | 'teacher_help' | 'practice' | 'practice_mistake' | 'report' | string
  title: string
  summary: string
  subject: string | null
  createdAt: string
}

export type ChildLearningSummary = {
  student: {
    id: string
    name: string
    grade: string | null
  }
  questionsAskedThisWeek: number
  aiResolvedThisWeek: number
  teacherHelpRequestsThisWeek: number
  practiceLessonsCompletedThisWeek: number
  weakTopics: string[]
  recentActivity: ParentChildActivity[]
}

export type ChildLearningHistoryResponse = {
  items: ParentChildActivity[]
}
