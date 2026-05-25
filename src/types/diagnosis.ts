export type DiagnosisWeakPoint = {
  id: string
  subject: string
  topic: string
  severity: 'low' | 'medium' | 'high'
  evidence: string[]
  recommendation: string
}

export type LearningDiagnosis = {
  studentId: string
  generatedAt: string
  summary: string
  weakPoints: DiagnosisWeakPoint[]
  nextSteps: string[]
  teacherHelpRecommendation: string
  parentExplanation: string
}
