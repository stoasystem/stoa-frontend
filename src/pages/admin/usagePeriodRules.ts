import type {
  UsagePeriodSource,
  UsagePeriodState,
  UsagePeriodUnit,
} from '@/services/admin/usagePeriodApi'
import { formatDay, isDay, parseDay } from '@/lib/zurichDay'

/*
 * The backend's period rules (stoa-backend `services/usage_period.py`), here
 * so the console can say what a write will do before it is sent. The server
 * computes the stored date itself; these only preview it.
 *
 * Every date is a Zurich calendar day, `YYYY-MM-DD` (`@/lib/zurichDay`).
 */

export { daysBetween, isDay, zurichToday } from '@/lib/zurichDay'

/** `months` calendar months after `start`, landing on the month's last day when shorter. */
export function addMonths(start: string, months: number): string {
  const from = parseDay(start)
  if (!from) throw new RangeError(`not a day: ${start}`)
  const index = from.getUTCMonth() + months
  const year = from.getUTCFullYear() + Math.floor(index / 12)
  const month = ((index % 12) + 12) % 12
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  return formatDay(new Date(Date.UTC(year, month, Math.min(from.getUTCDate(), lastDay))))
}

export function addDays(start: string, days: number): string {
  const from = parseDay(start)
  if (!from) throw new RangeError(`not a day: ${start}`)
  return formatDay(new Date(from.getTime() + days * 86_400_000))
}

/** Where an extension ends: counted from today or the current end, whichever is later. */
export function extendedEnd(
  current: string | null,
  today: string,
  unit: UsagePeriodUnit,
  amount: number,
): string {
  const start = current !== null && current > today ? current : today
  return unit === 'months' ? addMonths(start, amount) : addDays(start, amount)
}

/** `none` without an end date; `active` through the end date itself; `expired` after. */
export function stateOn(endsOn: string | null | undefined, today: string): UsagePeriodState {
  if (!endsOn) return 'none'
  return today <= endsOn ? 'active' : 'expired'
}

/** The backend accepts 1-366 of either unit. */
export const MAX_EXTENSION_AMOUNT = 366
export const PAYMENT_REFERENCE_MAX_LENGTH = 200
export const NOTE_MAX_LENGTH = 1000

export type ExtensionDraft = {
  unit: UsagePeriodUnit
  amount: string
  source: UsagePeriodSource
  paymentReference: string
  note: string
}

export type ExtensionIssue = 'amount' | 'paidInMonths' | 'paymentReference' | 'paymentReferenceTooLong' | 'noteTooLong'

/** The whole number the amount field holds, or null. */
export function extensionAmount(draft: ExtensionDraft): number | null {
  const text = draft.amount.trim()
  if (!/^\d+$/.test(text)) return null
  const amount = Number(text)
  return amount >= 1 && amount <= MAX_EXTENSION_AMOUNT ? amount : null
}

/**
 * What stops the extension from being sent. The rules the user approved: a
 * paid extension is whole months and names its offline payment; a gift may be
 * days or months and names none.
 */
export function extensionIssues(draft: ExtensionDraft): ExtensionIssue[] {
  const issues: ExtensionIssue[] = []
  if (extensionAmount(draft) === null) issues.push('amount')
  if (draft.source === 'paid') {
    if (draft.unit !== 'months') issues.push('paidInMonths')
    if (!draft.paymentReference.trim()) issues.push('paymentReference')
    else if (draft.paymentReference.trim().length > PAYMENT_REFERENCE_MAX_LENGTH) issues.push('paymentReferenceTooLong')
  }
  if (draft.note.trim().length > NOTE_MAX_LENGTH) issues.push('noteTooLong')
  return issues
}

export type EndChangeIssue = 'date' | 'reason' | 'reasonTooLong' | 'unchanged'

export function endChangeIssues(draft: { endsOn: string; reason: string }, current: string | null): EndChangeIssue[] {
  const issues: EndChangeIssue[] = []
  if (!isDay(draft.endsOn)) issues.push('date')
  else if (draft.endsOn === current) issues.push('unchanged')
  if (!draft.reason.trim()) issues.push('reason')
  else if (draft.reason.trim().length > NOTE_MAX_LENGTH) issues.push('reasonTooLong')
  return issues
}

/**
 * What a changed end date does, said before it is confirmed:
 * `endsNow` - the new day is already past, so the period is over at once;
 * `shortens` - it ends earlier than it would have, but not yet;
 * `none` - a later day, or a first one.
 */
export function endChangeEffect(
  current: string | null,
  next: string,
  today: string,
): 'endsNow' | 'shortens' | 'none' {
  if (next < today) return 'endsNow'
  if (current !== null && next < current) return 'shortens'
  return 'none'
}
