import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '@/services/notifications/notificationApi'
import { notificationQueryKeys } from '@/services/notifications/notificationQueryKeys'
import type { NotificationPreferenceMatrix } from '@/types/notification'

export function useNotificationPreferencesQuery() {
  return useQuery({
    queryKey: notificationQueryKeys.preferences(),
    queryFn: getNotificationPreferences,
    staleTime: 60_000,
    retry: false,
  })
}

/*
 * The backend replaces the whole matrix on every PATCH, so the change is
 * applied to the matrix as it is on the server now, read again just before
 * the write, and not to whatever this page loaded: a /me left open for an
 * hour must not undo a change made since on another device.
 */
export function useUpdateNotificationPreferencesMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (change: (matrix: NotificationPreferenceMatrix) => NotificationPreferenceMatrix) => {
      const current = await queryClient.fetchQuery({
        queryKey: notificationQueryKeys.preferences(),
        queryFn: getNotificationPreferences,
        staleTime: 0,
      })
      return updateNotificationPreferences(change(current.preferences))
    },
    // The answer is the stored matrix; show that, not what was sent.
    onSuccess: (saved) => {
      queryClient.setQueryData(notificationQueryKeys.preferences(), saved)
    },
  })
}
