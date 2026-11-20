export type TeacherHelpStatus =
  | 'pending'
  // Waiting like `pending`, but nobody could be offered it when it was sent or
  // read: no teacher is free. A teacher takes it once one is (stoa-backend #86).
  // Only the student's view says it; the teacher list carries the stored status.
  | 'waiting_no_teacher'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'cancelled'
  // Ended before any teacher took it: the student withdrew it, or nobody took
  // it in time (stoa-backend #86, #87).
  | 'withdrawn'
  | 'expired'

/** Still with a teacher: not yet resolved, not withdrawn or expired. */
export function isOpenHelpRequest(status: TeacherHelpStatus | undefined): boolean {
  return (
    status === 'pending' || status === 'waiting_no_teacher' || status === 'assigned' || status === 'in_progress'
  )
}

/**
 * Over: resolved, cancelled, withdrawn or expired. A conversation has one
 * request (stoa-backend `request_teacher_help` hands back the same one), so
 * once it is over a teacher is asked from a new conversation (#544).
 */
export function isEndedHelpRequest(status: TeacherHelpStatus | undefined): boolean {
  return status === 'resolved' || status === 'cancelled' || status === 'withdrawn' || status === 'expired'
}

/**
 * The student may take it back: still waiting, or offered to a teacher who has
 * not taken it (the student's view says `assigned` for both an offer and a
 * teacher who holds it, so the server's 409 settles that one) (#543).
 */
export function isWithdrawableHelpRequest(status: TeacherHelpStatus | undefined): boolean {
  return status === 'pending' || status === 'waiting_no_teacher' || status === 'assigned'
}

/**
 * Whether the server takes a teacher's reply on a request in this status: only
 * from the teacher holding it (stoa-backend#479). Offered and not yet accepted
 * (`pending`), the reply is refused with `help_request_not_accepted`, so the
 * teacher accepts it first (#705). The holder may still add to a resolved
 * request (user decision, #222); one that ended without a teacher has nobody
 * holding it and is refused.
 */
export function acceptsTeacherReply(status: TeacherHelpStatus | undefined): boolean {
  return status === 'in_progress' || status === 'resolved'
}

/** Offered to the teacher and not yet accepted: the one step left is to accept it (#705). */
export function awaitsTeacherAcceptance(status: TeacherHelpStatus | undefined): boolean {
  return status === 'pending'
}

/**
 * How the student asked to be helped (stoa-backend#480): a text answer in the
 * conversation, or the online classroom. Chosen when asking, never changed.
 */
export type HelpMode = 'text' | 'classroom'

/**
 * The request's mode as the app reads it: a request without one (asked before
 * modes, or an older server) is a text answer, as the backend counts it.
 */
export function helpModeOf(request: { mode?: unknown } | null | undefined): HelpMode {
  return request?.mode === 'classroom' ? 'classroom' : 'text'
}

export type TeacherHelpRequest = {
  requestId: string
  conversationId: string
  status: TeacherHelpStatus
  /** Missing on an older request: then a text answer (`helpModeOf`). */
  mode?: HelpMode
  teacherName?: string
  createdAt: string
  updatedAt?: string
}

/** Why a request of one way would be refused this week (stoa-backend#144, #482). */
export type TeacherSupportBlockedReason = 'teacher_support_allowance_exhausted' | 'teacher_support_not_included'

/**
 * Whether this student can still ask for one way of help this Zurich week
 * (stoa-backend#482). `blockedReason` is the code a request of this way would
 * be refused with: `teacher_support_not_included` when the plan has none of it
 * (a classroom outside the online classroom plan), `..._exhausted` when this
 * week's are used up; those come back at `resetsAt`.
 */
export type TeacherSupportModeStanding = {
  canRequest: boolean
  remainingCases: number
  weeklyCases: number
  blockedReason?: TeacherSupportBlockedReason | null
  resetsAt?: string | null
}

/**
 * Whether this student can still ask a teacher this week (stoa-backend#144).
 * The top-level fields are the text answer, as before there were two ways;
 * `text` and `classroom` answer for each way (stoa-backend#482). An older
 * server sends neither block: then the top level is the text answer and the
 * classroom is not known (`helpModeStanding`).
 */
export type TeacherSupportStanding = TeacherSupportModeStanding & {
  text?: TeacherSupportModeStanding
  classroom?: TeacherSupportModeStanding
}

/**
 * One way's standing: the text answer falls back to the top level; a
 * classroom without its block is `null`, not known, and is then offered and
 * left to the server to refuse.
 */
export function helpModeStanding(
  support: TeacherSupportStanding | null | undefined,
  mode: HelpMode,
): TeacherSupportModeStanding | null {
  if (!support) return null
  if (mode === 'text') return support.text ?? support
  return support.classroom ?? null
}

export type TeacherAvailability = {
  online: boolean
  availableTeachers: number
  nextWindow?: string
  responseTime?: string
  /** `null` when it could not be read: then no allowance is shown at all. */
  teacherSupport?: TeacherSupportStanding | null
}
