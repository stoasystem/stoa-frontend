export type ParentMonthlyReport = {
  id: string
  student: {
    id: string
    name: string
    grade: string
  }
  monthLabel: string
  summary: string
  subjectBreakdown: {
    subject: string
    questionsAnswered: number
    teacherHelpRequests: number
    progressLabel: string
    summary: string
  }[]
  weakPointTrend: {
    topic: string
    subject: string
    trend: 'improving' | 'steady' | 'needs_attention'
    summary: string
  }[]
  teacherHelpSummary: string
  recommendations: string[]
  suggestedParentActions: string[]
  generatedAt: string
}
