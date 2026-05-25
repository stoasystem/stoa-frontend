export type TutorAssignmentRequest = {
  requestId: string
  studentName: string
  subject: string
  grade: string
  createdAt: string
  priority: 'low' | 'normal' | 'high'
}

export type AvailableTutor = {
  tutorId: string
  name: string
  subjects: string[]
  currentLoad: number
  isAvailableNow: boolean
}

export type TutorAssignmentSuggestion = {
  requestId: string
  tutorId: string
  reason: string
}

export type TutorScheduleSlot = {
  tutorId: string
  tutorName: string
  dayLabel: string
  timeRange: string
  subjects: string[]
}

export type TutorAssignmentBoard = {
  pendingRequests: TutorAssignmentRequest[]
  availableTutors: AvailableTutor[]
  suggestions: TutorAssignmentSuggestion[]
  scheduleOverview: TutorScheduleSlot[]
}
