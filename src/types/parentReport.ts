export type ParentChildReportDetail = {
  reportId: string
  parentId: string
  studentId: string
  weekStart: string
  weekEnd?: string | null
  usageCount: number
  aiResolved: number
  teacherResolved: number
  weakKnowledgePoints: string[]
  recommendations: string
  recommendationItems: string[]
  stats: {
    questionsAsked: number
    aiResolved: number
    teacherHelpRequests: number
    practiceLessonsCompleted: number
    mistakesLogged: number
  }
  summary: string
  strengths: string[]
  weakTopics: Array<{
    topic: string
    note: string
  }>
  teacherNote?: string | null
  generatedAt?: string | null
  emailStatus?: string | null
  reportStatus?: string | null
  emailErrorClass?: string | null
  emailErrorMessage?: string | null
  generationErrorClass?: string | null
  generationErrorMessage?: string | null
}

export type ParentChildReportState = {
  status: 'available' | 'missing' | 'pending' | 'failed'
  report: ParentChildReportDetail | null
  message?: string | null
}

// Legacy rich report types are still used by demo-only monthly/report components.
export type ParentReportPeriod = {
  label: string
  startDate: string
  endDate: string
}

export type ParentReportStudent = {
  id: string
  name: string
  grade: string
}

export type ParentReportStat = {
  label: string
  value: string
  description: string
}

export type ParentReportSubject = {
  id: string
  name: string
  questionsAnswered: number
  teacherHelpCount: number
  progressLabel: string
  summary: string
}

export type ParentReportWeakTopic = {
  id: string
  subject: string
  topic: string
  level: 'low' | 'medium' | 'high'
  summary: string
}

export type ParentReportRecommendation = {
  id: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
}

export type ParentWeeklyReport = {
  id: string
  student: ParentReportStudent
  period: ParentReportPeriod
  summary: string
  stats: ParentReportStat[]
  topSubjects: ParentReportSubject[]
  weakTopics: ParentReportWeakTopic[]
  recommendations: ParentReportRecommendation[]
  generatedAt: string
}
