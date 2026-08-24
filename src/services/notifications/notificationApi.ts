import { httpClient } from '@/services/api/httpClient'

import type { NotificationEvent, NotificationListResponse } from '@/types/notification'

export async function getNotifications() {
  const response = await httpClient.get<NotificationListResponse>('/notifications')
  return response.data
}

export async function getAdminNotifications() {
  const response = await httpClient.get<NotificationListResponse>('/admin/notifications')
  return response.data
}

export async function markNotificationRead(eventId: string) {
  const response = await httpClient.post<NotificationEvent>(`/notifications/${eventId}/read`)
  return response.data
}

export async function archiveNotification(eventId: string) {
  const response = await httpClient.post<NotificationEvent>(`/notifications/${eventId}/archive`)
  return response.data
}
