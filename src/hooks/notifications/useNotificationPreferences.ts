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

export function useUpdateNotificationPreferencesMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (preferences: NotificationPreferenceMatrix) => updateNotificationPreferences(preferences),
    // The answer is the stored matrix; show that, not what was sent.
    onSuccess: (saved) => {
      queryClient.setQueryData(notificationQueryKeys.preferences(), saved)
    },
  })
}
