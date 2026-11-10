import type { SupportedLanguage } from '@/i18n/languages'

/** One value a list-chosen profile field may take, named by the backend in the request's language (stoa-backend#310). */
export type ProfileChoice = { code: string; label: string }

/**
 * What each list-chosen profile field may be set to, in the order offered
 * (`choices.<field>`): the grade, and the answer style preset (#597).
 */
export type ProfileChoices = {
  grade: ProfileChoice[]
  /** Missing only from a backend before stoa-backend#314. */
  answerStyle?: ProfileChoice[]
}

export type StudentProfile = {
  id: string
  userId: string
  name: string
  email: string
  /**
   * A code from `choices.grade`, "" when none was said. Old text the backend
   * cannot read comes back as stored: it is in no list, so it counts as no
   * grade (`readableChoice`).
   */
  grade: string
  primarySubjects: string[]
  /**
   * A code from `choices.answerStyle`, "standard" when none was chosen
   * (stoa-backend#314). Missing only from a backend before it. The student's
   * own: no other role reads or sends it.
   */
  answerStyle?: string
  schoolSystem?: string
  /**
   * The language the account stored (`preferred_locale`), null when it never
   * stored one: opening an account stores none, only the student's own choice
   * does. The language first (#627) asks then.
   */
  preferredAnswerLanguage: SupportedLanguage | null
  guardianStatus: 'linked' | 'not_linked'
  createdAt: string
  updatedAt: string
  /** Missing only from a backend before stoa-backend#310. */
  choices?: ProfileChoices
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

/** Where a usage period stands (stoa-backend#239): `none` is an account no period was ever set for. */
export type UsagePeriodState = 'active' | 'expired' | 'none'

/** Whose period covers the student: their own, or a parent's (never which parent). */
export type StudentUsagePeriodPaidBy = 'self' | 'parent'

/**
 * The student's effective usage period, as `GET /students/me/entitlement`
 * reports it (stoa-backend#343). Billing is offline: an admin sets each paying
 * account's period, and a parent's covers their children.
 *
 * - `endsAt`: the last day it may be used, a Zurich date (`YYYY-MM-DD`; the
 *   period ends 23:59:59 that day). Format it as a date, never parse it as a
 *   UTC midnight. `null` without a period.
 * - `daysLeft`: the Zurich days after today -- 0 on the end day (still
 *   active) and once expired, `null` without a period.
 * - `paidBy`: `null` without a period.
 */
export type StudentUsagePeriod = {
  endsAt: string | null
  state: UsagePeriodState
  daysLeft: number | null
  paidBy: StudentUsagePeriodPaidBy | null
}

export type StudentEntitlement = {
  effectivePlan: string
  newUsageAllowed: boolean
  teacherSupportIncluded: boolean
  dailyAiQuestionLimit?: number | null
  dailyChatMessageLimit?: number | null
  usagePeriod: StudentUsagePeriod
  /** Where a student who pays for themselves asks for more time. */
  renewalContactEmail: string
}
