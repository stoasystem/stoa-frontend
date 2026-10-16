export type TeacherHelpStatus =
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'cancelled'

/** Still with a teacher: not yet resolved, not withdrawn or expired. */
export function isOpenHelpRequest(status: TeacherHelpStatus | undefined): boolean {
  return status === 'pending' || status === 'assigned' || status === 'in_progress'
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
