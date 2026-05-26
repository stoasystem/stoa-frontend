export type TeacherHelpStatus =
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'cancelled'

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
