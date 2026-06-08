export type NotificationStatus = 'created' | 'read' | 'archived' | 'failed'

export type NotificationEventType =
  | 'teacher_requested'
  | 'teacher_takeover'
  | 'teacher_reply'
  | 'moderation_case_update'
  | 'subscription_request_update'
  | 'learning_profile_update'

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
}

export type NotificationListResponse = { items: NotificationEvent[]; count: number }
