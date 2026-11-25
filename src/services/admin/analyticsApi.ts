import { httpClient } from '@/services/api/httpClient'

export const ANALYTICS_DAYS = [7, 30, 90] as const
export type AnalyticsDays = (typeof ANALYTICS_DAYS)[number]

export const ANALYTICS_ROLES = ['all', 'student', 'parent', 'teacher'] as const
export type AnalyticsRole = (typeof ANALYTICS_ROLES)[number]

export const FUNNEL_STEPS = ['invited', 'activated', 'first_question', 'first_exercise', 'week2_active'] as const

export type AnalyticsKpis = {
  dau: number | null
  wau: number | null
  mau: number | null
  dauChange: number | null
  questionsPerDay: number | null
  escalationRate: number | null
  aiP50Ms: number | null
  teacherResponseP50Ms: number | null
}

export type AnalyticsOverview = {
  generatedAt: string
  days: AnalyticsDays
  role: AnalyticsRole
  complete: boolean
  kpis: AnalyticsKpis
  activeSeries: { day: string; active: number }[]
  featureRanking: { event: string; count: number; uniqueUsers: number }[]
  funnel: { step: string; count: number }[]
  retention: { cohortWeek: string; size: number; weeks: (number | null)[] }[]
}

/** GET /admin/analytics/overview (card 134). */
export async function getAnalyticsOverview(days: AnalyticsDays, role: AnalyticsRole, signal?: AbortSignal) {
  const response = await httpClient.get<AnalyticsOverview>('/admin/analytics/overview', {
    params: { days, role },
    signal,
  })
  return response.data
}
