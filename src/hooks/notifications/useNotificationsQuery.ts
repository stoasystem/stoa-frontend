import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  archiveNotification,
  getAdminNotifications,
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  NOTIFICATION_PAGE_SIZE,
} from '@/services/notifications/notificationApi'
import { notificationQueryKeys } from '@/services/notifications/notificationQueryKeys'

export function useNotificationsQuery(enabled = true) {
  return useQuery({
    queryKey: notificationQueryKeys.list(),
    queryFn: getNotifications,
    staleTime: 30_000,
    enabled,
    retry: false,
  })
}

/*
 * The bell's unread count. A list short of a full page holds every
 * notification there is, so its unread ones are counted from it, with no
 * second request on every poll (#387). A full page can leave older unread
 * ones out (#373): only then is the count read on its own.
 */
export function useUnreadNotificationCountQuery() {
  const items = useNotificationsQuery().data?.items
  const fullPage = items !== undefined && items.length >= NOTIFICATION_PAGE_SIZE
  const separate = useQuery({
    queryKey: notificationQueryKeys.unreadCount(),
    queryFn: getUnreadNotificationCount,
    staleTime: 30_000,
    enabled: fullPage,
    retry: false,
  })
  if (items === undefined || fullPage) return { data: separate.data }
  return { data: items.filter((item) => item.status === 'created').length }
}

export function useAdminNotificationsQuery() {
  return useQuery({
    queryKey: notificationQueryKeys.adminList(),
    queryFn: getAdminNotifications,
    staleTime: 30_000,
  })
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: notificationQueryKeys.list() }),
        queryClient.invalidateQueries({ queryKey: notificationQueryKeys.adminList() }),
      ])
    },
  })
}

export function useArchiveNotificationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: archiveNotification,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: notificationQueryKeys.list() }),
        queryClient.invalidateQueries({ queryKey: notificationQueryKeys.adminList() }),
      ])
    },
  })
}
