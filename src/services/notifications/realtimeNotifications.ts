import type { QueryClient } from '@tanstack/react-query'
import type {
  NotificationEvent,
  NotificationEventType,
  NotificationListResponse,
  RealtimeNotificationEnvelope,
} from '@/types/notification'
import type { User } from '@/types/user'
import { notificationQueryKeys } from './notificationQueryKeys'

type WrappedRealtimeMessage = {
  type?: string
  event?: RealtimeNotificationEnvelope
  notification?: RealtimeNotificationEnvelope
}

export function buildRealtimeNotificationUrl(baseUrl: string, token: string, user: User) {
  const url = new URL(baseUrl)
  url.searchParams.set('token', token)
  url.searchParams.set('userId', user.id)
  url.searchParams.set('role', user.role)
  return url.toString()
}

export function realtimeSubscriptionMessage(user: User) {
  return JSON.stringify({
    type: 'subscribe',
    channels: [`user:${user.id}`, ...roleChannels(user.role)],
  })
}

export function heartbeatMessage() {
  return JSON.stringify({ type: 'heartbeat' })
}

export function parseRealtimeNotificationMessage(data: string): NotificationEvent | null {
  let raw: unknown
  try {
    raw = JSON.parse(data)
  } catch {
    return null
  }

  const envelope = extractEnvelope(raw)
  if (!envelope?.eventId || !envelope.eventType || !envelope.title || !envelope.summary) {
    return null
  }

  return {
    eventId: envelope.eventId,
    recipientId: envelope.recipientId ?? null,
    recipientRole: envelope.recipientRole ?? 'user',
    eventType: envelope.eventType as NotificationEventType,
    targetType: envelope.targetType ?? 'notification',
    targetId: envelope.targetId ?? envelope.eventId,
    title: envelope.title,
    summary: envelope.summary,
    status: 'created',
    createdAt: envelope.createdAt ?? new Date().toISOString(),
    readAt: null,
    archivedAt: null,
    metadata: envelope.metadata ?? {},
    deliveryId: envelope.deliveryId ?? null,
    deliveryAttempt: envelope.deliveryAttempt ?? null,
  }
}

export function mergeRealtimeNotification(
  queryClient: QueryClient,
  event: NotificationEvent,
  user: User,
) {
  const listed = queryClient
    .getQueryData<NotificationListResponse>(notificationQueryKeys.list())
    ?.items.some((item) => item.eventId === event.eventId)
  mergeIntoList(queryClient, notificationQueryKeys.list(), event)
  if (!listed && event.status === 'created') countOneMoreUnread(queryClient)

  if (user.role === 'admin' || event.recipientRole === 'admin') {
    mergeIntoList(queryClient, notificationQueryKeys.adminList(), event)
  }
}

/*
 * The bell's count where it is read on its own (a full list, #387): polling
 * stops while realtime is live, so without this a new unread event showed in
 * the list and the count stayed where it was. A count not read yet, or already
 * due for a refetch, is left to that read. The +1 keeps the count's age, so it
 * does not pass for a fresh read of the backend.
 */
function countOneMoreUnread(queryClient: QueryClient) {
  const queryKey = notificationQueryKeys.unreadCount()
  const state = queryClient.getQueryState<number>(queryKey)
  if (state?.data === undefined || state.isInvalidated) return
  queryClient.setQueryData<number>(queryKey, state.data + 1, { updatedAt: state.dataUpdatedAt })
}

function mergeIntoList(
  queryClient: QueryClient,
  queryKey: readonly string[],
  event: NotificationEvent,
) {
  queryClient.setQueryData<NotificationListResponse>(queryKey, (current) => {
    const items = current?.items ?? []
    const known = items.find((item) => item.eventId === event.eventId)
    // A redelivery (deliveryAttempt > 1) of an item already here is not news:
    // it keeps the reader's state and its place, so a read item does not turn
    // unread again (#273).
    if (known) {
      const merged: NotificationEvent = {
        ...event,
        status: known.status,
        readAt: known.readAt ?? null,
        archivedAt: known.archivedAt ?? null,
      }
      return { items: items.map((item) => (item === known ? merged : item)), count: items.length }
    }
    const nextItems = [event, ...items]
    return { items: nextItems, count: nextItems.length }
  })
}

function extractEnvelope(raw: unknown): RealtimeNotificationEnvelope | null {
  if (!isRecord(raw)) return null

  const wrapped = raw as WrappedRealtimeMessage
  if (isRecord(wrapped.event)) return wrapped.event
  if (isRecord(wrapped.notification)) return wrapped.notification
  if (wrapped.type === 'heartbeat' || wrapped.type === 'ack') return null
  return raw as RealtimeNotificationEnvelope
}

function roleChannels(role: User['role']) {
  if (role === 'school_teacher') return ['role:school_teacher', 'role:teacher']
  return [`role:${role}`]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
