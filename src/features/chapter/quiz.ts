/*
 * The short quiz that gives credit for a lesson without answering every
 * exercise in order (product decision 2026-09-29, after Duolingo).
 *
 * Nothing about the quiz is decided here. The backend draws the paper, judges
 * every answer, counts the hearts and, on a pass, issues the credential that
 * `POST /practice/lessons/:id/complete` accepts (stoa-backend#92 / #83). The
 * frontend used to hold its own copy of all of it; the two never agreed, and a
 * student who passed the frontend's quiz was refused by the backend with
 * `lesson_exercises_unanswered`. What is left here is the names of the
 * refusals and the sentence each one gets.
 *
 * Skipping inside a lesson still gives no credit: the exercise goes to the
 * back of the queue (`useLessonRun`). During a quiz there are no hints, no
 * Ask and no skip. A reload abandons the quiz; the backend's session expires
 * on its own.
 */

/** Every refusal the three quiz endpoints name. */
export const QUIZ_TROUBLES = [
  'lesson_locked',
  'lesson_quiz_unavailable',
  'lesson_quiz_not_found',
  'lesson_quiz_expired',
  'lesson_quiz_finished',
  'lesson_quiz_credential_invalid',
  'lesson_quiz_credential_expired',
  'lesson_exercises_unanswered',
] as const

export type QuizTroubleCode = (typeof QUIZ_TROUBLES)[number]
/** A refusal the stage has words for, or anything else that went wrong. */
export type QuizTrouble = QuizTroubleCode | 'unknown'

const SENTENCE: Record<QuizTrouble, string> = {
  lesson_locked: 'stage.trouble.locked',
  lesson_quiz_unavailable: 'stage.trouble.unavailable',
  lesson_quiz_not_found: 'stage.trouble.notFound',
  lesson_quiz_expired: 'stage.trouble.expired',
  lesson_quiz_finished: 'stage.trouble.finished',
  lesson_quiz_credential_invalid: 'stage.trouble.credentialInvalid',
  lesson_quiz_credential_expired: 'stage.trouble.credentialExpired',
  lesson_exercises_unanswered: 'stage.trouble.unanswered',
  unknown: 'stage.trouble.unknown',
}

/** Troubles a fresh quiz is a way out of. */
const RESTARTABLE = new Set<QuizTrouble>([
  'lesson_quiz_not_found',
  'lesson_quiz_expired',
  'lesson_quiz_finished',
  'lesson_quiz_credential_invalid',
  'lesson_quiz_credential_expired',
])

function troubleCode(error: unknown): string | undefined {
  const code = (error as { code?: unknown } | null)?.code
  return typeof code === 'string' ? code : undefined
}

/** What the backend refused with, named, or `unknown` for anything else. */
export function quizTrouble(error: unknown): QuizTrouble {
  const code = troubleCode(error)
  return QUIZ_TROUBLES.find((known) => known === code) ?? 'unknown'
}

/** The sentence the student reads, as a key of the `chapter` namespace. */
export function quizTroubleKey(trouble: QuizTrouble) {
  return SENTENCE[trouble]
}

/** Whether taking the quiz again is a way out of this trouble. */
export function quizTroubleIsRestartable(trouble: QuizTrouble) {
  return RESTARTABLE.has(trouble)
}
