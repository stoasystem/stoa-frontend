/*
 * The review reminder on the star map (#593): a small Murmi in a corner that
 * whistles (`calling`) while reviews are due, sleeps while reviews are
 * scheduled but none is due yet, and is not there at all for a student with
 * nothing scheduled. What it reads is `GET /practice/review/summary`; where a
 * tap takes the student is the star with the most cards due, read from the sky.
 *
 * Two conveniences are kept in this browser, per account and per local
 * calendar day: that `calling` has played its animation today, and that the
 * student waved it away today ("got it"). Storage refused, both are simply
 * forgotten: Murmi animates again, or comes back.
 */
import type { Star, StarMap } from '@/features/starmap/model/starMap'
import type { ReviewSummary } from '@/types/practice'

export type ReminderMood = 'calling' | 'sleeping'

/** What the summary says Murmi does: whistle, sleep, or not be there (nothing scheduled). */
export function reminderMood(summary: Pick<ReviewSummary, 'dueCount' | 'scheduledCount'> | undefined): ReminderMood | null {
  if (!summary) return null
  if (summary.dueCount > 0) return 'calling'
  if (summary.scheduledCount > 0) return 'sleeping'
  return null
}

/** The star with the most cards due, the first in the sky's order on a tie; null if none is due. */
export function mostDueStar(map: Pick<StarMap, 'stars'>): Star | null {
  let best: Star | null = null
  for (const star of map.stars) if (star.reviewDue > 0 && (!best || star.reviewDue > best.reviewDue)) best = star
  return best
}

/** The student's local calendar day, `YYYY-MM-DD`. */
export function localDay(at: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`
}

/** Local calendar days from `from` to `to` (0: the same day), whatever the clock says within them. */
export function daysBetween(from: Date, to: Date): number {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate())
  return Math.round((end.getTime() - start.getTime()) / 86_400_000)
}

/**
 * When the next review is, in words to fill in: today (or already past),
 * tomorrow, a weekday within the week, or a date further off; `unknown` when
 * `nextDueAt` is not a date.
 */
export type NextReview = { kind: 'today' } | { kind: 'tomorrow' } | { kind: 'weekday' | 'date'; when: string } | { kind: 'unknown' }

export function nextReview(nextDueAt: string | undefined, now: Date, locale: string): NextReview {
  const at = nextDueAt ? new Date(nextDueAt) : null
  if (!at || Number.isNaN(at.getTime())) return { kind: 'unknown' }
  const days = daysBetween(now, at)
  if (days <= 0) return { kind: 'today' }
  if (days === 1) return { kind: 'tomorrow' }
  if (days < 7) return { kind: 'weekday', when: new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(at) }
  return { kind: 'date', when: new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' }).format(at) }
}

const SEEN_KEY = 'stoa.starmap.reviewReminder.called'
const WAVED_KEY = 'stoa.starmap.reviewReminder.waved'

export const reminderKeys = (ownerId: string) => ({ seen: `${SEEN_KEY}.${ownerId}`, waved: `${WAVED_KEY}.${ownerId}` })

export function readDay(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeDay(key: string, day: string) {
  try {
    localStorage.setItem(key, day)
  } catch {
    // Storage refused: Murmi simply animates again, or comes back, next time.
  }
}
