import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createParentSubscriptionRequest,
  getParentSubscription,
  getParentSubscriptionRequests,
} from '@/services/parent/parentApi'
import { parentQueryKeys } from '@/services/parent/parentQueryKeys'
import type { CreateSubscriptionRequestInput } from '@/types/subscriptionOperations'

export function useParentSubscriptionQuery() {
  return useQuery({
    queryKey: parentQueryKeys.subscription(),
    queryFn: getParentSubscription,
    retry: false,
  })
}

export function useParentSubscriptionRequestsQuery() {
  return useQuery({
    queryKey: parentQueryKeys.subscriptionRequests(),
    queryFn: getParentSubscriptionRequests,
    retry: false,
  })
}

export function useCreateParentSubscriptionRequestMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateSubscriptionRequestInput) => createParentSubscriptionRequest(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: parentQueryKeys.subscription() })
      void queryClient.invalidateQueries({ queryKey: parentQueryKeys.subscriptionRequests() })
    },
  })
}
