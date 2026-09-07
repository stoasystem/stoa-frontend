import { activeLanguage } from '@/i18n/languages'

/**
 * Date and time formatting in the language the reader chose.
 *
 * These were `Intl.DateTimeFormat('en', ...)` literals spread across the
 * screens, so a student reading the app in German got German prose next to an
 * English timestamp. Every caller sits inside a component that subscribes to
 * i18n, so a language switch re-renders it and the format follows.
 */

/** "14:30" — the clock time of a chat message. */
export function formatTimeOfDay(value: string | number | Date) {
  return new Intl.DateTimeFormat(activeLanguage(), {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

/** "5 Mar" — a day without the year, for recent activity. */
export function formatDayAndMonth(value: string | number | Date) {
  return new Intl.DateTimeFormat(activeLanguage(), {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

/** "5 Mar, 14:30" — a day and the time on it. */
export function formatDayAndTime(value: string | number | Date) {
  return new Intl.DateTimeFormat(activeLanguage(), {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

/** The full date and time, as `toLocaleString()` did but in the app's language. */
export function formatDateTime(value: string | number | Date) {
  return new Intl.DateTimeFormat(activeLanguage(), {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

/** The date alone, as `toLocaleDateString()` did but in the app's language. */
export function formatDate(value: string | number | Date) {
  return new Intl.DateTimeFormat(activeLanguage(), { dateStyle: 'medium' }).format(new Date(value))
}
