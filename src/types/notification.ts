export type NotificationStatus = 'created' | 'read' | 'archived' | 'failed'

export type NotificationEventType =
  | 'teacher_requested'
  | 'teacher_takeover'
  | 'teacher_reply'
  | 'moderation_case_update'
  | 'subscription_request_update'
  | 'learning_profile_update'
  | 'system_notice'

export type NotificationEvent = {
  eventId: string
  recipientId?: string | null
  recipientRole: string
  eventType: NotificationEventType
  targetType: string
  targetId: string
  title: string
  summary: string
  status: NotificationStatus
  createdAt: string
  readAt?: string | null
  archivedAt?: string | null
  metadata: Record<string, unknown>
  actorId?: string | null
  actorRole?: string | null
  deliveryId?: string | null
  deliveryAttempt?: number | null
}

export type NotificationListResponse = { items: NotificationEvent[]; count: number }

export type RealtimeNotificationEnvelope = {
  eventId?: string
  eventType?: NotificationEventType | string
  recipientId?: string | null
  recipientRole?: string | null
  targetType?: string | null
  targetId?: string | null
  title?: string | null
  summary?: string | null
  createdAt?: string | null
  metadata?: Record<string, unknown> | null
  deliveryId?: string | null
  deliveryAttempt?: number | null
}
