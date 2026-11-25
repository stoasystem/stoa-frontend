import type { TFunction } from 'i18next'
import { formatDayAndMonth, formatDayAndTime, formatTimeOfDay } from '@/lib/formatDateTime'
import { formattingLocale } from '@/i18n/languages'
import { isSystemWindow, type SystemAlarm, type SystemWindow } from '@/services/admin/systemHealthApi'

export const NO_VALUE = '—'

export function systemFeaturePath(feature: string, window?: SystemWindow) {
  const path = `/admin/system/${encodeURIComponent(feature)}`
  return window ? `${path}?window=${window}` : path
}

export function readWindow(value: string | null): SystemWindow | null {
  return isSystemWindow(value) ? value : null
}

export function formatCount(value: number | null | undefined) {
  if (value === null || value === undefined) return NO_VALUE
  return new Intl.NumberFormat(formattingLocale()).format(value)
}

export function formatRate(value: number | null | undefined) {
  if (value === null || value === undefined) return NO_VALUE
  return new Intl.NumberFormat(formattingLocale(), { style: 'percent', maximumFractionDigits: 2 }).format(value)
}

export function formatMs(t: TFunction, value: number | null | undefined) {
  if (value === null || value === undefined) return NO_VALUE
  return t('systemHealth.ms', { value: formatCount(Math.round(value)) })
}

/** Axis and table times: clock time inside a day, the date over a week. */
export function formatBucket(window: SystemWindow, value: string) {
  return window === '7d' ? formatDayAndMonth(value) : formatTimeOfDay(value)
}

export function formatWhen(value: string | null | undefined) {
  return value ? formatDayAndTime(value) : NO_VALUE
}

export function featureName(t: TFunction, key: string | null | undefined) {
  if (!key) return t('systemHealth.features.other')
  return t(`systemHealth.features.${key}`, { defaultValue: key })
}

const ALARM_NAME = /^stoa-feature-([a-z_]+)-(error-rate|latency)$/

const KNOWN_ALARMS: Record<string, string> = {
  'stoa-api-error-rate': 'apiErrorRate',
  'stoa-api-p99-latency': 'apiLatency',
  'stoa-owner-registry-sweep-findings': 'ownerRegistrySweep',
  'stoa-conversation-needs-reconciliation-settled': 'conversationReconciliation',
  'stoa-teacher-help-waiting-no-teacher': 'teacherHelpNoTeacher',
  'stoa-voice-transcription-refused': 'voiceRefused',
}

const DLQ_ALARM = /^stoa-(.+)-dlq-messages$/
const JOB_ALARM = /^stoa-(.+)-errors$/

/** Known alarm names read as words; others fall back to their description, then their name. */
export function alarmTitle(t: TFunction, alarm: SystemAlarm) {
  const match = ALARM_NAME.exec(alarm.name)
  if (match) {
    const kind = match[2] === 'latency' ? 'latency' : 'errorRate'
    return t(`systemHealth.alarms.${kind}`, { feature: featureName(t, alarm.feature ?? match[1]) })
  }
  const known = KNOWN_ALARMS[alarm.name]
  if (known) return t(`systemHealth.alarms.known.${known}`)
  const dlq = DLQ_ALARM.exec(alarm.name)
  if (dlq) return t('systemHealth.alarms.known.deadLetters', { name: dlq[1] })
  const job = JOB_ALARM.exec(alarm.name)
  if (job) return t('systemHealth.alarms.known.jobFailed', { name: job[1] })
  return alarm.description?.trim() || alarm.name
}
