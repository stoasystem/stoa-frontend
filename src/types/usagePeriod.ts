import type { UsagePeriodState } from '@/types/student'

/*
 * The usage period as a student or parent reads it (stoa-backend#343).
 *
 * `endsAt` is a Zurich calendar day, `YYYY-MM-DD`, the last day the period
 * can be used (through 23:59:59 Zurich time); null without a period.
 * `daysLeft` counts Zurich days after today: 7 a week before, 0 on the end
 * day (still `active`) and 0 once `expired`; null without a period. The
 * state and the student's own period are typed in `@/types/student` (#615).
 */

export type { UsagePeriodState }

/**
 * Who pays a child's period, as the parent reading it is told: the reader
 * (`you`), the child (`self`) or another parent of the child, never named
 * (`other_parent`); null without a period.
 */
export type ChildUsagePeriodPaidBy = 'you' | 'self' | 'other_parent' | null

export type ParentOwnUsagePeriod = {
  endsAt: string | null
  state: UsagePeriodState
  daysLeft: number | null
}

/** A child's period. It carries no `daysLeft`: the reader counts it from `endsAt`. */
export type ParentChildUsagePeriod = {
  studentId: string
  name: string
  endsAt: string | null
  state: UsagePeriodState
  paidBy: ChildUsagePeriodPaidBy
}

/** `GET /parents/me/usage-period`. */
export type ParentUsagePeriods = {
  own: ParentOwnUsagePeriod
  children: ParentChildUsagePeriod[]
  renewalContactEmail: string
}
