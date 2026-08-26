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

export type LearningHistoryItem = {
  id: string
  subject: string
  title: string
  summary: string
  createdAt: string
  href?: string
  sourceLabel?: string
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
