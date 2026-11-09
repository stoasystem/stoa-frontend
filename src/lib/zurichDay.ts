/*
 * Zurich calendar days, `YYYY-MM-DD`: the unit a usage period is kept in
 * (stoa-backend `services/usage_period.py`). A period's `endsAt` is the last
 * day it can be used, through 23:59:59 Zurich time.
 *
 * The arithmetic runs on UTC dates, which have no clock changes, so a day is
 * always a day. A day is never read as an instant: `new Date('2026-11-14')`
 * is UTC midnight, the day before west of UTC.
 */

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/
const MS_PER_DAY = 86_400_000

/** The day as a UTC midnight, or null for anything that is not a real day. */
export function parseDay(day: string): Date | null {
  const match = DAY.exec(day)
  if (!match) return null
  const [year, month, date] = match.slice(1).map(Number)
  const value = new Date(Date.UTC(year, month - 1, date))
  return value.getUTCMonth() === month - 1 && value.getUTCDate() === date ? value : null
}

export function formatDay(value: Date): string {
  return value.toISOString().slice(0, 10)
}

export function isDay(value: string): boolean {
  return parseDay(value) !== null
}

/** The calendar day it is in Zurich at `now`. */
export function zurichToday(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Zurich',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

/** Whole days from `from` to `to`; negative when `to` is earlier, NaN when either is not a day. */
export function daysBetween(from: string, to: string): number {
  const a = parseDay(from)
  const b = parseDay(to)
  if (!a || !b) return Number.NaN
  return Math.round((b.getTime() - a.getTime()) / MS_PER_DAY)
}
