export type TeacherAssignmentRequest = {
  requestId: string
  studentName: string
  subject: string
  grade: string
  createdAt: string
  priority: 'low' | 'normal' | 'high'
}

export type AvailableTeacher = {
  teacherId: string
  name: string
  subjects: string[]
  currentLoad: number
  isAvailableNow: boolean
}

export type TeacherAssignmentSuggestion = {
  requestId: string
  teacherId: string
  reason: string
}

export type TeacherScheduleSlot = {
  teacherId: string
  teacherName: string
  dayLabel: string
  timeRange: string
  subjects: string[]
}

export type TeacherAssignmentBoard = {
  pendingRequests: TeacherAssignmentRequest[]
  availableTeachers: AvailableTeacher[]
  suggestions: TeacherAssignmentSuggestion[]
  scheduleOverview: TeacherScheduleSlot[]
}
