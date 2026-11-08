import type { SupportedLanguage } from '@/i18n/languages'

/**
 * One thing a list-chosen profile field may be set to (stoa-backend#310): the
 * code that is stored and sent, and its name in the request's language. The
 * client renders the backend's names and keeps no copy of the list.
 */
export type ProfileChoice = { code: string; label: string }

/**
 * What each list-chosen profile field may be set to, in the order offered.
 * `grade` since stoa-backend#310; the answer style follows (#597).
 */
export type ProfileChoices = {
  grade: ProfileChoice[]
}

export type StudentProfile = {
  id: string
  userId: string
  name: string
  email: string
  /**
   * The year group: a code from `choices.grade`, or "" when none was said.
   * Old free text no code can be read from comes back as stored; it is in no
   * list, so it counts as not said (`readableChoice`).
   */
  grade: string
  /** The subjects the student ticked as taken this term; they count as enrolled on the star map (stoa-backend#321). */
  primarySubjects: string[]
  schoolSystem?: string
  preferredAnswerLanguage: SupportedLanguage
  guardianStatus: 'linked' | 'not_linked'
  createdAt: string
  updatedAt: string
  /** Missing only from a backend before stoa-backend#310. */
  choices?: ProfileChoices
}

/** What `PATCH /students/me/profile` takes: the fields a student sets. */
export type StudentProfileUpdate = Partial<Pick<StudentProfile, 'grade' | 'primarySubjects' | 'schoolSystem' | 'preferredAnswerLanguage'>>

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
