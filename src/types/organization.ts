export type OrganizationType = 'family' | 'tutoring_center' | 'school' | 'internal'

export type Organization = {
  id: string
  name: string
  type: OrganizationType
  location?: string
  studentCount: number
  teacherCount: number
}

export type OrganizationMemberRole =
  | 'owner'
  | 'organization_admin'
  | 'school_teacher'
  | 'school_viewer'

export type OrganizationSummary = {
  activeStudents: number
  totalStudents: number
  totalTeachers: number
  questionsAskedThisWeek: number
  teacherHelpRequestsThisWeek: number
  parentReportViewsThisWeek: number
  weakTopics: {
    id: string
    subject: string
    topic: string
    affectedStudents: number
  }[]
  teacherWorkload: {
    teacherId: string
    name: string
    pendingRequests: number
    resolvedThisWeek: number
  }[]
}

export type OrganizationStudent = {
  id: string
  name: string
  grade: string
  primarySubjects: string[]
  lastActiveAt: string
  weakTopicCount: number
  teacherHelpCount: number
}

export type OrganizationTeacher = {
  id: string
  name: string
  subjects: string[]
  availability: string
  pendingRequests: number
  resolvedRequests: number
  averageResponseTimeMinutes?: number
}

export type OrganizationReportOverview = {
  weeklyReportsSent: number
  monthlyReportsReady: number
  parentViewsThisWeek: number
  reportHighlights: string[]
}
