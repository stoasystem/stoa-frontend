import type { TeacherAvailabilitySlot } from '@/types/teacherAvailability'

export const WEEKDAYS: TeacherAvailabilitySlot['dayOfWeek'][] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

/** A weekday's name in the reader's language. 2024-01-01 was a Monday. */
export function weekdayName(day: TeacherAvailabilitySlot['dayOfWeek'], language: string): string {
  const index = WEEKDAYS.indexOf(day)
  if (index < 0) return day
  return new Intl.DateTimeFormat(language, { weekday: 'long', timeZone: 'UTC' }).format(
    new Date(Date.UTC(2024, 0, 1 + index)),
  )
}
