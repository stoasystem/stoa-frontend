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
