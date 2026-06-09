import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createParentCheckoutSession,
  createParentSubscriptionRequest,
  getParentSubscription,
  getParentSubscriptionBilling,
  getParentSubscriptionRequests,
} from '@/services/parent/parentApi'
import { parentQueryKeys } from '@/services/parent/parentQueryKeys'
import type { CreateCheckoutSessionInput, CreateSubscriptionRequestInput } from '@/types/subscriptionOperations'

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

export function useParentSubscriptionBillingQuery() {
  return useQuery({
    queryKey: parentQueryKeys.subscriptionBilling(),
    queryFn: getParentSubscriptionBilling,
    retry: false,
  })
}

export function useCreateParentCheckoutSessionMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateCheckoutSessionInput) => createParentCheckoutSession(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: parentQueryKeys.subscription() })
      void queryClient.invalidateQueries({ queryKey: parentQueryKeys.subscriptionBilling() })
    },
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
