/*
 * The student's usage period (stoa-backend#239), as the frontend reads it.
 *
 * Billing is offline: an admin sets each paying account's period, and a
 * parent's covers their children. Once it has ended -- or none was ever set --
 * a student can still read their history and practise, but cannot ask a new
 * question or ask a teacher; an answer already being written still finishes.
 *
 * `GET /students/me/entitlement` says where the period stands
 * (`usagePeriod.state`). A question or a request for a teacher sent just as
 * the period ends is refused `403 usage_period_ended` (stoa-backend#344), and
 * the period is then read again (`noteUsagePeriodEnded`).
 */
import type { StudentEntitlement } from '@/types/student'

/** The code a question or a request for a teacher is refused with once the period has ended. */
export const USAGE_PERIOD_ENDED = 'usage_period_ended'

/**
 * Whether asking is paused: the period has ended, or none was ever set (the
 * backend counts that as ended too). Not while the entitlement is unknown --
 * still loading, or not readable: the server refuses what it must, and Ask is
 * not switched off on a guess.
 */
export function usagePeriodPaused(entitlement: StudentEntitlement | null | undefined): boolean {
  const state = entitlement?.usagePeriod.state
  return state === 'expired' || state === 'none'
}

/** A refusal because the period has ended (`403 usage_period_ended`). */
export function isUsagePeriodEnded(error: unknown): boolean {
  const code = error && typeof error === 'object' && 'code' in error ? (error as { code?: unknown }).code : undefined
  return code === USAGE_PERIOD_ENDED
}
