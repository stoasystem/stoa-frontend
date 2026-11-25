import { apiPath } from '@/services/api/apiPath'
import { httpClient } from '@/services/api/httpClient'

/** Feature keys in the order the overview shows them (card 134); `other` has no card. */
export const SYSTEM_FEATURES = [
  'auth',
  'practice',
  'ask_ai',
  'teacher_help',
  'voice',
  'notifications',
  'parent_reports',
  'admin',
] as const

export type SystemFeatureKey = (typeof SYSTEM_FEATURES)[number] | 'other'

export const SYSTEM_WINDOWS = ['1h', '24h', '7d'] as const
export type SystemWindow = (typeof SYSTEM_WINDOWS)[number]
export const DEFAULT_SYSTEM_WINDOW: SystemWindow = '24h'

export type FeatureStatus = 'ok' | 'warn' | 'bad' | 'unknown'
export type AlarmState = 'ALARM' | 'OK' | 'INSUFFICIENT_DATA'

export function isSystemFeature(value: string | undefined): value is SystemFeatureKey {
  return value === 'other' || (SYSTEM_FEATURES as readonly string[]).includes(value ?? '')
}

export function isSystemWindow(value: string | null | undefined): value is SystemWindow {
  return (SYSTEM_WINDOWS as readonly string[]).includes(value ?? '')
}

export type SparkPoint = { t: string; requests: number | null; p95Ms: number | null }

export type FeatureProbe = { ok: boolean | null; lastRunAt: string | null; latencyMs: number | null }

export type FeatureHealth = {
  key: string
  status: FeatureStatus
  requests: number | null
  errorRate: number | null
  /** Not in the card 134 contract yet; the detail page shows a dash without it. */
  p50Ms?: number | null
  p95Ms: number | null
  p95LimitMs: number | null
  spark: SparkPoint[] | null
  probe: FeatureProbe | null
  openAlarms: number | null
}

export type SystemAlarm = {
  name: string
  feature: string | null
  state: AlarmState
  since: string | null
  reason: string | null
}

export type SystemHealthResponse = {
  generatedAt: string
  window: SystemWindow
  features: FeatureHealth[]
  alarms: SystemAlarm[] | null
  deploys: { at: string; release: string }[] | null
  frontendErrors: { total: number | null } | null
}

export type FeatureSeriesPoint = {
  t: string
  requests: number | null
  errors: number | null
  p50Ms: number | null
  p95Ms: number | null
}

export type FeatureRoute = {
  method: string
  route: string
  requests: number | null
  errorRate: number | null
  p50Ms: number | null
  p95Ms: number | null
}

export type FeatureRecentError = { at: string; method: string; route: string; status: number; count: number }

export type FeatureFrontendError = {
  messageHash: string
  message: string | null
  route: string | null
  release: string | null
  count: number
  lastAt: string | null
}

export type FeatureProbeRun = { at: string; ok: boolean; latencyMs: number | null; step: string | null }

export type SystemFeatureResponse = {
  generatedAt: string
  window: SystemWindow
  feature: FeatureHealth
  series: FeatureSeriesPoint[] | null
  routes: FeatureRoute[] | null
  recentErrors: FeatureRecentError[] | null
  frontendErrors: FeatureFrontendError[] | null
  probes: FeatureProbeRun[] | null
  alarms: SystemAlarm[] | null
  usage: { event: string; count: number }[] | null
}

export async function getSystemHealth(window: SystemWindow, signal?: AbortSignal) {
  const response = await httpClient.get<SystemHealthResponse>('/admin/system/health', { params: { window }, signal })
  return response.data
}

export async function getSystemFeature(feature: SystemFeatureKey, window: SystemWindow, signal?: AbortSignal) {
  const response = await httpClient.get<SystemFeatureResponse>(apiPath`/admin/system/features/${feature}`, {
    params: { window },
    signal,
  })
  return response.data
}
