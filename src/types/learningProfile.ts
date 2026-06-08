export type LearningSubjectRolloutState = 'active' | 'foundation'

export type LearningSubjectDefinition = {
  id: string
  label: string
  rolloutState: LearningSubjectRolloutState
}

export type LearningSubjectActivity = {
  subject: string
  label: string
  rolloutState: LearningSubjectRolloutState
  questionCount: number
  aiResolvedCount: number
  teacherEscalationCount: number
  feedbackAverage: number | null
}

export type LearningWeakTopic = {
  subject: string
  topicId: string
  label: string
  count: number
  latestEvidenceAt?: string | null
  evidenceQuestionIds: string[]
}

export type LearningProfile = {
  studentId: string
  subjects: LearningSubjectDefinition[]
  subjectActivity: LearningSubjectActivity[]
  weakTopics: LearningWeakTopic[]
  strengthTopics: LearningWeakTopic[]
  updatedAt: string
}

export const learningSubjectOptions: LearningSubjectDefinition[] = [
  { id: 'math', label: 'Mathematics', rolloutState: 'active' },
  { id: 'physics', label: 'Physics', rolloutState: 'foundation' },
  { id: 'german', label: 'German', rolloutState: 'foundation' },
  { id: 'english', label: 'English', rolloutState: 'foundation' },
]
