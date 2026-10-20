import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  archiveNotification,
  getAdminNotifications,
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
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

export function useUnreadNotificationCountQuery() {
  return useQuery({
    queryKey: notificationQueryKeys.unreadCount(),
    queryFn: getUnreadNotificationCount,
    staleTime: 30_000,
    retry: false,
  })
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
