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
 * The status changes the server takes on a request in this status, mirroring
 * `advance_help_request` in stoa-backend: only `pending` and `in_progress`
 * move. A pending request can be taken or finished at once; one in progress
 * can only be finished (taking it again was a no-op write, #269).
 */
export function teacherStatusActions(status: TeacherHelpStatus | undefined): TeacherHelpStatus[] {
  if (status === 'pending') return ['in_progress', 'resolved']
  if (status === 'in_progress') return ['resolved']
  return []
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

/**
 * Whether this student can still ask a teacher this week (stoa-backend#144).
 * `blockedReason` is the code a request would be refused with; only the
 * allowance comes back with the week, at `resetsAt`.
 */
export type TeacherSupportStanding = {
  canRequest: boolean
  remainingCases: number
  weeklyCases: number
  blockedReason?: 'teacher_support_allowance_exhausted' | 'teacher_support_not_included' | null
  resetsAt?: string | null
}

export type TeacherAvailability = {
  online: boolean
  availableTeachers: number
  nextWindow?: string
  responseTime?: string
  /** `null` when it could not be read: then no allowance is shown at all. */
  teacherSupport?: TeacherSupportStanding | null
}
