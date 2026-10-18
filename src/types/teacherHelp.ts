export type TeacherHelpStatus =
  | 'pending'
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
  return status === 'pending' || status === 'assigned' || status === 'in_progress'
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

export type TeacherAvailability = {
  online: boolean
  availableTeachers: number
  nextWindow?: string
  responseTime?: string
}
