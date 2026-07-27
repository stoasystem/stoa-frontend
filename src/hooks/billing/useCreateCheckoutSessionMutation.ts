import { useMutation } from '@tanstack/react-query'
import { enablePayment } from '@/lib/env'
import { createCheckoutSession } from '@/services/billing/billingApi'
import { trackEvent } from '@/services/analytics/analyticsClient'
import type { PurchasablePlan } from '@/types/billing'

function generateIdempotencyKey(): string {
  const array = new Uint8Array(18)
  crypto.getRandomValues(array)
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('')
}

export type CreateCheckoutInput = {
  plan: PurchasablePlan
  beneficiaryIds: string[]
}

export function useCreateCheckoutSessionMutation() {
  return useMutation({
    mutationFn: async ({ plan, beneficiaryIds }: CreateCheckoutInput) => {
      if (!enablePayment) {
        throw new Error('Contact STOA to continue with a paid plan.')
      }

      trackEvent('checkout_started', { plan })

      const idempotencyKey = generateIdempotencyKey()
      const result = await createCheckoutSession(plan, beneficiaryIds, idempotencyKey)
      return result
    },
    onSuccess: (data) => {
      // Store checkoutRef in sessionStorage so CheckoutResultPage can pick it up
      // even if the user lands back via browser redirect from Stripe.
      sessionStorage.setItem('stoa_checkout_ref', data.checkoutRef)
      window.location.href = data.checkoutUrl
    },
  })
}
