import type { TFunction } from 'i18next'

export const MISSING = '—'

export function formatCount(value: number | null | undefined, locale: string) {
  if (value === null || value === undefined || !Number.isFinite(value)) return MISSING
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value)
}

export function formatPercent(ratio: number | null | undefined, locale: string, signed = false) {
  if (ratio === null || ratio === undefined || !Number.isFinite(ratio)) return MISSING
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits: 0,
    signDisplay: signed ? 'exceptZero' : 'auto',
  }).format(ratio)
}

export function formatDuration(ms: number | null | undefined, t: TFunction, locale: string) {
  if (ms === null || ms === undefined || !Number.isFinite(ms)) return MISSING
  const number = (value: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value)
  if (ms < 1000) return t('usageAnalytics.units.ms', { value: number(Math.round(ms)) })
  if (ms < 60_000) return t('usageAnalytics.units.seconds', { value: number(ms / 1000) })
  if (ms < 3_600_000) return t('usageAnalytics.units.minutes', { value: number(ms / 60_000) })
  return t('usageAnalytics.units.hours', { value: number(ms / 3_600_000) })
}

export function formatDay(day: string, locale: string) {
  const date = new Date(`${day}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return day
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(date)
}

/** Event names shown as words; an unknown name is shown as it came. */
export function eventLabel(event: string, t: TFunction) {
  return t(`usageAnalytics.events.${event}`, { defaultValue: event })
}
