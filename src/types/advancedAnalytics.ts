export type AdvancedAnalyticsOverview = {
  weeklyActiveStudents: number
  weeklyActiveParents: number
  questionsBySubject: {
    subject: string
    count: number
  }[]
  teacherHelpRequestRate: number
  fileUploadRate: number
  parentReportViewRate: number
  conversionFunnel: {
    label: string
    count: number
  }[]
  retentionCohorts: {
    cohort: string
    week1: number
    week4: number
    week8: number
  }[]
  churnRiskStudents: {
    id: string
    name: string
    riskReason: string
    suggestedAction: string
  }[]
}

export type RetentionOverview = {
  inactiveStudents: {
    id: string
    name: string
    lastActiveAt: string
    riskReason: string
    suggestedAction: string
  }[]
  atRiskFamilies: {
    id: string
    familyName: string
    riskReason: string
    suggestedAction: string
  }[]
}
