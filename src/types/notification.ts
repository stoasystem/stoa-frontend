export type NotificationStatus = 'created' | 'read' | 'archived' | 'failed'

export type NotificationEventType =
  | 'teacher_requested'
  | 'teacher_takeover'
  | 'teacher_reply'
  | 'teacher_help_dispatched'
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

/*
 * GET / PATCH /notifications/preferences. Categories and channels are the
 * backend's (`notification_service.PREFERENCE_CATEGORIES` / `_CHANNELS`); the
 * response lists which ones it supports.
 */
export type NotificationPreferenceCategory =
  | 'learning_updates'
  | 'teacher_responses'
  | 'assignments'
  | 'weekly_reports'
  | 'admin_operations'

export type NotificationPreferenceChannel = 'in_app' | 'realtime' | 'email_digest' | 'push'

export type NotificationPreferenceMatrix = Record<string, Partial<Record<NotificationPreferenceChannel, boolean>>>

export type NotificationPreferences = {
  userId: string
  preferences: NotificationPreferenceMatrix
  /** A teacher's reminder email for each help request offered to them (stoa-backend#141). */
  dispatchEmail: boolean
  /** A parent's weekly report by email, on by default; off stops only the email (stoa-backend#363). */
  weeklyReportEmail: boolean
  supportedCategories: string[]
  supportedChannels: string[]
  updatedAt?: string | null
}

/** The kinds of email an unsubscribe link can stop (stoa-backend#363). */
export type EmailSubscriptionKind = 'weekly_report' | 'dispatch_reminder' | 'notification_digest'

/** `EmailSubscriptionResponse`: which email the link names, and whether it is sent now. */
export type EmailSubscription = {
  /** One of `EmailSubscriptionKind`; a string, since a newer backend may name another. */
  kind: string
  subscribed: boolean
}
