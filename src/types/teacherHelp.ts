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
 * Whether the server takes a teacher's reply on a request in this status.
 * The holder may still add to a resolved request (user decision, #222); one
 * that ended without a teacher has nobody holding it and is refused.
 */
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

export function acceptsTeacherReply(status: TeacherHelpStatus | undefined): boolean {
  return isOpenHelpRequest(status) || status === 'resolved'
}

export type TeacherHelpRequest = {
  requestId: string
  conversationId: string
  status: TeacherHelpStatus
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
