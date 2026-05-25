export type OrganizationType = 'family' | 'tutoring_center' | 'school' | 'internal'

export type Organization = {
  id: string
  name: string
  type: OrganizationType
  location?: string
  studentCount: number
  tutorCount: number
}

export type OrganizationMemberRole =
  | 'owner'
  | 'organization_admin'
  | 'school_teacher'
  | 'school_viewer'

export type OrganizationSummary = {
  activeStudents: number
  totalStudents: number
  totalTutors: number
  questionsAskedThisWeek: number
  teacherHelpRequestsThisWeek: number
  parentReportViewsThisWeek: number
  weakTopics: {
    id: string
    subject: string
    topic: string
    affectedStudents: number
  }[]
  tutorWorkload: {
    tutorId: string
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

export type OrganizationTutor = {
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
