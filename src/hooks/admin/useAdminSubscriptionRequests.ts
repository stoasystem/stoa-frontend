import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  applySubscriptionRequest,
  getSubscriptionRequest,
  getSubscriptionRequests,
  updateSubscriptionRequest,
} from '@/services/admin/adminApi'
import { adminQueryKeys } from '@/services/admin/adminQueryKeys'
import type { SubscriptionRequestFilters } from '@/types/subscriptionOperations'

export function useAdminSubscriptionRequestsQuery(filters: SubscriptionRequestFilters) {
  return useQuery({
    queryKey: [...adminQueryKeys.subscriptionRequests(), filters],
    queryFn: () => getSubscriptionRequests(filters),
    retry: false,
  })
}

export function useAdminSubscriptionRequestQuery(requestId: string | null) {
  return useQuery({
    queryKey: [...adminQueryKeys.subscriptionRequests(), 'detail', requestId],
    queryFn: () => getSubscriptionRequest(requestId as string),
    enabled: Boolean(requestId),
    retry: false,
  })
}

export function useUpdateSubscriptionRequestMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateSubscriptionRequest,
    onSuccess: (request) => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.subscriptionRequests() })
      void queryClient.invalidateQueries({
        queryKey: [...adminQueryKeys.subscriptionRequests(), 'detail', request.requestId],
      })
    },
  })
}

export function useApplySubscriptionRequestMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: applySubscriptionRequest,
    onSuccess: (request) => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.subscriptionRequests() })
      void queryClient.invalidateQueries({
        queryKey: [...adminQueryKeys.subscriptionRequests(), 'detail', request.requestId],
      })
    },
  })
}
