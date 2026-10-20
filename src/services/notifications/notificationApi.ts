import { apiPath } from '@/services/api/apiPath'
import { httpClient } from '@/services/api/httpClient'

import type {
  NotificationEvent,
  NotificationListResponse,
  NotificationPreferenceMatrix,
  NotificationPreferences,
} from '@/types/notification'

// The bell's list is one page of the newest. Asked for, not left to the
// backend's default: a list shorter than this holds every notification there
// is, and the bell counts its unread ones from it (#387).
export const NOTIFICATION_PAGE_SIZE = 50

export async function getNotifications() {
  const response = await httpClient.get<NotificationListResponse>('/notifications', {
    params: { limit: NOTIFICATION_PAGE_SIZE },
  })
  return response.data
}

// The most `limit` the backend takes; past it the bell reads "99+".
export const UNREAD_COUNT_LIMIT = 100

/*
 * The bell's unread count, read on its own (#373). `GET /notifications` holds
 * the newest 50, so counting `created` among them missed older unread ones.
 * The backend's `count` is the number of items it returned, so this one is
 * exact up to the limit.
 */
export async function getUnreadNotificationCount() {
  const response = await httpClient.get<NotificationListResponse>('/notifications', {
    params: { status: 'created', limit: UNREAD_COUNT_LIMIT },
  })
  return response.data.count
}

export async function getAdminNotifications() {
  const response = await httpClient.get<NotificationListResponse>('/admin/notifications')
  return response.data
}

export async function markNotificationRead(eventId: string) {
  const response = await httpClient.post<NotificationEvent>(apiPath`/notifications/${eventId}/read`)
  return response.data
}

export async function archiveNotification(eventId: string) {
  const response = await httpClient.post<NotificationEvent>(apiPath`/notifications/${eventId}/archive`)
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
