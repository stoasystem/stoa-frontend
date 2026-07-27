import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getCheckoutStatus, recheckCheckout } from '@/services/billing/billingApi'
import type { CheckoutOutcome } from '@/types/billing'

const TERMINAL_OUTCOMES: CheckoutOutcome[] = ['active', 'not_completed', 'support_needed']

export function useCheckoutStatusQuery(checkoutRef: string | null) {
  return useQuery({
    queryKey: ['checkout-status', checkoutRef],
    queryFn: () => getCheckoutStatus(checkoutRef!),
    enabled: Boolean(checkoutRef),
    refetchInterval: (query) => {
      const outcome = query.state.data?.outcome
      if (!outcome || TERMINAL_OUTCOMES.includes(outcome)) return false
      // Poll every 3 s while still confirming
      return 3000
    },
    refetchIntervalInBackground: false,
    retry: 3,
  })
}

export function useRecheckCheckoutMutation(checkoutRef: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => recheckCheckout(checkoutRef!),
    onSuccess: (data) => {
      queryClient.setQueryData(['checkout-status', checkoutRef], data)
    },
  })
}
