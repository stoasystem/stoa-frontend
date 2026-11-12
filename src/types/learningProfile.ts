export type LearningSubjectRolloutState = 'active' | 'foundation'

export type LearningSubjectDefinition = {
  id: string
  /**
   * Optional: the learning-profile endpoints send `label` (English) and no
   * `labelKey`, so name a subject through `learningSubjectLabelKey` (#639).
   */
  labelKey?: string
  /** The backend's English name, the fallback for a subject we have no key for. */
  label?: string
  rolloutState: LearningSubjectRolloutState
}

/** The `chat` namespace key that names a subject: its own, or `subjects.<id>` (#639). */
export function learningSubjectLabelKey(subject: Pick<LearningSubjectDefinition, 'id' | 'labelKey'>) {
  return subject.labelKey ?? `subjects.${subject.id}`
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
  { id: 'math', labelKey: 'subjects.math', rolloutState: 'active' },
  { id: 'physics', labelKey: 'subjects.physics', rolloutState: 'foundation' },
  { id: 'german', labelKey: 'subjects.german', rolloutState: 'foundation' },
  { id: 'english', labelKey: 'subjects.english', rolloutState: 'foundation' },
]
