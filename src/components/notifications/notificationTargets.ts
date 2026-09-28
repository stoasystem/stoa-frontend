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
 * Every path here must be a page the manifest opens to that role; the test
 * holds each one against the manifest's access.
 */
import { ASK_PATH, askPathFor, navAreaForRole, type AppNavArea } from '@/app/router/routeManifest'
import type { NotificationEvent } from '@/types/notification'
import type { UserRole } from '@/types/user'

type Target = Pick<NotificationEvent, 'targetType' | 'targetId'>
type Resolve = (targetId: string) => string

export const NOTIFICATION_TARGETS: Record<AppNavArea, Readonly<Record<string, Resolve>>> = {
  student: {
    conversation: (id) => askPathFor(id),
    question: () => ASK_PATH,
    // Reached only from here (#13 point 3).
    assignment: () => '/assignments',
    recommendation: () => '/assignments',
  },
  teacher: {
    // The request queue; a `question` id is not a help-request id.
    question: () => '/tutor',
  },
  parent: {
    weekly_report: () => '/parent/reports',
    report: () => '/parent/reports',
  },
  admin: {
    moderation_case: () => '/admin/moderation',
    account: () => '/admin/users',
    system_status: () => '/admin/system',
  },
  organization: {},
}

/** The page a notification opens for `role`, or null when it has none. */
export function notificationTargetPath(event: Target, role: UserRole): string | null {
  const has = (object: object, key: string) => Object.prototype.hasOwnProperty.call(object, key)
  const area = navAreaForRole(role)
  // The payload is the backend's and the role the store's: neither is trusted
  // to have the declared type. Anything off is no target, never a throw that
  // would take the bell down with it.
  if (!has(NOTIFICATION_TARGETS, area)) return null
  const targets = NOTIFICATION_TARGETS[area]
  const { targetType, targetId } = event as { targetType: unknown; targetId: unknown }
  // Own keys only: a `targetType` of "constructor" must not reach Object's.
  if (typeof targetType !== 'string' || !has(targets, targetType)) return null
  return targets[targetType](typeof targetId === 'string' ? targetId : '')
}
