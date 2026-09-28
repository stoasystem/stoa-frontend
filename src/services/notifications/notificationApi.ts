import { httpClient } from '@/services/api/httpClient'

import type {
  NotificationEvent,
  NotificationListResponse,
  NotificationPreferenceMatrix,
  NotificationPreferences,
} from '@/types/notification'

export async function getNotifications() {
  const response = await httpClient.get<NotificationListResponse>('/notifications')
  return response.data
}

export async function getAdminNotifications() {
  const response = await httpClient.get<NotificationListResponse>('/admin/notifications')
  return response.data
}

export async function markNotificationRead(eventId: string) {
  const response = await httpClient.post<NotificationEvent>(`/notifications/${encodeURIComponent(eventId)}/read`)
  return response.data
}

export async function archiveNotification(eventId: string) {
  const response = await httpClient.post<NotificationEvent>(`/notifications/${encodeURIComponent(eventId)}/archive`)
  return response.data
}

export async function getNotificationPreferences() {
  const response = await httpClient.get<NotificationPreferences>('/notifications/preferences')
  return response.data
}

/*
 * The backend rebuilds the whole matrix from its defaults and the body, so a
 * category or channel left out of `preferences` goes back to its default.
 * Always send the full matrix the last GET returned, with the change applied.
 */
export async function updateNotificationPreferences(preferences: NotificationPreferenceMatrix) {
  const response = await httpClient.patch<NotificationPreferences>('/notifications/preferences', { preferences })
  return response.data
}
