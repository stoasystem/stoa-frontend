import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getNotificationPreferences,
  updateDispatchEmail,
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
    // One write at a time: a second toggle waits for the first to land and
    // then builds from its own fresh read, so neither undoes the other.
    scope: { id: 'notification-preferences' },
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

/*
 * A teacher's dispatch email switch (stoa-backend#141). It is written on its
 * own, so the matrix is not read first; it still waits in the same line as a
 * matrix write, so the two never cross.
 */
export function useUpdateDispatchEmailMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    scope: { id: 'notification-preferences' },
    mutationFn: updateDispatchEmail,
    onSuccess: (saved) => {
      queryClient.setQueryData(notificationQueryKeys.preferences(), saved)
    },
  })
}
