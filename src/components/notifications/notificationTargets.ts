/**
 * Where a notification leads (#13 point 5, #46): every item in the bell can
 * be clicked, and one with a target opens it.
 *
 * The backend names the target as `targetType` + `targetId`. A conversation
 * (stoasystem/stoa-backend#65) opens that Ask conversation. Until then a
 * student's teacher notifications point at a `question` of the old question
 * path, which has no page of its own any more, so they open Ask, where teacher
 * replies now live. Anything with no page for this role (a frozen billing
 * request, a report the role cannot open) has no target: clicking it only
 * marks it read.
 *
 * Where one event means something else by the same target type, it has its
 * own entry in NOTIFICATION_EVENT_TARGETS, looked up first. Only an event the
 * payload names reaches those: a `targetType` alone never does.
 *
 * Every path here must be a page the manifest opens to that role; the test
 * holds each one against the manifest's access.
 */
import {
  ASK_PATH,
  askPathFor,
  moderationPathFor,
  navAreaForRole,
  teacherRequestPathFor,
  type AppNavArea,
} from '@/app/router/routeManifest'
import type { NotificationEvent } from '@/types/notification'
import type { UserRole } from '@/types/user'

type Target = Pick<NotificationEvent, 'targetType' | 'targetId'> & Partial<Pick<NotificationEvent, 'eventType'>>
type Resolve = (targetId: string) => string

export const NOTIFICATION_TARGETS: Record<AppNavArea, Readonly<Record<string, Resolve>>> = {
  student: {
    conversation: (id) => askPathFor(id),
    question: () => ASK_PATH,
    // The avatar menu leads there too (#400): the backend sends no
    // `assignment` notification today.
    assignment: () => '/assignments',
    recommendation: () => '/assignments',
  },
  teacher: {
    // The request queue; a `question` id is not a help-request id.
    question: () => '/teacher',
  },
  parent: {
    weekly_report: () => '/parent/reports',
    report: () => '/parent/reports',
  },
  admin: {
    // That case, opened, though it is beyond the 50 the queue lists (#411).
    moderation_case: (id) => moderationPathFor(id),
    account: () => '/admin/users',
    system_status: () => '/admin/system',
  },
  organization: {},
}

/** By role area, then event type, then target type. */
export const NOTIFICATION_EVENT_TARGETS: Partial<
  Record<AppNavArea, Readonly<Record<string, Readonly<Record<string, Resolve>>>>>
> = {
  teacher: {
    // A help request offered to this teacher names the request itself
    // (stoa-backend#141).
    teacher_help_dispatched: { question: (id) => teacherRequestPathFor(id) },
  },
}

/** The page a notification opens for `role`, or null when it has none. */
export function notificationTargetPath(event: Target, role: UserRole): string | null {
  const has = (object: object, key: string) => Object.prototype.hasOwnProperty.call(object, key)
  const area = navAreaForRole(role)
  // The payload is the backend's and the role the store's: neither is trusted
  // to have the declared type. Anything off is no target, never a throw that
  // would take the bell down with it.
  if (!has(NOTIFICATION_TARGETS, area)) return null
  const { eventType, targetType, targetId } = event as { eventType?: unknown; targetType: unknown; targetId: unknown }
  if (typeof targetType !== 'string') return null
  const id = typeof targetId === 'string' ? targetId : ''
  // Own keys only: a `targetType` of "constructor" must not reach Object's.
  const byEvent = has(NOTIFICATION_EVENT_TARGETS, area) ? NOTIFICATION_EVENT_TARGETS[area]! : {}
  if (typeof eventType === 'string' && has(byEvent, eventType) && has(byEvent[eventType], targetType)) {
    return byEvent[eventType][targetType](id)
  }
  const targets = NOTIFICATION_TARGETS[area]
  if (!has(targets, targetType)) return null
  return targets[targetType](id)
}
