import { useMutation } from '@tanstack/react-query'
import { enableMockCheckout, enablePayment } from '@/lib/env'
import { createCheckoutSession } from '@/services/billing/billingApi'
import { trackEvent } from '@/services/analytics/analyticsClient'
import type { SubscriptionPlan } from '@/types/user'

export function useCreateCheckoutSessionMutation() {
  return useMutation({
    mutationFn: async (plan: SubscriptionPlan) => {
      trackEvent('billing_checkout_started', { plan, mode: enableMockCheckout ? 'mock' : 'hosted' })

      if (enableMockCheckout) {
        return { checkoutUrl: `/billing/checkout/demo?plan=${plan}` }
      }

      if (!enablePayment) {
        throw new Error('Payment is not enabled for this environment.')
      }

      return createCheckoutSession(plan)
    },
    onSuccess: (data) => {
      window.location.href = data.checkoutUrl
    },
  })
}
