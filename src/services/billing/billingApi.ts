import { httpClient } from '@/services/api/httpClient'
import type { SubscriptionPlan, SubscriptionStatus } from '@/types/user'

export type Subscription = {
  status: SubscriptionStatus
  plan: SubscriptionPlan
  currentPeriodEnd?: string
}

export async function getSubscription() {
  const response = await httpClient.get<Subscription>('/billing/subscription')
  return response.data
}

export async function createCheckoutSession(plan: SubscriptionPlan) {
  const response = await httpClient.post<{ checkoutUrl: string }>(
    '/billing/checkout-session',
    { plan },
  )
  return response.data
}
