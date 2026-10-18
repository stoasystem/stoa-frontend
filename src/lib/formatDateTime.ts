import { activeLanguage } from '@/i18n/languages'

/**
 * Date and time formatting in the language the reader chose.
 *
 * These were `Intl.DateTimeFormat('en', ...)` literals spread across the
 * screens, so a student reading the app in German got German prose next to an
 * English timestamp. Every caller sits inside a component that subscribes to
 * i18n, so a language switch re-renders it and the format follows.
 *
 * A value that is not a date - a missing field, a malformed string from the
 * API - is shown as a dash. `Intl` throws a RangeError on it, and that error
 * used to take the whole page down with it (#272).
 */

/** What an unreadable date is shown as. */
export const INVALID_DATE_PLACEHOLDER = '—'

function format(value: string | number | Date, options: Intl.DateTimeFormatOptions) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return INVALID_DATE_PLACEHOLDER
  return new Intl.DateTimeFormat(activeLanguage(), options).format(date)
}

/** "14:30" — the clock time of a chat message. */
export function formatTimeOfDay(value: string | number | Date) {
  return format(value, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

/** "5 Mar" — a day without the year, for recent activity. */
export function formatDayAndMonth(value: string | number | Date) {
  return format(value, {
    month: 'short',
    day: 'numeric',
  })
}

/** "5 Mar, 14:30" — a day and the time on it. */
export function formatDayAndTime(value: string | number | Date) {
  return format(value, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** The full date and time, as `toLocaleString()` did but in the app's language. */
export function formatDateTime(value: string | number | Date) {
  return format(value, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

/** The date alone, as `toLocaleDateString()` did but in the app's language. */
export function formatDate(value: string | number | Date) {
  return format(value, { dateStyle: 'medium' })
}
