import type { SupportedLanguage } from '@/i18n/languages'

export type StudentProfile = {
  id: string
  userId: string
  name: string
  email: string
  grade: string
  primarySubjects: string[]
  schoolSystem?: string
  preferredAnswerLanguage: SupportedLanguage
  guardianStatus: 'linked' | 'not_linked'
  createdAt: string
  updatedAt: string
}

/** Where a history row came from, and what happened in it. */
export type LearningHistorySource = 'questions' | 'practice_path' | 'practice_library' | 'classroom'

export type LearningHistoryKind =
  | 'question_asked'
  | 'question_answered'
  | 'teacher_help'
  | 'practice_lesson'
  | 'library_set'

export type LearningHistoryItem = {
  id: string
  subject: string
  title: string
  summary: string
  createdAt: string
  href?: string
  // `title` and `sourceLabel` are the server's English fallbacks. `kind` and
  // `source` are the machine-readable pair the UI renders from, so the row
  // reads in the student's language and grouping does not depend on wording.
  sourceLabel?: string
  kind?: LearningHistoryKind
  source?: LearningHistorySource
}

export type StudentEntitlement = {
  effectivePlan: string
  newUsageAllowed: boolean
  teacherSupportIncluded: boolean
  dailyAiQuestionLimit?: number | null
  dailyChatMessageLimit?: number | null
  freeTrialActive: boolean
  freeTrialEndsAt?: string | null
}
