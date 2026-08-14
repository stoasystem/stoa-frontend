import { httpClient } from '@/services/api/httpClient'
import { withDemoFallback } from '@/services/demo/demoFallback'
import type { NotificationEvent, NotificationListResponse } from '@/types/notification'

const mockNotifications: NotificationEvent[] = [
  {
    eventId: 'notif-demo-teacher-reply',
    recipientId: 'demo-student',
    recipientRole: 'student',
    eventType: 'teacher_reply',
    targetType: 'question',
    targetId: 'teacher-request-1',
    title: 'Teacher replied',
    summary: 'A tutor added a reply to your algebra question.',
    status: 'created',
    createdAt: '2026-06-08T10:00:00Z',
    readAt: null,
    archivedAt: null,
    metadata: { subject: 'Mathematics' },
    actorId: 'demo-tutor',
    actorRole: 'teacher',
  },
  {
    eventId: 'notif-demo-subscription',
    recipientId: null,
    recipientRole: 'admin',
    eventType: 'subscription_request_update',
    targetType: 'subscription_request',
    targetId: 'subreq-demo-1',
    title: 'Subscription request updated',
    summary: 'A parent requested a Standard plan review.',
    status: 'created',
    createdAt: '2026-06-08T09:45:00Z',
    readAt: null,
    archivedAt: null,
    metadata: { requested_tier: 'standard' },
    actorId: 'demo-parent',
    actorRole: 'parent',
  },
  {
    eventId: 'notif-demo-moderation',
    recipientId: null,
    recipientRole: 'admin',
    eventType: 'moderation_case_update',
    targetType: 'moderation_case',
    targetId: 'mod-demo-1',
    title: 'New moderation case',
    summary: 'High severity assistant answer report opened.',
    status: 'read',
    createdAt: '2026-06-08T09:35:00Z',
    readAt: '2026-06-08T09:40:00Z',
    archivedAt: null,
    metadata: { severity: 'high' },
    actorId: 'demo-student',
    actorRole: 'student',
  },
]

export async function getNotifications() {
  return withDemoFallback(async () => {
    const response = await httpClient.get<NotificationListResponse>('/notifications')
    return response.data
  }, { items: mockNotifications, count: mockNotifications.length })
}

export async function getAdminNotifications() {
  return withDemoFallback(async () => {
    const response = await httpClient.get<NotificationListResponse>('/admin/notifications')
    return response.data
  }, {
    items: mockNotifications.filter((event) => event.recipientRole === 'admin'),
    count: mockNotifications.filter((event) => event.recipientRole === 'admin').length,
  })
}

export async function markNotificationRead(eventId: string) {
  return withDemoFallback(async () => {
    const response = await httpClient.post<NotificationEvent>(`/notifications/${eventId}/read`)
    return response.data
  }, () => ({
    ...mockNotifications.find((event) => event.eventId === eventId)!,
    status: 'read' as const,
    readAt: new Date().toISOString(),
  }))
}

export async function archiveNotification(eventId: string) {
  return withDemoFallback(async () => {
    const response = await httpClient.post<NotificationEvent>(`/notifications/${eventId}/archive`)
    return response.data
  }, () => ({
    ...mockNotifications.find((event) => event.eventId === eventId)!,
    status: 'archived' as const,
    archivedAt: new Date().toISOString(),
  }))
}
