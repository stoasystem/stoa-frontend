import { apiPath } from '@/services/api/apiPath'
import { httpClient } from '@/services/api/httpClient'

/*
 * An account's usage period (stoa-backend#239, #342): the last Zurich day a
 * student, or a parent paying for their children, may use the platform. Paid
 * offline; an administrator sets and extends it here, and every set or
 * extension leaves a record. Only students and parents have one: any other
 * role is refused with `usage_period_role_invalid`.
 *
 * The backend's OpenAPI types the two request bodies
 * (`UsagePeriodExtensionRequest`, `UsagePeriodSetRequest`); its responses are
 * open objects there, so the shapes below follow what `routers/admin.py`
 * returns.
 */

/** `none` without an end date; `active` through the end date itself; `expired` after. */
export type UsagePeriodState = 'active' | 'expired' | 'none'
export type UsagePeriodUnit = 'months' | 'days'
export type UsagePeriodSource = 'paid' | 'gifted'
export type UsagePeriodRecordKind = 'extend' | 'set'

export type UsagePeriodRecord = {
  recordId: string
  /** UTC ISO timestamp with microseconds. */
  recordedAt: string
  actorId: string
  kind: UsagePeriodRecordKind
  /** Only on an extension. */
  unit: UsagePeriodUnit | null
  amount: number | null
  previousEndsOn: string | null
  newEndsOn: string
  /** Only on an extension. */
  source: UsagePeriodSource | null
  paymentReference: string | null
  /** An extension's note. */
  note: string | null
  /** A changed end date's reason. */
  reason: string | null
  subscriptionTier: string | null
}

/** A student's period in force: their own or a current parent's, whichever ends later. */
export type EffectiveUsagePeriod = {
  endsOn: string | null
  state: UsagePeriodState
  paidBy: 'self' | 'parent' | null
  parentId: string | null
}

export type UsagePeriodAccount = {
  userId: string
  role: string
  /** Zurich day `YYYY-MM-DD`; the period ends at 23:59:59 that day. */
  endsOn: string | null
  state: UsagePeriodState
  /** The profile's version; 0 for a profile that never had one. Every write sends it back. */
  version: number
}

export type UsagePeriodRead = UsagePeriodAccount & {
  /** A student's period in force; null for a parent. */
  effective: EffectiveUsagePeriod | null
  /** Newest first. */
  records: UsagePeriodRecord[]
  nextPageToken: string | null
}

export type UsagePeriodChange = UsagePeriodAccount & { record: UsagePeriodRecord }

export type EndingChild = { userId: string; accountNumber: string; name: string }

export type EndingUsagePeriod = {
  userId: string
  accountNumber: string
  name: string
  role: string
  endsOn: string
  state: UsagePeriodState
  /** A parent's current children, whom the period also covers. */
  children: EndingChild[]
}

export type EndingUsagePeriods = {
  items: EndingUsagePeriod[]
  count: number
  endingWithinDays: number
}

export const USAGE_PERIOD_RECORDS_PAGE = 20

export async function readUsagePeriod(
  userId: string,
  options: { pageToken?: string; limit?: number; signal?: AbortSignal } = {},
) {
  const response = await httpClient.get<UsagePeriodRead>(apiPath`/admin/users/${userId}/usage-period`, {
    params: { limit: options.limit ?? USAGE_PERIOD_RECORDS_PAGE, pageToken: options.pageToken || undefined },
    signal: options.signal,
  })
  return response.data
}

export type UsagePeriodExtension = {
  userId: string
  unit: UsagePeriodUnit
  amount: number
  source: UsagePeriodSource
  /** Required when paid: the bank transfer's reference or the receipt number. */
  paymentReference?: string
  note?: string
  expectedVersion: number
}

export async function extendUsagePeriod(input: UsagePeriodExtension) {
  const response = await httpClient.post<UsagePeriodChange>(
    apiPath`/admin/users/${input.userId}/usage-period/extensions`,
    {
      unit: input.unit,
      amount: input.amount,
      source: input.source,
      // The route refuses fields it does not know, and a gift names no payment.
      paymentReference: input.source === 'paid' ? input.paymentReference : undefined,
      note: input.note || undefined,
      expectedVersion: input.expectedVersion,
    },
  )
  return response.data
}

export type UsagePeriodEndChange = {
  userId: string
  endsOn: string
  reason: string
  expectedVersion: number
}

export async function setUsagePeriodEnd(input: UsagePeriodEndChange) {
  const response = await httpClient.put<UsagePeriodChange>(apiPath`/admin/users/${input.userId}/usage-period`, {
    endsOn: input.endsOn,
    reason: input.reason,
    expectedVersion: input.expectedVersion,
  })
  return response.data
}

export const ENDING_WITHIN_DAYS = 14

/** Students and parents whose period ends within `endingWithinDays`, or ended in the last 30. */
export async function listEndingUsagePeriods(endingWithinDays = ENDING_WITHIN_DAYS, signal?: AbortSignal) {
  const response = await httpClient.get<EndingUsagePeriods>('/admin/usage-periods', {
    params: { endingWithinDays },
    signal,
  })
  return response.data
}
