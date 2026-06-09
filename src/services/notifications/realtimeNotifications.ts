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
  mergeIntoList(queryClient, notificationQueryKeys.list(), event)

  if (user.role === 'admin' || event.recipientRole === 'admin') {
    mergeIntoList(queryClient, notificationQueryKeys.adminList(), event)
  }
}

function mergeIntoList(
  queryClient: QueryClient,
  queryKey: readonly string[],
  event: NotificationEvent,
) {
  queryClient.setQueryData<NotificationListResponse>(queryKey, (current) => {
    const items = current?.items ?? []
    const nextItems = [event, ...items.filter((item) => item.eventId !== event.eventId)]
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
  if (role === 'tutor') return ['role:tutor', 'role:teacher']
  if (role === 'school_teacher') return ['role:school_teacher', 'role:teacher']
  return [`role:${role}`]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
