import { daysBetween } from '@/lib/zurichDay'
import type {
  ChildUsagePeriodPaidBy,
  ParentUsagePeriods,
  UsagePeriodState,
} from '@/types/usagePeriod'

/*
 * When a usage period is worth a banner (#616): from seven days before its
 * last day through that day, and once it is over. A period more than a week
 * away says nothing, and neither does an account without one: no period is
 * the state of an account STOA has not set up yet, not a reminder to renew.
 */

/** Days left at which the reminder starts: `daysLeft` 7 is a week before the last day. */
export const ENDS_SOON_DAYS = 7

export type PeriodNotice =
  | { kind: 'endsSoon'; endsAt: string; daysLeft: number }
  | { kind: 'expired'; endsAt: string | null }

type PeriodReading = {
  endsAt: string | null
  state: UsagePeriodState
  daysLeft: number | null
}

export function periodNotice(period: PeriodReading | null | undefined): PeriodNotice | null {
  if (!period) return null
  if (period.state === 'expired') return { kind: 'expired', endsAt: period.endsAt }
  if (period.state !== 'active' || !period.endsAt) return null
  const daysLeft = period.daysLeft
  if (daysLeft === null || !Number.isFinite(daysLeft) || daysLeft > ENDS_SOON_DAYS) return null
  return { kind: 'endsSoon', endsAt: period.endsAt, daysLeft: Math.max(0, daysLeft) }
}

/**
 * The days left of a child's period, which the parent read does not carry:
 * Zurich days from `today` to the last day, 0 on it and after it.
 */
export function childDaysLeft(
  child: { endsAt: string | null; state: UsagePeriodState },
  today: string,
): number | null {
  if (child.state === 'none' || !child.endsAt) return null
  const days = daysBetween(today, child.endsAt)
  return Number.isNaN(days) ? null : Math.max(0, days)
}

export type ParentNotice =
  | { account: 'own'; notice: PeriodNotice }
  | {
      account: 'child'
      studentId: string
      name: string
      paidBy: ChildUsagePeriodPaidBy
      notice: PeriodNotice
    }

/** The parent's own period first, then each child's, those that are worth a banner. */
export function parentNotices(data: ParentUsagePeriods | null | undefined, today: string): ParentNotice[] {
  if (!data) return []
  const notices: ParentNotice[] = []
  const own = periodNotice(data.own)
  if (own) notices.push({ account: 'own', notice: own })
  for (const child of data.children ?? []) {
    const notice = periodNotice({ ...child, daysLeft: childDaysLeft(child, today) })
    if (notice) {
      notices.push({
        account: 'child',
        studentId: child.studentId,
        name: child.name,
        paidBy: child.paidBy,
        notice,
      })
    }
  }
  return notices
}

/**
 * What a banner says, as one string: closing it hides that message for this
 * visit, and a different one (the week turns into expiry, another child's
 * period nears its end) shows again.
 */
export function noticeSignature(notices: readonly (PeriodNotice | ParentNotice)[]): string {
  return notices
    .map((entry) => {
      const notice = 'notice' in entry ? entry.notice : entry
      const who = 'account' in entry ? (entry.account === 'own' ? 'own' : `child:${entry.studentId}`) : 'self'
      return `${who}:${notice.kind}:${notice.endsAt ?? ''}`
    })
    .join('|')
}
